"""
Qwen VL 图像精准标注工具 - Web界面
提供简单的Web UI用于上传图像和输入指令
"""

import os
import uuid
from flask import Flask, request, render_template_string, send_file, jsonify
from werkzeug.utils import secure_filename
from annotator import process_image, call_qwen_vl, mask_regions

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['UPLOAD_FOLDER'] = os.path.join(os.path.dirname(__file__), 'uploads')

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

HTML_TEMPLATE = """
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Qwen VL 图像精准标注工具</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        h1 { color: #333; text-align: center; }
        .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .form-group { margin-bottom: 20px; }
        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #444;
        }
        input[type="file"], input[type="text"], textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #ddd;
            border-radius: 6px;
            font-size: 16px;
        }
        textarea { min-height: 100px; resize: vertical; }
        input:focus, textarea:focus {
            border-color: #007bff;
            outline: none;
        }
        button {
            background: #007bff;
            color: white;
            padding: 14px 28px;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            cursor: pointer;
            width: 100%;
        }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
        .result {
            margin-top: 30px;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 6px;
        }
        .result h3 { margin-top: 0; }
        .images {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            margin-top: 15px;
        }
        .image-box {
            flex: 1;
            min-width: 300px;
        }
        .image-box img {
            max-width: 100%;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        .image-box h4 { margin: 0 0 10px 0; color: #666; }
        .boxes-list {
            background: white;
            padding: 15px;
            border-radius: 4px;
            margin-top: 15px;
        }
        .box-item {
            padding: 8px;
            background: #e9ecef;
            margin: 5px 0;
            border-radius: 4px;
            font-family: monospace;
        }
        .raw-response {
            background: #2d2d2d;
            color: #f8f8f2;
            padding: 15px;
            border-radius: 4px;
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 14px;
            max-height: 300px;
            overflow-y: auto;
        }
        .loading {
            text-align: center;
            padding: 40px;
            display: none;
        }
        .loading.active { display: block; }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #007bff;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error { color: #dc3545; background: #f8d7da; padding: 15px; border-radius: 4px; }
        .example {
            background: #e7f3ff;
            padding: 15px;
            border-radius: 6px;
            margin-bottom: 20px;
        }
        .example h4 { margin: 0 0 10px 0; color: #0056b3; }
        .example ul { margin: 0; padding-left: 20px; }
        .example li { margin: 5px 0; }
    </style>
</head>
<body>
    <h1>Qwen VL 图像精准标注工具</h1>

    <div class="container">
        <div class="example">
            <h4>使用说明</h4>
            <ul>
                <li>上传任意图像（支持JPG、PNG等格式）</li>
                <li>输入自然语言指令描述需要识别的区域</li>
                <li>系统会自动识别区域并用白色色块覆盖</li>
            </ul>
            <h4 style="margin-top:15px;">指令示例</h4>
            <ul>
                <li>"找出图中的所有文字区域"</li>
                <li>"识别结账明细，包括日期、金额、收款人"</li>
                <li>"标注图片中的人脸区域"</li>
                <li>"找出发票上的金额数字"</li>
            </ul>
        </div>

        <form id="uploadForm" enctype="multipart/form-data">
            <div class="form-group">
                <label for="image">选择图像文件</label>
                <input type="file" id="image" name="image" accept="image/*" required>
            </div>

            <div class="form-group">
                <label for="instruction">输入识别指令</label>
                <textarea id="instruction" name="instruction"
                    placeholder="例如：识别图中的结账明细区域，包括日期、金额、收款人等信息"
                    required></textarea>
            </div>

            <button type="submit" id="submitBtn">开始识别</button>
        </form>

        <div class="loading" id="loading">
            <div class="spinner"></div>
            <p>正在调用Qwen VL分析图像，请稍候...</p>
        </div>

        <div id="result"></div>
    </div>

    <script>
        document.getElementById('uploadForm').addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData();
            formData.append('image', document.getElementById('image').files[0]);
            formData.append('instruction', document.getElementById('instruction').value);

            document.getElementById('submitBtn').disabled = true;
            document.getElementById('loading').classList.add('active');
            document.getElementById('result').innerHTML = '';

            try {
                const response = await fetch('/process', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.error) {
                    document.getElementById('result').innerHTML =
                        '<div class="error">错误: ' + data.error + '</div>';
                } else {
                    let boxesHtml = '';
                    if (data.boxes && data.boxes.length > 0) {
                        boxesHtml = '<div class="boxes-list"><h4>识别到的区域:</h4>';
                        data.boxes.forEach(box => {
                            boxesHtml += `<div class="box-item">${box.name}: (${box.x1}, ${box.y1}) -> (${box.x2}, ${box.y2})</div>`;
                        });
                        boxesHtml += '</div>';
                    } else {
                        boxesHtml = '<p style="color:#666;">未识别到符合条件的区域</p>';
                    }

                    document.getElementById('result').innerHTML = `
                        <div class="result">
                            <h3>识别结果</h3>
                            ${boxesHtml}
                            <div class="images">
                                <div class="image-box">
                                    <h4>原始图像</h4>
                                    <img src="/image/${data.original_id}" alt="原始图像">
                                </div>
                                ${data.output_id ? `
                                <div class="image-box">
                                    <h4>处理后图像（白色覆盖）</h4>
                                    <img src="/image/${data.output_id}" alt="处理后图像">
                                    <p><a href="/image/${data.output_id}" download>下载处理后图像</a></p>
                                </div>
                                ` : ''}
                            </div>
                            <h4 style="margin-top:20px;">模型原始响应</h4>
                            <div class="raw-response">${data.raw_response}</div>
                        </div>
                    `;
                }
            } catch (err) {
                document.getElementById('result').innerHTML =
                    '<div class="error">请求失败: ' + err.message + '</div>';
            } finally {
                document.getElementById('submitBtn').disabled = false;
                document.getElementById('loading').classList.remove('active');
            }
        });
    </script>
</body>
</html>
"""


