import webview
import json
import requests
import threading
import time
import base64
import os
import sys
import traceback
from datetime import datetime
from urllib.parse import urlencode, urlparse, parse_qs
from http.server import BaseHTTPRequestHandler, HTTPServer
from tkinter import filedialog
import win32api
import random

# API 配置
BASE_URL = "https://api.bgm.tv"
OAUTH_AUTHORIZE_URL = "https://bgm.tv/oauth/authorize"
OAUTH_TOKEN_URL = "https://bgm.tv/oauth/access_token"

CLIENT_ID = 'bgm4227688cbad0a011f'
CLIENT_SECRET = '80c70b9f72838f50d626884231f43b05'
REDIRECT_URI = "http://127.0.0.1:8000/callback"  

auth_code_global = None

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global auth_code_global
        query = urlparse(self.path).query
        params = parse_qs(query)
        code = params.get('code', [None])[0]
        
        if code:
            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            
            success_message = '''
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>授权成功</title>
                <style>
                    body { font-family: 'Microsoft YaHei', sans-serif; text-align: center; padding: 50px; background-color: #f5f5f5; }
                    .container { max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 12px; background: white; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    h1 { color: #4CAF50; margin-bottom: 20px; }
                    .btn { display: inline-block; padding: 10px 20px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>授权成功！</h1>
                    <p>您现在可以关闭此页面并返回应用程序。</p>
                    <a href="#" class="btn" onclick="window.close()">关闭页面</a>
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
        
        threading.Thread(target=self.server.shutdown, daemon=True).start()

class ApiHandler:
    def __init__(self):
        self.user_data = None
        self.user_id = None
        self.auth_token = None
        self.collection_data = {}
        self.nsfw_enabled = False
        self.nsfw_only = False
        self.log_messages = []
        self.history_data = []

    def log(self, message):
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        self.log_messages.append(log_entry)
        print(log_entry)
    
    # --- 日志功能 ---
    def get_logs(self):
        return {"success": True, "logs": self.log_messages}

    def export_log(self):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        default_filename = f"bangumi_roulette_log_{timestamp}.log"
        try:
            file_path = filedialog.asksaveasfilename(
                defaultextension=".log",
                filetypes=[("日志文件", "*.log"), ("文本文件", "*.txt"), ("所有文件", "*.*")],
                title="保存日志",
                initialfile=default_filename
            )
            if not file_path:
                return {"success": False, "error": "用户取消保存"}
            with open(file_path, "w", encoding="utf-8") as f:
                for log_entry in self.log_messages:
                    f.write(log_entry + "\n")
            self.log(f"日志已导出到: {file_path}")
            return {"success": True, "path": file_path}
        except Exception as e:
            self.log(f"导出日志失败: {str(e)}")
            return {"success": False, "error": str(e)}

    def clear_log(self):
        self.log_messages = []
        self.log("日志已清除")
        return {"success": True}

    # --- 历史记录功能 ---
    def get_history(self):
        return {"success": True, "history": self.history_data}

    def export_history(self):
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        default_filename = f"bangumi_roulette_history_{timestamp}.json"
        try:
            file_path = filedialog.asksaveasfilename(
                defaultextension=".json",
                filetypes=[("JSON文件", "*.json"), ("所有文件", "*.*")],
                title="保存历史记录",
                initialfile=default_filename
            )
            if not file_path:
                return {"success": False, "error": "用户取消保存"}
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(self.history_data, f, ensure_ascii=False, indent=2)
            self.log(f"历史记录已导出到: {file_path}")
            return {"success": True, "path": file_path}
        except Exception as e:
            self.log(f"导出历史记录失败: {str(e)}")
            return {"success": False, "error": str(e)}

    def clear_history(self):
        self.history_data = []
        self.log("历史记录已清除")
        return {"success": True}

    # --- 设置相关功能 ---
    def get_system_accent_color(self):
        try:
            key = win32api.RegOpenKey(win32api.HKEY_CURRENT_USER, r"Software\Microsoft\Windows\DWM")
            value, type_id = win32api.RegQueryValueEx(key, "AccentColor")
            win32api.RegCloseKey(key)
            bgr_color = value
            r = (bgr_color & 0x00FF0000) >> 16
            g = (bgr_color & 0x0000FF00) >> 8
            b = (bgr_color & 0x000000FF)
            return {"success": True, "color": f'#{r:02x}{g:02x}{b:02x}'}
        except Exception as e:
            self.log(f"获取系统强调色失败: {e}")
            return {"success": False, "error": str(e)}

    def get_nsfw_status(self):
        return {"success": True, "nsfw_enabled": self.nsfw_enabled}

    def set_nsfw_status(self, enabled):
        self.nsfw_enabled = enabled
        self.log(f"成人内容显示已更新为: {self.nsfw_enabled}")
        return {"success": True}
        
    def get_nsfw_only_status(self):
        return {"success": True, "nsfw_only": self.nsfw_only}

    def set_nsfw_only_status(self, enabled):
        self.nsfw_only = enabled
        self.log(f"仅显示成人内容已更新为: {self.nsfw_only}")
        return {"success": True}

    def get_user_info(self):
        if not self.user_data:
            return {"success": False, "error": "Not logged in"}
        return {"success": True, "user_data": self.user_data}

    # --- 登录功能 (函数名已修正为 start_login_flow) ---
    def start_login_flow(self):
        self.log("启动登录流程...")
        global auth_code_global
        auth_code_global = None

        server_address = ('127.0.0.1', 8000)
        httpd = HTTPServer(server_address, CallbackHandler)
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        self.log(f"本地服务器已启动，监听端口 {server_address[1]}")

        auth_url = (
            f"{OAUTH_AUTHORIZE_URL}?"
            f"client_id={CLIENT_ID}&"
            f"response_type=code&"
            f"redirect_uri={REDIRECT_URI}"
        )
        webview.windows[0].evaluate_js(f'window.open("{auth_url}", "_blank")')

        threading.Thread(target=self._wait_for_auth_code, args=(httpd,), daemon=True).start()
        return {"success": True}

    def _wait_for_auth_code(self, httpd):
        global auth_code_global
        while not auth_code_global:
            time.sleep(1)
        
        httpd.shutdown()
        self.log("本地服务器已关闭")
        self.get_access_token(auth_code_global)

    def get_access_token(self, code):
        self.log("正在使用授权码交换 Access Token...")
        payload = {
            "grant_type": "authorization_code",
            "client_id": CLIENT_ID,
            "client_secret": CLIENT_SECRET,
            "code": code,
            "redirect_uri": REDIRECT_URI
        }
        try:
            response = requests.post(OAUTH_TOKEN_URL, data=payload)
            response.raise_for_status()
            token_data = response.json()
            auth_token = token_data.get("access_token")
            if auth_token:
                self.log("成功获取 Access Token，开始获取用户信息...")
                self.auth_token = auth_token
                self.get_user_info_and_update_ui()
            else:
                self.log("未能从响应中获取 Access Token。")
                if webview.windows:
                    webview.windows[0].evaluate_js("window.showSnackbar('error', '登录失败：未能获取 Access Token')")
        except requests.exceptions.HTTPError as err:
            self.log(f"交换 Access Token 失败: {err} - {response.text}")
            if webview.windows:
                webview.windows[0].evaluate_js(f"window.showSnackbar('error', '登录失败: {str(err)}')")
        except Exception as e:
            self.log(f"发生未知错误: {e}")
            if webview.windows:
                webview.windows[0].evaluate_js(f"window.showSnackbar('error', '登录失败: {str(e)}')")

    def get_user_info_and_update_ui(self):
        if not self.auth_token:
            self.log("没有访问令牌，无法获取用户信息")
            return
        
        url = "https://api.bgm.tv/v0/me"
        headers = {
            'Authorization': f'Bearer {self.auth_token}',
            'User-Agent': 'BangumiWheel/1.0'
        }
        
        self.log(f"请求用户信息: {url}")
        
        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            user_info = response.json()
            self.user_data = user_info
            username = user_info['username']
            user_id = user_info['id']
            avatar_url = user_info.get('avatar', {}).get('large', '')

            self.log(f"当前用户: {username} (ID: {user_id})")
            
            if webview.windows:
                webview.windows[0].evaluate_js(
                    f"window.updateUserInfo({json.dumps({'username': username, 'user_id': user_id, 'avatar_url': avatar_url})})"
                )
        except requests.exceptions.HTTPError as err:
            self.log(f"获取用户信息失败: {err} - {response.text}")
            if webview.windows:
                webview.windows[0].evaluate_js(f"window.showSnackbar('error', '获取用户信息失败: {str(err)}')")
        except Exception as e:
            self.log(f"获取用户信息时发生错误: {str(e)}")
            if webview.windows:
                webview.windows[0].evaluate_js(f"window.showSnackbar('error', '获取用户信息时发生错误: {str(e)}')")

def start_app():
    api_handler = ApiHandler()
    
    window = webview.create_window(
        'Bangumi Roulette', 
        './ui/build/index.html',
        js_api=api_handler,
        width=1024,
        height=768
    )
    
    webview.start(debug=True)

if __name__ == '__main__':
    start_app()
