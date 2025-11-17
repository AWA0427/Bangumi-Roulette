# backend_api.py
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import threading
import time
from urllib.parse import urlparse, parse_qs
from http.server import BaseHTTPRequestHandler, HTTPServer
import sys
import os
import random
import webbrowser # 🚀 新增: 用于自动打开浏览器

# --- API 配置 (关键：REDIRECT_URI 必须与 Bangumi 注册的精确匹配) ---
BASE_URL = "https://api.bgm.tv"
OAUTH_TOKEN_URL = "https://bgm.tv/oauth/access_token"
CLIENT_ID = 'bgm4227688cbad0a011f'
CLIENT_SECRET = '80c70b9f72838f50d626884231f43b05'
# 回调地址：这是 Python 后端监听的地址（必须与 Bangumi 注册的精确匹配）
REDIRECT_URI = "http://127.0.0.1:8000/callback" 

# --- 全局状态和 Flask App 初始化 ---
app = Flask(__name__)
# 允许来自前端开发地址 (http://localhost:5174) 的跨域请求
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5174", "http://127.0.0.1:5174"]}})

# --- 全局变量和本地服务器逻辑 (用于接收回调) ---
auth_code_global = None
httpd_instance = None 

# Flask API 运行端口 (请确保前端的 authService.ts 中的 BASE_URL 指向此端口，例如 5000)
FLASK_PORT = 5000 
# 前端开发服务器端口
FRONTEND_URL = "http://localhost:5174"

class CallbackHandler(BaseHTTPRequestHandler):
    """用于接收 OAuth 回调的自定义 HTTP 请求处理器"""
    def do_GET(self):
        global auth_code_global
        path = urlparse(self.path).path
        query = urlparse(self.path).query
        params = parse_qs(query)
        code = params.get('code', [None])[0]
        
        if path != '/callback':
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b'Not Found')
            return

        if code:
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            # 授权成功页面，确保关闭窗口或返回主页的逻辑
            success_message = '''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>授权成功</title>
                <script>
                    // 通知前端登录成功，并关闭此窗口 (如果它是在新窗口打开的)
                    window.opener.postMessage('auth_success', '*');
                    window.close();
                </script>
                <style>
                    body { font-family: sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    h1 { color: #4CAF50; margin-bottom: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>授权成功！</h1>
                    <p>正在自动关闭窗口并返回应用...</p>
                </div>
            </body>
            </html>
            '''
            self.wfile.write(success_message.encode('utf-8'))
            
            auth_code_global = code
        else:
            self.send_response(400)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'Authorization failed.')
        
    def log_message(self, format, *args):
        # 禁用默认日志输出
        pass

def run_http_server():
    """在单独线程中启动用于 OAuth 回调的 HTTP 服务器"""
    global httpd_instance
    try:
        # 启动用于接收回调的服务器，运行在 8000 端口 (OAuth 要求)
        server_address = ('127.0.0.1', 8000)
        # 使用 allow_reuse_address 确保端口能快速重用
        class ReusableTCPServer(HTTPServer):
            def server_bind(self):
                import socket
                self.socket.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
                HTTPServer.server_bind(self)

        httpd_instance = ReusableTCPServer(server_address, CallbackHandler) 
        print(f"服务器操作: 本地回调服务器已启动，监听端口 8000")
        httpd_instance.serve_forever()
    except Exception as e:
        print(f"服务器操作失败: 本地回调服务器启动失败: {e}", file=sys.stderr)

def stop_http_server():
    """停止 HTTP 服务器"""
    global httpd_instance
    if httpd_instance:
        print("服务器操作: 正在请求关闭本地回调服务器...")
        httpd_instance.shutdown()
        httpd_instance.server_close()
        print("服务器操作: 本地回调服务器已关闭。")

@app.route('/api/auth/token', methods=['POST'])
def exchange_token():
    """路由：从授权码交换访问令牌"""
    data = request.json
    code = data.get('code')

    if not code:
        return jsonify({'success': False, 'error': '未提供授权码'}), 400

    result = _exchange_code_for_token(code)
    return jsonify(result), 200 if result['success'] else 400

def _exchange_code_for_token(code):
    """执行 Access Token 交换的内部函数"""
    payload = {
        "grant_type": "authorization_code",
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "code": code,
        "redirect_uri": REDIRECT_URI
    }
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'BangumiRoulette (Web/1.0)'
    }
    
    try:
        response = requests.post(OAUTH_TOKEN_URL, data=payload, headers=headers, timeout=15)
        response.raise_for_status()
        
        token_data = response.json()
        access_token = token_data.get("access_token")
        
        if access_token:
            return {'success': True, 'access_token': access_token}
        else:
            return {'success': False, 'error': '未能从响应中获取 Access Token'}
            
    except requests.exceptions.HTTPError as err:
        try:
            error_details = response.json().get('error_description')
        except:
            error_details = response.text if response.status_code != 400 else str(err)
        return {'success': False, 'error': f"交换令牌失败: {response.status_code} - {error_details}"}
    except Exception as e:
        return {'success': False, 'error': f"交换令牌时发生错误: {str(e)}"}

