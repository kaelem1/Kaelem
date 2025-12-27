"""
Qwen VL 图像精准标注工具 - 核心模块
使用Qwen VL API识别图像区域并用白色色块覆盖
支持: DashScope (阿里云) 或 OpenRouter
"""

import os
import re
import json
import base64
import requests
from io import BytesIO
from PIL import Image
from dotenv import load_dotenv
from concurrent.futures import ThreadPoolExecutor, as_completed

# 加载环境变量
load_dotenv()

# API提供商选择
API_PROVIDER = os.getenv("API_PROVIDER", "openrouter")  # 默认使用openrouter

# OpenRouter 并行请求的模型列表
OPENROUTER_MODELS = [
    "qwen/qwen-vl-max",
    "google/gemini-3-flash-preview",
    "google/gemini-3-pro-preview",
]

# DashScope SDK (可选)
if API_PROVIDER == "dashscope":
    try:
        from dashscope import MultiModalConversation
    except ImportError:
        print("请安装dashscope: pip install dashscope")
        exit(1)


def encode_image_to_base64(image_path: str) -> str:
    """将图像编码为base64"""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def get_image_size(image_path: str) -> tuple:
    """获取图像尺寸"""
    with Image.open(image_path) as img:
        return img.size  # (width, height)


def build_detection_prompt(instruction: str) -> str:
    """
    构建检测prompt，要求模型返回bounding box坐标
    使用精准的语义区分策略：区分"标签"和"数据值"
    坐标是归一化的0-1000范围
    """
    prompt = f"""你是一个精准的UI元素标注专家，专门识别界面中的敏感业务数据。

【任务】{instruction}

【核心原则 - 精准区分标签与数值】
- 标签 = 描述性文字，告诉用户"这是什么字段"（不遮挡）
- 数值 = 实际数据，显示"具体是多少"（需遮挡）

【正确示例】
示例1 - 金融界面：
  显示："可用余额: 12,345.00 USDT"
  ✅ 只标注 "12,345.00 USDT"
  ❌ 不要标注 "可用余额:" 这个标签

示例2 - 运营数据：
  显示："单量: 1,234  人效: 56.7  TPH: 89"
  ✅ 分别标注 "1,234"、"56.7"、"89"
  ❌ 不要标注 "单量"、"人效"、"TPH" 这些指标名

示例3 - 表格数据：
  | 指标 | 今日 | 昨日 |
  | 订单数 | 500 | 480 |
  ✅ 只标注数值 "500"、"480"
  ❌ 不要标注表头和行标题

【禁止标注的元素】
- 字段标签、指标名称（如：单量、人效、TPH、成交量、持仓、余额、营收等）
- 表格的列标题、行标题
- 按钮文字、菜单项、导航栏
- 单独的符号（¥、$、%、件、单等单位词）
- 时间范围描述（如"今日"、"本周"、"环比"）

【需要标注的元素】
- 具体数字、金额、数量
- 百分比数值（如 +2.5%、-1.3%）
- 账户ID、用户名、手机号等
- 任何可能泄露业务规模或敏感信息的具体数值

【输出格式】
对每个需要遮挡的数据值：
<ref>简短描述</ref><box>(x1,y1),(x2,y2)</box>
坐标使用归一化值(0-1000范围)

请开始精准识别，只标注数据值，不要标注标签："""
    return prompt


