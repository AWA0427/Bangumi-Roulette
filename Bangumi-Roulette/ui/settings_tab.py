import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from .components import MD3Card, MD3Button
import json
import logging
from datetime import datetime
import time
import sys
import os
import webbrowser
import urllib.parse
import requests
import threading
from http.server import HTTPServer, BaseHTTPRequestHandler
import traceback
from urllib.parse import urlencode

# 应用凭据
CLIENT_ID = 'bgm4227688cbad0a011f'
CLIENT_SECRET = '80c70b9f72838f50d626884231f43b05'
REDIRECT_URI = 'http://127.0.0.1:8000/callback'
AUTHORIZE_URL = 'https://bgm.tv/oauth/authorize'
TOKEN_URL = 'https://bgm.tv/oauth/access_token'

# 收藏类型映射
COLLECTION_TYPES = {
    "wish": 1,      # 想看
    "collect": 2,   # 看过
    "do": 3,        # 在看
    "on_hold": 4,   # 搁置
    "dropped": 5    # 抛弃
}

COLLECTION_NAMES = {
    1: "想看",
    2: "看过",
    3: "在看",
    4: "搁置",
    5: "抛弃"
}

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        # 解析回调URL中的授权码
        query = urllib.parse.urlparse(self.path).query
        params = urllib.parse.parse_qs(query)
        code = params.get('code', [None])[0]
        
        if code:
            # 发送成功响应
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
                    body { font-family: 'Microsoft YaHei', sans-serif; text-align: center; padding: 50px; }
                    .container { max-width: 500px; margin: 0 auto; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    h1 { color: #4CAF50; }
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
            
            # 存储授权码
            self.server.auth_code = code
        else:
            # 发送错误响应
            self.send_response(400)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.end_headers()
            self.wfile.write(b'Authorization failed.')
        
        # 在单独线程中关闭服务器
        threading.Thread(target=self.server.shutdown, daemon=True).start()

class SettingsTab(ttk.Frame):
    """设置标签页"""
    def __init__(self, parent, theme, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.theme = theme
        self.root = parent.winfo_toplevel()
        self.items = []  # 存储收藏项目
        self.filtered_items = []  # 存储筛选后的项目
        
        # 应用主题
        self.theme.apply_theme(self)
        self.configure(style="Card.TFrame")
        
        # 创建滚动区域
        self.canvas = tk.Canvas(self, highlightthickness=0, bd=0)
        self.scrollbar = ttk.Scrollbar(self, orient="vertical", command=self.canvas.yview, style="Vertical.TScrollbar")
        self.scrollable_frame = ttk.Frame(self.canvas)
        
        # 修复这里的括号问题
        self.scrollable_frame.bind(
            "<Configure>",
            lambda e: self.canvas.configure(scrollregion=self.canvas.bbox("all"))
        )
        
        self.canvas.create_window((0, 0), window=self.scrollable_frame, anchor="nw")
        self.canvas.configure(yscrollcommand=self.scrollbar.set)
        
        self.canvas.pack(side="left", fill="both", expand=True)
        self.scrollbar.pack(side="right", fill="y")
        
        # 填充内容
        self.create_content()
    
    def on_mousewheel(self, event):
        """处理鼠标滚轮事件"""
        self.canvas.yview_scroll(int(-1*(event.delta/120)), "units")
    
    def create_content(self):
        """创建设置页面内容"""
        # 登录区域
        login_frame = MD3Card(self.scrollable_frame, padding=16)
        login_frame.pack(fill="x", pady=8, padx=8)
        
        ttk.Label(login_frame, text="Bangumi账号", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 12))
        
        btn_frame = ttk.Frame(login_frame)
        btn_frame.pack(fill="x", pady=8)
        
        self.login_btn = MD3Button(btn_frame, text="登录Bangumi账号", accent=True,
                                  command=self.login)
        self.login_btn.pack(side="left", padx=8)
        
        self.fetch_btn = MD3Button(btn_frame, text="获取收藏列表", accent=True,
                                  command=self.fetch_collections)
        self.fetch_btn.pack(side="left", padx=8)
        
        # 状态标签
        self.status_var = tk.StringVar(value="就绪")
        status_frame = ttk.Frame(login_frame)
        status_frame.pack(fill="x", pady=4)
        ttk.Label(status_frame, text="状态:").pack(side="left", padx=4)
        ttk.Label(status_frame, textvariable=self.status_var).pack(side="left", padx=4)
        
        # 主题设置区域
        theme_frame = MD3Card(self.scrollable_frame, padding=16)
        theme_frame.pack(fill="x", pady=8, padx=8)
        
        ttk.Label(theme_frame, text="主题设置", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 12))
        
        # 主题模式选择
        mode_frame = ttk.Frame(theme_frame)
        mode_frame.pack(fill="x", pady=8)
        ttk.Label(mode_frame, text="主题模式:").pack(side="left", padx=8)
        
        self.mode_var = tk.StringVar(value="dark")
        mode_combo = ttk.Combobox(mode_frame, textvariable=self.mode_var, width=12, state="readonly")
        mode_combo['values'] = ("深色模式", "浅色模式")
        mode_combo.current(0)
        mode_combo.pack(side="left", padx=8)
        mode_combo.bind("<<ComboboxSelected>>", self.change_theme_mode)
        
        # 深色主题选择
        dark_frame = ttk.Frame(theme_frame)
        dark_frame.pack(fill="x", pady=8)
        ttk.Label(dark_frame, text="深色主题:").pack(side="left", padx=8)
        
        self.dark_theme_var = tk.StringVar(value=self.theme.dark_theme)
        dark_combo = ttk.Combobox(dark_frame, textvariable=self.dark_theme_var, width=16, state="readonly")
        dark_combo['values'] = list(self.theme.DARK_THEMES.keys())
        dark_combo.pack(side="left", padx=8)
        dark_combo.bind("<<ComboboxSelected>>", self.change_dark_theme)
        
        # 浅色主题选择
        light_frame = ttk.Frame(theme_frame)
        light_frame.pack(fill="x", pady=8)
        ttk.Label(light_frame, text="浅色主题:").pack(side="left", padx=8)
        
        self.light_theme_var = tk.StringVar(value=self.theme.light_theme)
        light_combo = ttk.Combobox(light_frame, textvariable=self.light_theme_var, width=16, state="readonly")
        light_combo['values'] = list(self.theme.LIGHT_THEMES.keys())
        light_combo.pack(side="left", padx=8)
        light_combo.bind("<<ComboboxSelected>>", self.change_light_theme)
        
        # 强调色选择
        accent_frame = ttk.Frame(theme_frame)
        accent_frame.pack(fill="x", pady=8)
        ttk.Label(accent_frame, text="强调色:").pack(side="left", padx=8)
        
        self.accent_var = tk.StringVar(value=self.theme.accent_color)
        accent_combo = ttk.Combobox(accent_frame, textvariable=self.accent_var, width=16, state="readonly")
        accent_combo['values'] = list(self.theme.ACCENT_COLORS.values())
        accent_combo.pack(side="left", padx=8)
        accent_combo.bind("<<ComboboxSelected>>", self.apply_accent_color)
        
        # 收藏筛选区域
        filter_frame = MD3Card(self.scrollable_frame, padding=16)
        filter_frame.pack(fill="x", pady=8, padx=8)
        
        ttk.Label(filter_frame, text="收藏筛选", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 12))
        
        # 列表类型选择
        ttk.Label(filter_frame, text="选择收藏列表:").pack(anchor="w", pady=8)
        
        # 使用正确的变量类型
        self.show_watching = tk.BooleanVar(value=True)
        self.show_wish = tk.BooleanVar(value=True)
        self.show_collect = tk.BooleanVar(value=True)
        self.show_on_hold = tk.BooleanVar(value=True)
        self.show_dropped = tk.BooleanVar(value=True)
        
        # 创建网格布局
        grid_frame = ttk.Frame(filter_frame)
        grid_frame.pack(fill="x", pady=8)
        
        # 第1行
        row1 = ttk.Frame(grid_frame)
        row1.pack(fill="x", pady=4)
        
        ttk.Checkbutton(row1, text="在看列表", variable=self.show_watching).pack(side="left", padx=8)
        self.show_nsfw_watching = tk.BooleanVar(value=False)
        ttk.Checkbutton(row1, text="显示NSFW", variable=self.show_nsfw_watching).pack(side="left", padx=8)
        
        # 第2行
        row2 = ttk.Frame(grid_frame)
        row2.pack(fill="x", pady=4)
        
        ttk.Checkbutton(row2, text="想看列表", variable=self.show_wish).pack(side="left", padx=8)
        self.show_nsfw_wish = tk.BooleanVar(value=False)
        ttk.Checkbutton(row2, text="显示NSFW", variable=self.show_nsfw_wish).pack(side="left", padx=8)
        
        # 第3行
        row3 = ttk.Frame(grid_frame)
        row3.pack(fill="x", pady=4)
        
        ttk.Checkbutton(row3, text="看过列表", variable=self.show_collect).pack(side="left", padx=8)
        self.show_nsfw_collect = tk.BooleanVar(value=False)
        ttk.Checkbutton(row3, text="显示NSFW", variable=self.show_nsfw_collect).pack(side="left", padx=8)
        
        # 第4行
        row4 = ttk.Frame(grid_frame)
        row4.pack(fill="x", pady=4)
        
        ttk.Checkbutton(row4, text="搁置列表", variable=self.show_on_hold).pack(side="left", padx=8)
        self.show_nsfw_on_hold = tk.BooleanVar(value=False)
        ttk.Checkbutton(row4, text="显示NSFW", variable=self.show_nsfw_on_hold).pack(side="left", padx=8)
        
        # 第5行
        row5 = ttk.Frame(grid_frame)
        row5.pack(fill="x", pady=4)
        
        ttk.Checkbutton(row5, text="抛弃列表", variable=self.show_dropped).pack(side="left", padx=8)
        self.show_nsfw_dropped = tk.BooleanVar(value=False)
        ttk.Checkbutton(row5, text="显示NSFW", variable=self.show_nsfw_dropped).pack(side="left", padx=8)
        
        # NSFW选项
        nsfw_frame = ttk.Frame(filter_frame)
        nsfw_frame.pack(fill="x", pady=8)
        self.only_nsfw = tk.BooleanVar(value=False)
        ttk.Checkbutton(nsfw_frame, text="仅显示NSFW内容", variable=self.only_nsfw).pack(side="left", padx=8)
        
        # 应用筛选按钮
        apply_btn = MD3Button(filter_frame, text="应用筛选", accent=True,
                             command=self.apply_filters)
        apply_btn.pack(pady=8)
        
        # 日志区域
        log_frame = MD3Card(self.scrollable_frame, padding=16)
        log_frame.pack(fill="x", pady=8, padx=8)
        
        ttk.Label(log_frame, text="操作日志", style="Subtitle.TLabel").pack(anchor="w", pady=(0, 12))
        
        # 日志控制按钮
        log_btn_frame = ttk.Frame(log_frame)
        log_btn_frame.pack(fill="x", pady=8)
        
        export_btn = MD3Button(log_btn_frame, text="导出日志", 
                              command=self.export_log)
        export_btn.pack(side="left", padx=8)
        
        clear_btn = MD3Button(log_btn_frame, text="清除日志", 
                             command=self.clear_log)
        clear_btn.pack(side="left", padx=8)
        
        # 日志文本框
        log_container = ttk.Frame(log_frame)
        log_container.pack(fill="both", expand=True)
        
        self.log_text = tk.Text(log_container, height=10, wrap="word",
                              bg=self.theme.get_surface_color(),
                              fg=self.theme.get_fg_color(),
                              font=("Segoe UI", 9),
                              padx=12, pady=12,
                              relief="flat",
                              borderwidth=0)
        
        scrollbar = ttk.Scrollbar(log_container, orient="vertical", style="Vertical.TScrollbar")
        scrollbar.pack(side="right", fill="y")
        
        self.log_text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=self.log_text.yview)
        
        self.log_text.pack(side="left", fill="both", expand=True)
        self.log_text.insert("1.0", "就绪\n")
        self.log_text.config(state="disabled")
        
        # 日志记录
        self.log_messages = []
        
        # 添加右键菜单
        self.log_menu = tk.Menu(self.log_text, tearoff=0)
        self.log_menu.add_command(label="复制", command=self.copy_log_text)
        self.log_text.bind("<Button-3>", self.show_log_menu)
        
        # 绑定鼠标滚轮
        self.log_text.bind("<MouseWheel>", self.on_mousewheel_log)
        
        # 初始日志
        self.log("设置页面初始化完成")
        self.log("应用程序已启动")
        self.log(f"Python版本: {sys.version}")
        self.log(f"操作系统: {os.name} {sys.platform}")
    
    def on_mousewheel_log(self, event):
        """处理日志文本框的鼠标滚轮事件"""
        self.log_text.yview_scroll(int(-1*(event.delta/120)), "units")
    
    def log(self, message):
        """记录日志信息"""
        timestamp = time.strftime("%H:%M:%S", time.localtime())
        log_entry = f"[{timestamp}] {message}"
        self.log_messages.append(log_entry)
        
        # 更新日志文本框
        self.log_text.config(state="normal")
        self.log_text.insert(tk.END, log_entry + "\n")
        self.log_text.config(state="disabled")
        self.log_text.see(tk.END)
    
    def change_theme_mode(self, event):
        """更改主题模式"""
        try:
            mode = self.mode_var.get()
            if mode == "深色模式":
                self.theme.current_theme = "dark"
            else:
                self.theme.current_theme = "light"
            
            self.theme.save_settings()
            self.theme.apply_theme(self.root)
            self.log(f"主题模式已切换为: {mode}")
        except Exception as e:
            logging.error(f"更改主题模式错误: {e}")
    
    def change_dark_theme(self, event):
        """更改深色主题"""
        try:
            self.theme.dark_theme = self.dark_theme_var.get()
            self.theme.save_settings()
            self.theme.apply_theme(self.root)
            self.log(f"深色主题已切换为: {self.theme.dark_theme}")
        except Exception as e:
            logging.error(f"更改深色主题错误: {e}")
    
    def change_light_theme(self, event):
        """更改浅色主题"""
        try:
            self.theme.light_theme = self.light_theme_var.get()
            self.theme.save_settings()
            self.theme.apply_theme(self.root)
            self.log(f"浅色主题已切换为: {self.theme.light_theme}")
        except Exception as e:
            logging.error(f"更改浅色主题错误: {e}")
    
    def apply_accent_color(self, event=None):
        """应用强调色"""
        try:
            color = self.accent_var.get()
            if color.startswith("#") and len(color) == 7:
                self.theme.accent_color = color
                self.theme.save_settings()
                self.theme.apply_theme(self.root)
                self.log(f"强调色已更新为: {color}")
        except Exception as e:
            logging.error(f"应用强调色错误: {e}")
    
    def copy_log_text(self):
        """复制日志文本"""
        try:
            self.log_text.config(state="normal")
            self.log_text.clipboard_clear()
            self.log_text.clipboard_append(self.log_text.get("1.0", "end"))
            self.log_text.config(state="disabled")
            self.log("已复制日志内容")
        except Exception as e:
            logging.error(f"复制日志错误: {e}")
    
    def show_log_menu(self, event):
        """显示日志右键菜单"""
        try:
            self.log_menu.tk_popup(event.x_root, event.y_root)
        except Exception as e:
            logging.error(f"显示日志菜单错误: {e}")
    
    def login(self):
        """启动OAuth登录流程"""
        self.log("启动登录流程...")
        
        # 生成授权链接
        params = {
            'client_id': CLIENT_ID,
            'response_type': 'code',
            'redirect_uri': REDIRECT_URI
        }
        auth_url = f"{AUTHORIZE_URL}?{urlencode(params)}"
        
        self.log(f"授权URL: {auth_url}")
        
        # 打开浏览器进行授权
        try:
            webbrowser.open(auth_url)
            self.log("已在浏览器中打开授权页面，请完成授权")
            self.status_var.set("等待授权...")
        except Exception as e:
            error_msg = f"打开浏览器失败: {str(e)}"
            self.log(error_msg)
            self.log(traceback.format_exc())
            messagebox.showerror("错误", f"无法打开浏览器: {str(e)}")
            return
        
        # 启动本地服务器接收回调
        self.log("启动本地服务器等待回调...")
        server_address = ('127.0.0.1', 8000)
        httpd = HTTPServer(server_address, CallbackHandler)
        httpd.auth_code = None
        
        # 在后台线程中运行服务器
        threading.Thread(target=httpd.serve_forever, daemon=True).start()
        self.log(f"本地服务器已启动，监听端口 {server_address[1]}")
        
        # 轮询等待授权码
        self.root.after(100, self.check_auth_code, httpd)
    
    def check_auth_code(self, httpd):
        """检查是否收到授权码"""
        if httpd.auth_code:
            code = httpd.auth_code
            self.log(f"收到授权码: {code}")
            httpd.shutdown()
            self.log("本地服务器已关闭")
            self.status_var.set("正在获取访问令牌...")
            self.get_access_token(code)
        else:
            self.root.after(100, self.check_auth_code, httpd)
    
    def get_access_token(self, code):
        """使用授权码获取访问令牌"""
        global access_token, refresh_token
        
        data = {
            'grant_type': 'authorization_code',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'code': code,
            'redirect_uri': REDIRECT_URI
        }
        headers = {
            'User-Agent': 'BangumiWheel/1.0',
            'Content-Type': 'application/x-www-form-urlencoded'
        }
        
        self.log(f"请求访问令牌: {TOKEN_URL}")
        self.log(f"请求参数: {data}")
        
        try:
            self.log("正在获取访问令牌...")
            response = requests.post(TOKEN_URL, data=data, headers=headers)
            self.log(f"响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                token_data = response.json()
                access_token = token_data['access_token']
                refresh_token = token_data.get('refresh_token', '')
                
                self.log(f"成功获取访问令牌: {access_token[:10]}...")
                if refresh_token:
                    self.log(f"刷新令牌: {refresh_token[:10]}...")
                
                # 获取当前用户信息
                self.get_current_user()
                
                self.status_var.set("登录成功！")
            else:
                error_msg = f"获取令牌失败: {response.status_code} - {response.text}"
                self.log(error_msg)
                self.status_var.set(error_msg)
                messagebox.showerror("错误", error_msg)
        except Exception as e:
            error_msg = f"获取令牌时发生错误: {str(e)}"
            self.log(error_msg)
            self.log(traceback.format_exc())
            self.status_var.set(error_msg)
            messagebox.showerror("错误", error_msg)
    
    def get_current_user(self):
        """获取当前登录用户的信息"""
        global access_token
        
        if not access_token:
            self.log("没有访问令牌，无法获取用户信息")
            return
        
        url = "https://api.bgm.tv/v0/me"
        headers = {
            'Authorization': f'Bearer {access_token}',
            'User-Agent': 'BangumiWheel/1.0'
        }
        
        self.log(f"请求用户信息: {url}")
        
        try:
            self.log("正在获取用户信息...")
            response = requests.get(url, headers=headers)
            self.log(f"响应状态码: {response.status_code}")
            
            if response.status_code == 200:
                user_info = response.json()
                username = user_info['username']
                user_id = user_info['id']
                self.user_id = user_id
                
                # 添加头像URL获取
                avatar_url = user_info.get('avatar', {}).get('large', '')
                
                # 更新用户信息到轮盘标签页
                app = self.winfo_toplevel()
                if hasattr(app, 'update_user_info'):
                    app.update_user_info(username, user_id, avatar_url)

                self.log(f"当前用户: {username} (ID: {user_id})")
                self.status_var.set(f"欢迎, {username}!")
            else:
                error_msg = f"获取用户信息失败: {response.status_code} - {response.text}"
                self.log(error_msg)
                self.status_var.set(error_msg)
                messagebox.showerror("错误", error_msg)
        except Exception as e:
            error_msg = f"获取用户信息时发生错误: {str(e)}"
            self.log(error_msg)
            self.log(traceback.format_exc())
            self.status_var.set(error_msg)
            messagebox.showerror("错误", error_msg) 
    
    def fetch_collections(self):
        """获取用户的收藏列表"""
        global access_token
        
        if not access_token:
            self.log("请先登录Bangumi账号")
            messagebox.showinfo("提示", "请先登录Bangumi账号")
            return
            
        # 记录开始时间
        start_time = datetime.now()
        start_time_str = start_time.strftime("%Y-%m-%d %H:%M:%S")
        self.log(f"开始获取收藏列表 - 时间: {start_time_str}")
        self.status_var.set("正在获取收藏列表...")

        # 使用实际用户ID替换URL中的占位符
        url = f"https://api.bgm.tv/v0/users/{self.user_id}/collections"
  
        # 修正类型映射
        types_to_fetch = []
        if self.show_wish.get():
            types_to_fetch.append(COLLECTION_TYPES["wish"])
        if self.show_collect.get():
            types_to_fetch.append(COLLECTION_TYPES["collect"])
        if self.show_watching.get():
            types_to_fetch.append(COLLECTION_TYPES["do"])
        if self.show_on_hold.get():
            types_to_fetch.append(COLLECTION_TYPES["on_hold"])
        if self.show_dropped.get():
           types_to_fetch.append(COLLECTION_TYPES["dropped"])
    
        if not types_to_fetch:
            self.log("请至少选择一个收藏列表类型")
            messagebox.showinfo("提示", "请至少选择一个收藏列表类型")
            return
        
        # 重置项目列表
        self.items = []
        type_counts = {type_id: 0 for type_id in types_to_fetch}
        
        # 获取收藏
        for collection_type in types_to_fetch:
            page = 1
            has_next = True
            while has_next:
                url = f"https://api.bgm.tv/v0/users/{self.user_id}/collections"
                params = {
                    'subject_type': 2,  # 动画
                    'type': collection_type,
                    'limit': 50,
                    'offset': (page - 1) * 50
                }
                headers = {
                    'Authorization': f'Bearer {access_token}',
                    'User-Agent': 'BangumiWheel/1.0'
                }
                
                type_name = COLLECTION_NAMES.get(collection_type, f"类型{collection_type}")
                self.log(f"请求{type_name}列表第 {page} 页")
                
                try:
                    response = requests.get(url, headers=headers, params=params)
                    self.log(f"{type_name}列表响应状态: {response.status_code}")
                    
                    if response.status_code == 200:
                        data = response.json()
                        total = data['total']
                        items = data.get('data', [])
                        self.log(f"第{page}页获取到{len(items)}个项目")
                        
                        for item in items:
                            subject = item['subject']
                            subject_id = subject['id']
                            name = subject['name_cn'] or subject['name']
                            nsfw = subject.get('nsfw', False)
                            
                            item_dict = {
                                "id": subject_id,
                                "name": name,
                                "type": type_name,
                                "nsfw": nsfw,
                                "raw": item
                            }
                            self.items.append(item_dict)
                            type_counts[collection_type] += 1
                        
                        # 检查是否还有下一页
                        if page * 50 < total:
                            page += 1
                        else:
                            has_next = False
                    else:
                        self.log(f"获取{type_name}列表失败: {response.status_code} - {response.text}")
                        break
                except Exception as e:
                    error_msg = f"获取{type_name}列表时出错: {str(e)}"
                    self.log(error_msg)
                    self.log(traceback.format_exc())
                    break
        
        # 记录结束时间
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        end_time_str = end_time.strftime("%Y-%m-%d %H:%M:%S")
        
        # 统计结果
        type_counts_text = ", ".join([f"{COLLECTION_NAMES.get(type_id, f'类型{type_id}')}: {count}" 
                                     for type_id, count in type_counts.items()])
        total_count = len(self.items)
        
        self.log(f"成功获取 {total_count} 个番剧 ({type_counts_text})")
        self.log(f"获取完成时间: {end_time_str}, 耗时: {duration:.2f}秒")
        self.status_var.set(f"成功获取 {total_count} 个番剧")
        
        # 应用筛选条件
        self.apply_filters()
    
    def apply_filters(self):
        """应用筛选条件"""
        if not hasattr(self, 'items') or not self.items:
            self.filtered_items = []
            self.log("没有项目可筛选")
            return
            
        self.filtered_items = []
        
        # 应用筛选
        for item in self.items:
            nsfw = item.get("nsfw", False)
            
            if self.only_nsfw.get():
                if nsfw:
                    self.filtered_items.append(item)
            else:
                # 根据每个列表的NSFW选项决定
                if item["type"] == "在看":
                    if not self.show_nsfw_watching.get() and nsfw:
                        continue
                elif item["type"] == "想看":
                    if not self.show_nsfw_wish.get() and nsfw:
                        continue
                elif item["type"] == "看过":
                    if not self.show_nsfw_collect.get() and nsfw:
                        continue
                elif item["type"] == "搁置":
                    if not self.show_nsfw_on_hold.get() and nsfw:
                        continue
                elif item["type"] == "抛弃":
                    if not self.show_nsfw_dropped.get() and nsfw:
                        continue
                self.filtered_items.append(item)
        
        self.log(f"应用筛选后剩余 {len(self.filtered_items)} 个项目")
        self.status_var.set(f"已应用筛选: {len(self.filtered_items)} 个项目")
        
        # 更新轮盘标签页
        app = self.winfo_toplevel()
        if hasattr(app, 'update_collections'):
            app.update_collections(self.filtered_items)

    def export_log(self):
        """导出日志"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        default_filename = f"bangumi_Roulette_log_{timestamp}.log"
        
        file_path = filedialog.asksaveasfilename(
            defaultextension=".log",
            filetypes=[("日志文件", "*.log"), ("文本文件", "*.txt"), ("所有文件", "*.*")],
            title="保存日志",
            initialfile=default_filename
        )
        
        if not file_path:
            return
            
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                for log_entry in self.log_messages:
                    f.write(log_entry + "\n")
            self.log(f"日志已导出到: {file_path}")
            messagebox.showinfo("成功", f"日志已成功导出到:\n{file_path}")
        except Exception as e:
            self.log(f"导出日志失败: {str(e)}")
            self.log(traceback.format_exc())
            messagebox.showerror("错误", f"导出日志失败:\n{str(e)}")
    
    def clear_log(self):
        """清除日志"""
        if messagebox.askyesno("确认", "确定要清除所有日志吗？"):
            self.log_messages = []
            self.log_text.config(state="normal")
            self.log_text.delete(1.0, tk.END)
            self.log_text.config(state="disabled")
            self.log("日志已清除")
    
    def update_theme(self):
        """更新主题"""
        try:
            self.log_text.configure(
                bg=self.theme.get_surface_color(),
                fg=self.theme.get_fg_color()
            )
        except Exception as e:
            logging.error(f"更新主题错误: {e}")