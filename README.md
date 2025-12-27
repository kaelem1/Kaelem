# Qwen VL 图像精准标注工具

基于阿里云通义千问视觉模型(Qwen VL)的图像区域识别与覆盖工具。

## 功能特性

- 上传任意分辨率图像
- 使用自然语言描述需要识别的区域
- 调用Qwen VL API自动识别目标区域
- 返回精确的bounding box坐标
- 自动用白色色块覆盖识别区域
- 支持识别关联模块（如"结账明细"包含日期、金额等子区域）

## 快速开始

### 1. 获取API Key

访问阿里云DashScope控制台获取API Key:
https://dashscope.console.aliyun.com/

### 2. 安装依赖

```bash
cd /Users/kaelem/dev/img_ai
pip install -r requirements.txt
```

### 3. 配置API Key

```bash
cp .env.example .env
# 编辑.env文件，填入你的API Key
```

或直接设置环境变量:
```bash
export DASHSCOPE_API_KEY="your_api_key_here"
```

### 4. 运行

**方式一：Web界面（推荐）**

```bash
python app.py
```

然后访问 http://127.0.0.1:5000

**方式二：命令行**

```bash
python annotator.py <图像路径> "<识别指令>" [-o 输出路径]
```

示例:
```bash
python annotator.py invoice.png "识别发票上的金额和日期"
python annotator.py receipt.jpg "找出结账明细区域，包括收款人、金额、日期" -o result.jpg
```

## 使用示例

### 指令示例

| 场景 | 指令示例 |
|------|----------|
| 发票处理 | "识别发票上的金额、日期、发票号码" |
| 收据脱敏 | "找出收据上的个人信息，包括姓名、电话、地址" |
| 文档处理 | "标注文档中的签名区域" |
| 表单识别 | "识别表单中的所有填写内容区域" |
| 人脸模糊 | "找出图片中的所有人脸" |

### 关联模块识别

当指令涉及包含关系时，系统会自动识别主区域及其子区域：

```
指令："识别结账明细，包括日期、金额、收款人"

输出：
- 结账明细（主区域）: (100, 200) -> (500, 600)
- 日期: (110, 220) -> (200, 250)
- 金额: (110, 260) -> (200, 290)
- 收款人: (110, 300) -> (250, 330)
```

## 文件结构

```
img_ai/
├── annotator.py      # 核心处理模块（API调用、坐标解析、图像处理）
├── app.py            # Flask Web界面
├── requirements.txt  # Python依赖
├── .env.example      # 环境变量示例
├── .env              # 你的API Key配置（需自行创建）
├── uploads/          # 上传文件存储目录（自动创建）
└── README.md         # 本文件
```

## API说明

### 核心函数

```python
from annotator import process_image, call_qwen_vl, mask_regions

# 完整处理流程
result = process_image("input.jpg", "识别所有文字区域", "output.jpg")

# 仅调用API获取坐标
result = call_qwen_vl("input.jpg", "识别金额区域")
print(result['boxes'])  # [{'name': '金额', 'x1': 100, 'y1': 200, 'x2': 300, 'y2': 250}]

# 仅覆盖指定区域
boxes = [{'name': 'test', 'x1': 100, 'y1': 100, 'x2': 200, 'y2': 200}]
mask_regions("input.jpg", boxes, "output.jpg")
```

## 注意事项

1. **API计费**: Qwen VL API按调用次数计费，请注意使用量
2. **图像大小**: 建议图像不超过10MB，过大可能影响处理速度
3. **识别精度**: 模型识别精度取决于图像质量和指令清晰度
4. **坐标格式**: 模型返回0-1000的归一化坐标，程序会自动转换为实际像素坐标

## 后续优化建议

如果MVP验证成功，可考虑添加：

1. 支持批量图像处理
2. 自定义覆盖颜色（如马赛克、模糊效果）
3. 支持更多输出格式（JSON坐标导出）
4. 添加历史记录功能
5. 支持区域编辑（手动调整坐标）