@app.route('/api/user/info', methods=['GET'])
def get_user_info():
    """路由：获取当前用户信息"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'success': False, 'error': '缺少 Access Token'}), 401
    
    access_token = auth_header.split(' ')[1]
    result = _get_user_info(access_token)
    return jsonify(result), 200 if result['success'] else 400

def _get_user_info(access_token):
    """用访问令牌获取用户信息"""
    # 使用 /v0/users/-/me 获取当前用户
    url = f"{BASE_URL}/v0/users/-/me"
    headers = {
        'Authorization': f'Bearer {access_token}',
        'User-Agent': 'BangumiRoulette (Web/1.0)'
    }
    
    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        user_info = response.json()
        
        # 简化用户信息以供前端使用
        frontend_user_info = {
            'id': user_info.get('id'),
            'username': user_info.get('username'),
            'nickname': user_info.get('nickname'),
            'avatar_url': user_info.get('avatar', {}).get('large', '')
        }
        
        return {'success': True, 'user_info': frontend_user_info}
    except requests.exceptions.HTTPError as err:
        return {'success': False, 'error': f"获取用户信息失败: {response.status_code} {response.text}"}
    except Exception as e:
        return {'success': False, 'error': f"获取用户信息时发生错误: {str(e)}"}

@app.route('/api/collection', methods=['GET'])
def get_user_collection():
    """路由：获取用户的收藏列表并随机抽取一个条目"""
    auth_header = request.headers.get('Authorization')
    subject_type = request.args.get('subject_type')
    collection_status = request.args.get('type')
    user_id = request.args.get('user_id')
    nsfw_enabled = request.args.get('nsfw_enabled') == 'true'
    nsfw_only = request.args.get('nsfw_only') == 'true'

    if not all([auth_header, subject_type, collection_status, user_id]):
        return jsonify({'success': False, 'error': '缺少必要的参数或授权信息'}), 400

    access_token = auth_header.split(' ')[1]
    
    result = _fetch_and_select_random_item(access_token, user_id, subject_type, collection_status, nsfw_enabled, nsfw_only)
    return jsonify(result), 200 if result['success'] else 404

def _fetch_and_select_random_item(access_token, user_id, subject_type, collection_status, nsfw_enabled, nsfw_only):
    """获取收藏列表并随机选择一个条目"""
    # Bangumi API v0 的 collection 接口默认返回 25 条，这里设置为 50
    url = f"{BASE_URL}/v0/users/{user_id}/collections" 
    params = { 
        'subject_type': subject_type, 
        'type': collection_status, 
        'limit': 50 
    } 
    headers = { 
        'Authorization': f'Bearer {access_token}', 
        'User-Agent': 'BangumiRoulette (Web/1.0)' 
    }
    
    try:
        response = requests.get(url, params=params, headers=headers, timeout=15) 
        response.raise_for_status()
        
        collection_data = response.json().get('data', [])
        
        if not collection_data:
            return {"success": False, "error": "当前筛选条件下没有收藏内容"}
        
        processed_collection = []
        for item in collection_data:
            subject = item.get('subject', {})
            is_nsfw = subject.get('nsfw', False)
            
            # NSFW 过滤逻辑
            if not nsfw_enabled and is_nsfw: continue
            if nsfw_only and not is_nsfw: continue

            processed_collection.append({
                'id': subject.get('id'),
                'name': subject.get('name'), # 原名
                'name_cn': subject.get('name_cn', subject.get('name')), # 中文名
                'image': subject.get('images', {}).get('medium', ''),
                'summary': subject.get('summary', '暂无简介。'), 
                'category': subject_type,
                'status': collection_status
            })
        
        if not processed_collection:
            return {"success": False, "error": "根据当前 NSFW 设置和筛选条件，没有可用的收藏内容"}

        random_item = random.choice(processed_collection)
        
        return {'success': True, 'random_item': random_item}
    
    except requests.exceptions.RequestException as err:
        return {"success": False, "error": f"BGM API 请求错误: {str(err)}"}
    except Exception as e:
        return {"success": False, "error": f"获取收藏列表时发生错误: {str(e)}"}


# 🚀 自动打开浏览器函数
def open_browser_delayed(url, delay=2):
    """延迟打开浏览器以确保 Vite 服务器启动"""
    def _open():
        time.sleep(delay)
        print(f"自动操作: 正在打开浏览器到: {url}")
        webbrowser.open(url)
        
    threading.Thread(target=_open, daemon=True).start()

if __name__ == '__main__':
    # 1. 启动 OAuth 回调服务器线程 (用于接收授权码)
    threading.Thread(target=run_http_server, daemon=True, name="HttpServerThread").start()
    
    # 2. 延迟打开浏览器到前端地址
    open_browser_delayed(FRONTEND_URL, delay=3)
    
    # 3. 启动 Flask API 服务器
    print(f"--- 正在启动 Flask API 服务器 at http://127.0.0.1:{FLASK_PORT} ---")
    try:
        # Flask run 会阻塞，直到程序关闭
        app.run(host='127.0.0.1', port=FLASK_PORT, debug=False, use_reloader=False)
    except Exception as e:
        print(f"--- Flask API 启动失败: {e} ---", file=sys.stderr)
    finally:
        # 确保在程序关闭时停止 HTTP 服务器
        stop_http_server()