def parse_bounding_boxes(response_text: str, image_width: int, image_height: int) -> list:
    """
    解析模型返回的bounding box坐标
    支持多种格式:
    - <ref>名称</ref><box>(x1,y1),(x2,y2)</box>
    - <ref>名称</ref><box>(x1,y1,x2,y2)</box>
    - [[x1,y1,x2,y2]]
    - Gemini JSON: {"box_2d": [y1,x1,y2,x2], "label": "名称"}
    坐标是0-1000的归一化值，需要转换为实际像素坐标
    """
    boxes = []

    # 格式1: <ref>...</ref><box>(x1,y1),(x2,y2)</box>
    pattern1 = r'<ref>([^<]+)</ref><box>\((\d+),(\d+)\),\((\d+),(\d+)\)</box>'
    matches = re.findall(pattern1, response_text)
    for match in matches:
        name, x1, y1, x2, y2 = match
        boxes.append({
            "name": name.strip(),
            "x1": int(int(x1) * image_width / 1000),
            "y1": int(int(y1) * image_height / 1000),
            "x2": int(int(x2) * image_width / 1000),
            "y2": int(int(y2) * image_height / 1000)
        })

    # 格式2: <ref>...</ref><box>(x1,y1,x2,y2)</box> (4个数字用逗号分隔)
    if not boxes:
        pattern2 = r'<ref>([^<]+)</ref><box>\((\d+),(\d+),(\d+),(\d+)\)</box>'
        matches = re.findall(pattern2, response_text)
        for match in matches:
            name, x1, y1, x2, y2 = match
            boxes.append({
                "name": name.strip(),
                "x1": int(int(x1) * image_width / 1000),
                "y1": int(int(y1) * image_height / 1000),
                "x2": int(int(x2) * image_width / 1000),
                "y2": int(int(y2) * image_height / 1000)
            })

    # 格式3: [[x1,y1,x2,y2]]
    if not boxes:
        pattern3 = r'\[\[(\d+),(\d+),(\d+),(\d+)\]\]'
        matches = re.findall(pattern3, response_text)
        for i, match in enumerate(matches):
            x1, y1, x2, y2 = match
            boxes.append({
                "name": f"区域{i+1}",
                "x1": int(int(x1) * image_width / 1000),
                "y1": int(int(y1) * image_height / 1000),
                "x2": int(int(x2) * image_width / 1000),
                "y2": int(int(y2) * image_height / 1000)
            })

    # 格式4: Gemini JSON格式 {"box_2d": [y1,x1,y2,x2], "label": "名称"}
    if not boxes:
        try:
            # 尝试提取JSON数组
            json_match = re.search(r'\[[\s\S]*\]', response_text)
            if json_match:
                json_data = json.loads(json_match.group())
                for item in json_data:
                    if "box_2d" in item:
                        # Gemini格式: [y1, x1, y2, x2]
                        coords = item["box_2d"]
                        y1, x1, y2, x2 = coords[0], coords[1], coords[2], coords[3]
                        boxes.append({
                            "name": item.get("label", "区域"),
                            "x1": int(x1 * image_width / 1000),
                            "y1": int(y1 * image_height / 1000),
                            "x2": int(x2 * image_width / 1000),
                            "y2": int(y2 * image_height / 1000)
                        })
        except (json.JSONDecodeError, KeyError, IndexError):
            pass

    return boxes


def call_openrouter(image_path: str, instruction: str, model: str = "qwen/qwen-vl-max") -> dict:
    """
    调用OpenRouter API分析图像
    返回包含原始响应和解析后的bounding boxes
    """
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        raise ValueError("请设置OPENROUTER_API_KEY环境变量")

    # 获取图像尺寸
    width, height = get_image_size(image_path)

    # 构建prompt
    prompt = build_detection_prompt(instruction)

    # 将图像编码为base64
    image_base64 = encode_image_to_base64(image_path)

    # 检测图像格式
    ext = os.path.splitext(image_path)[1].lower()
    mime_type = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    }.get(ext, 'image/jpeg')

    # 推理模型需要更多tokens（用于思考过程）
    max_tokens = 16384 if "pro-preview" in model else 2048

    # 准备请求
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://img-annotator.local",
        "X-Title": "Image Annotator MVP"
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{image_base64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ],
        "max_tokens": max_tokens
    }

    # 调用API
    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers=headers,
        json=payload,
        timeout=120
    )

    if response.status_code != 200:
        raise Exception(f"OpenRouter API调用失败 [{model}]: {response.status_code} - {response.text}")

    result = response.json()

    # 提取响应文本
    response_text = result["choices"][0]["message"]["content"]

    # 解析bounding boxes
    boxes = parse_bounding_boxes(response_text, width, height)

    return {
        "model": model,
        "raw_response": response_text,
        "boxes": boxes,
        "image_size": {"width": width, "height": height}
    }


def call_openrouter_parallel(image_path: str, instruction: str) -> list:
    """
    并行调用多个VLM模型，返回所有结果
    """
    results = []

    with ThreadPoolExecutor(max_workers=len(OPENROUTER_MODELS)) as executor:
        futures = {
            executor.submit(call_openrouter, image_path, instruction, model): model
            for model in OPENROUTER_MODELS
        }

        for future in as_completed(futures):
            model = futures[future]
            try:
                result = future.result()
                results.append(result)
                print(f"✓ {model} 完成")
            except Exception as e:
                print(f"✗ {model} 失败: {e}")
                results.append({
                    "model": model,
                    "raw_response": f"错误: {e}",
                    "boxes": [],
                    "image_size": get_image_size(image_path)
                })

    return results


