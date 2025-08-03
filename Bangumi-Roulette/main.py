import tkinter as tk
from tkinter import ttk
from ui.theme import ThemeManager
from ui.components import MD3Button, MD3Card  # 修复这里
from ui.wheel_tab import WheelTab
from ui.settings_tab import SettingsTab
from ui.history_tab import HistoryTab
import logging
import sys
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
import threading
import webbrowser
import urllib.parse
import requests

# 应用凭据
CLIENT_ID = 'bgm4227688cbad0a011f'
CLIENT_SECRET = '80c70b9f72838f50d626884231f43b05'
REDIRECT_URI = 'http://127.0.0.1:8000/callback'
AUTHORIZE_URL = 'https://bgm.tv/oauth/authorize'
TOKEN_URL = 'https://bgm.tv/oauth/access_token'

# 全局变量
access_token = None
refresh_token = None

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

class BangumiWheel(tk.Tk):
    """Bangumi抽签转盘主应用"""

    def create_title_bar(self):
        """创建标题栏"""
        self.title_bar = ttk.Frame(self, style="Card.TFrame")
        self.title_bar.pack(fill="x", padx=8, pady=8)
        
        # 标题
        title_label = ttk.Label(self.title_bar, text="Bangumi抽签转盘", style="Title.TLabel")
        title_label.pack(side="left", padx=10, pady=5)
        
        # 绑定标题栏事件
        self.title_bar.bind("<ButtonPress-1>", self.start_move)
        self.title_bar.bind("<B1-Motion>", self.on_move)
        self.title_bar.bind("<ButtonRelease-1>", self.stop_move)
    
    def __init__(self):
        super().__init__()
        self.title("Bangumi抽签转盘")
        
        # 设置日志
        self.setup_logging()
        
        # 设置窗口尺寸和位置
        self.setup_window_size()
        
        # 创建标题栏
        self.create_title_bar()
        
        # 初始化主题管理器
        self.theme = ThemeManager()
        self.theme.apply_theme(self)
        self.configure(bg=self.theme.get_bg_color())
        
        # 创建主框架
        self.main_frame = ttk.Frame(self)
        self.main_frame.pack(fill="both", expand=True, padx=8, pady=8)
        
        # 创建左侧导航栏
        self.create_navigation()
        
        # 创建内容区域
        self.content_frame = ttk.Frame(self.main_frame)
        self.content_frame.pack(side="right", fill="both", expand=True, padx=(8, 0))
        
        # 初始化标签页
        self.tabs = {}
        self.create_tabs()
        
        # 默认显示轮盘标签页
        self.show_tab("wheel")
        
        # 绑定全局事件
        self.bind_global_events()
    
    def setup_logging(self):
        """配置日志系统"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )
    
    def setup_window_size(self):
        """设置窗口尺寸和位置"""
        screen_width = self.winfo_screenwidth()
        screen_height = self.winfo_screenheight()
        
        # 设置窗口大小为屏幕的80%
        width = int(screen_width * 0.8)
        height = int(screen_height * 0.8)
        
        # 居中窗口
        x = (screen_width - width) // 2
        y = (screen_height - height) // 2
        
        self.geometry(f"{width}x{height}+{x}+{y}")
        self.minsize(800, 600)
    
    def create_navigation(self):
        """创建左侧导航栏"""
        nav_frame = MD3Card(self.main_frame, padding=16)
        nav_frame.pack(side="left", fill="y", padx=(0, 8), ipadx=10, ipady=10)
        
        # 设置固定宽度 (关键修改)
        nav_frame.configure(width=100)  # 限制导航栏宽度为200像素
        nav_frame.pack_propagate(False)  # 防止内部控件改变框架大小

        
        # 导航栏标题
        title_label = ttk.Label(nav_frame, text="Bangumi转盘", style="Title.TLabel")
        title_label.pack(pady=(8, 24))
        
        # 导航按钮
        nav_buttons = [
            ("轮盘抽签", "wheel"),
            ("设置", "settings"),
            ("历史记录", "history")
        ]
        
        for text, tab_id in nav_buttons:
            btn = MD3Button(nav_frame, text=text, 
                          command=lambda tid=tab_id: self.show_tab(tid),
                          width=160)
            btn.pack(fill="x", pady=8)
        
        # 主题切换
        theme_frame = ttk.Frame(nav_frame)
        theme_frame.pack(side="bottom", fill="x", pady=(20, 8))
        
        theme_btn = MD3Button(theme_frame, text="切换主题", 
                           command=self.toggle_theme,
                           width=160)
        theme_btn.pack(fill="x")
    
    def create_tabs(self):
        """创建所有标签页"""
        self.tabs["wheel"] = WheelTab(self.content_frame, self.theme)
        self.tabs["settings"] = SettingsTab(self.content_frame, self.theme)
        self.tabs["history"] = HistoryTab(self.content_frame, self.theme)
        
        # 初始隐藏所有标签页
        for tab in self.tabs.values():
            tab.pack_forget()
    
    def show_tab(self, tab_id):
        """显示指定标签页"""
        # 隐藏所有标签页
        for tab in self.tabs.values():
            tab.pack_forget()
        
        # 显示选中的标签页
        if tab_id in self.tabs:
            self.tabs[tab_id].pack(fill="both", expand=True)
    
    def toggle_theme(self):
        """切换深色/浅色模式"""
        try:
            if self.theme.current_theme == "dark":
                self.theme.current_theme = "light"
            else:
                self.theme.current_theme = "dark"
            
            self.theme.save_settings()
            self.theme.apply_theme(self)
            self.configure(bg=self.theme.get_bg_color())
            
            # 重新应用主题到所有标签页
            for tab in self.tabs.values():
                if hasattr(tab, "theme"):
                    tab.theme = self.theme
                self.theme.apply_theme(tab)
                
                # 强制刷新界面
                if hasattr(tab, "update_theme"):
                    tab.update_theme()
        except Exception as e:
            logging.error(f"切换主题错误: {e}")
    
    def update_user_info(self, username, user_id):
        """更新用户信息到轮盘标签页"""
        if "wheel" in self.tabs:
            self.tabs["wheel"].update_user_info(username, user_id)
    
    def update_collections(self, filtered_items):
        """更新收藏列表到轮盘标签页"""
        if "wheel" in self.tabs:
            self.tabs["wheel"].update_collections(filtered_items)
    
    def bind_global_events(self):
        """绑定全局事件"""
        # 支持复制粘贴
        self.bind("<Control-c>", self.copy_text)
        self.bind("<Control-v>", self.paste_text)

    
    def copy_text(self, event):
        """全局复制功能"""
        try:
            widget = self.focus_get()
            if hasattr(widget, "copy_text"):
                widget.copy_text()
            elif isinstance(widget, (tk.Entry, tk.Text, tk.Listbox)):
                try:
                    widget.event_generate("<<Copy>>")
                except:
                    pass
        except Exception as e:
            logging.error(f"复制文本错误: {e}")
    
    def paste_text(self, event):
        """全局粘贴功能"""
        try:
            widget = self.focus_get()
            if hasattr(widget, "paste_text"):
                widget.paste_text()
            elif isinstance(widget, (tk.Entry, tk.Text)):
                try:
                    widget.event_generate("<<Paste>>")
                except:
                    pass
        except Exception as e:
            logging.error(f"粘贴文本错误: {e}")
    
    def start_move(self, event):
        """开始移动窗口"""
        self.x = event.x_root - self.winfo_x()
        self.y = event.y_root - self.winfo_y()
    
    def stop_move(self, event):
        """停止移动窗口"""
        self.x = None
        self.y = None
    
    def on_move(self, event):
        """移动窗口"""
        if self.x and self.y:
            x = event.x_root - self.x
            y = event.y_root - self.y
            self.geometry(f"+{x}+{y}") 

if __name__ == "__main__":
    app = BangumiWheel()
    app.mainloop()