@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)


@app.route('/process', methods=['POST'])
def process():
    if 'image' not in request.files:
        return jsonify({'error': '请上传图像文件'}), 400

    file = request.files['image']
    instruction = request.form.get('instruction', '')

    if file.filename == '':
        return jsonify({'error': '请选择图像文件'}), 400

    if not instruction:
        return jsonify({'error': '请输入识别指令'}), 400

    try:
        # 生成唯一文件名
        ext = os.path.splitext(file.filename)[1] or '.png'
        file_id = str(uuid.uuid4())
        input_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}{ext}")
        output_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{file_id}_masked{ext}")

        # 保存上传的文件
        file.save(input_path)

        # 调用Qwen VL分析
        result = call_qwen_vl(input_path, instruction)

        response_data = {
            'raw_response': result['raw_response'],
            'boxes': result['boxes'],
            'original_id': f"{file_id}{ext}",
            'output_id': None
        }

        # 如果识别到区域，生成覆盖后的图像
        if result['boxes']:
            mask_regions(input_path, result['boxes'], output_path)
            response_data['output_id'] = f"{file_id}_masked{ext}"

        return jsonify(response_data)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/image/<filename>')
def serve_image(filename):
    """提供图像文件"""
    file_path = os.path.join(app.config['UPLOAD_FOLDER'], secure_filename(filename))
    if os.path.exists(file_path):
        return send_file(file_path)
    return "File not found", 404


if __name__ == '__main__':
    print("=" * 50)
    print("Qwen VL 图像精准标注工具")
    print("=" * 50)
    print("\n请确保已设置 DASHSCOPE_API_KEY 环境变量")
    print("访问 http://127.0.0.1:5000 开始使用\n")
    app.run(debug=True, host='127.0.0.1', port=5000)
