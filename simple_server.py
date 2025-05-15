from flask import Flask, jsonify, request
import logging
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app)

# 配置日志
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': '服务器连接成功'
    })

@app.route('/test')
def test():
    return jsonify({
        'status': 'success',
        'message': '测试路由成功'
    })

@app.route('/get_tasks')
def get_tasks():
    # 示例任务序列（实际可从数据库读取）
    return jsonify({
        'status': 'success',
        'task1': [4,5,4,5],
        'task2': [5,4,5,4],
        'task_seq': [1,2,1,2,2,1],
        'atom_time': 20,
        'task_total_time': 200,
        'total_duration': 3000
    })

@app.route('/upload', methods=['POST'])
def upload_csv():
    if 'file' not in request.files:
        return jsonify({'status': 'error', 'message': '未找到文件'}), 400

    file = request.files['file']
    filename = file.filename

    save_path = os.path.join('uploads', filename)
    os.makedirs('uploads', exist_ok=True)
    file.save(save_path)

    logger.info(f"已保存文件：{save_path}")
    return jsonify({'status': 'success', 'message': '文件上传成功'})

if __name__ == '__main__':
    try:
        port = 5000
        logger.info(f"服务器启动在端口 {port}")
        app.run(host='0.0.0.0', port=port)
    except Exception as e:
        logger.error(f"服务器启动失败: {e}")