def call_dashscope(image_path: str, instruction: str) -> dict:
    """
    调用DashScope (阿里云) API分析图像
    返回包含原始响应和解析后的bounding boxes
    """
    api_key = os.getenv("DASHSCOPE_API_KEY")
    if not api_key:
        raise ValueError("请设置DASHSCOPE_API_KEY环境变量")

    # 获取图像尺寸
    width, height = get_image_size(image_path)

    # 构建prompt
    prompt = build_detection_prompt(instruction)

    # 准备消息 - 使用本地文件路径
    messages = [
        {
            "role": "user",
            "content": [
                {"image": f"file://{os.path.abspath(image_path)}"},
                {"text": prompt}
            ]
        }
    ]

    # 调用API
    response = MultiModalConversation.call(
        model="qwen-vl-max",
        messages=messages,
        api_key=api_key
    )

    if response.status_code != 200:
        raise Exception(f"API调用失败: {response.message}")

    # 提取响应文本
    response_text = response.output.choices[0].message.content[0]["text"]

    # 解析bounding boxes
    boxes = parse_bounding_boxes(response_text, width, height)

    return {
        "raw_response": response_text,
        "boxes": boxes,
        "image_size": {"width": width, "height": height}
    }


def call_qwen_vl(image_path: str, instruction: str) -> dict:
    """
    统一入口：根据配置选择API提供商
    """
    if API_PROVIDER == "openrouter":
        return call_openrouter(image_path, instruction)
    else:
        return call_dashscope(image_path, instruction)


def mask_regions(image_path: str, boxes: list, output_path: str, mask_color: tuple = (255, 255, 255)) -> str:
    """
    使用指定颜色（默认白色）覆盖图像中的指定区域
    """
    img = Image.open(image_path)

    # 确保图像是RGB模式
    if img.mode != "RGB":
        img = img.convert("RGB")

    # 创建绘图对象
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)

    # 覆盖每个区域
    for box in boxes:
        x1, y1, x2, y2 = box["x1"], box["y1"], box["x2"], box["y2"]
        draw.rectangle([x1, y1, x2, y2], fill=mask_color)

    # 保存结果
    img.save(output_path)
    return output_path


def get_model_short_name(model: str) -> str:
    """从模型全名提取短名用于文件命名"""
    # qwen/qwen-vl-max -> qwen-vl-max
    # google/gemini-2.5-flash-preview -> gemini-2.5-flash-preview
    return model.split("/")[-1]


def process_image(image_path: str, instruction: str, output_path: str = None, parallel: bool = True) -> dict:
    """
    主处理函数：分析图像 -> 识别区域 -> 覆盖区域
    parallel=True 时并行调用多个模型，每个模型生成独立输出文件
    """
    base, ext = os.path.splitext(image_path)

    print(f"正在分析图像: {image_path}")
    print(f"指令: {instruction}\n")

    if API_PROVIDER == "openrouter" and parallel:
        # 并行请求多个模型
        print(f"并行请求 {len(OPENROUTER_MODELS)} 个模型...\n")
        results = call_openrouter_parallel(image_path, instruction)

        all_results = []
        for result in results:
            model = result.get("model", "unknown")
            model_short = get_model_short_name(model)

            print(f"\n{'='*50}")
            print(f"模型: {model}")
            print(f"响应:\n{result['raw_response']}\n")
            print(f"识别到 {len(result['boxes'])} 个区域:")
            for box in result['boxes']:
                print(f"  - {box['name']}: ({box['x1']}, {box['y1']}) -> ({box['x2']}, {box['y2']})")

            # 每个模型生成独立的输出文件
            if result['boxes']:
                model_output = f"{base}_masked_{model_short}{ext}"
                mask_regions(image_path, result['boxes'], model_output)
                print(f"已保存: {model_output}")
                result['output_path'] = model_output
            else:
                result['output_path'] = None

            all_results.append(result)

        return {"parallel_results": all_results}

    else:
        # 单模型请求
        if output_path is None:
            output_path = f"{base}_masked{ext}"

        result = call_qwen_vl(image_path, instruction)

        print(f"\n模型响应:\n{result['raw_response']}\n")
        print(f"识别到 {len(result['boxes'])} 个区域:")
        for box in result['boxes']:
            print(f"  - {box['name']}: ({box['x1']}, {box['y1']}) -> ({box['x2']}, {box['y2']})")

        if result['boxes']:
            mask_regions(image_path, result['boxes'], output_path)
            print(f"\n已保存处理后的图像: {output_path}")
            result['output_path'] = output_path
        else:
            print("\n未识别到任何区域，未生成输出图像")
            result['output_path'] = None

        return result


# CLI入口
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="VLM 图像精准标注工具")
    parser.add_argument("image", help="输入图像路径")
    parser.add_argument("instruction", help="自然语言指令，描述需要识别的区域")
    parser.add_argument("-o", "--output", help="输出图像路径（单模型模式时使用）")
    parser.add_argument("--single", action="store_true", help="单模型模式（不并行）")

    args = parser.parse_args()

    if not os.path.exists(args.image):
        print(f"错误: 图像文件不存在: {args.image}")
        exit(1)

    try:
        result = process_image(args.image, args.instruction, args.output, parallel=not args.single)
    except Exception as e:
        print(f"错误: {e}")
        exit(1)
