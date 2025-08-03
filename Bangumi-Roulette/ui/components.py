import tkinter as tk
from tkinter import ttk
import os
from PIL import Image, ImageTk, ImageFont, ImageDraw
import random
import string
import logging

class MD3Button(ttk.Button):
    """Material Design 3风格按钮"""
    def __init__(self, parent, *args, **kwargs):
        style = "Accent.TButton" if kwargs.pop("accent", False) else "TButton"
        super().__init__(parent, *args, style=style, **kwargs)
        self.parent = parent

class MD3Card(ttk.Frame):
    """Material Design 3风格卡片"""
    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, style="Card.TFrame", **kwargs)
        self.parent = parent
        self.padding = kwargs.get('padding', 16)
        self.configure(padding=self.padding)

class AvatarLabel(tk.Label):
    """圆形头像标签类"""
    def __init__(self, parent, image_path=None, size=48, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.size = size
        self.image_path = image_path
        self.default_image = None
        
        # 创建默认头像
        self.create_default_avatar()  # 确保这行存在
        self.update_avatar()
    
    def create_default_avatar(self):
        """创建默认头像"""
        # 生成随机字母
        letter = random.choice(string.ascii_uppercase)
        
        # 创建画布
        img = Image.new('RGBA', (self.size, self.size), (0, 0, 0, 0))
        # 绘制圆形
        draw = ImageDraw.Draw(img)
        draw.ellipse((0, 0, self.size-1, self.size-1), fill=(100, 100, 200))
        
        # 添加字母
        try:
            # 尝试获取系统字体
            fnt = ImageFont.truetype("arial.ttf", int(self.size*0.6))
        except:
            # 回退到默认字体
            fnt = ImageFont.load_default()
        
        # 计算文本位置
        try:
            # 对于较新的Pillow版本
            text_bbox = draw.textbbox((0, 0), letter, font=fnt)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
        except:
            # 对于较旧的Pillow版本
            text_width, text_height = draw.textsize(letter, font=fnt)
        
        position = ((self.size - text_width) // 2, (self.size - text_height) // 2)
        
        # 绘制文本
        draw.text(position, letter, font=fnt, fill="white")
        
        self.default_image = ImageTk.PhotoImage(img)
    
    def update_avatar(self, image_path=None):
        """更新头像"""
        self.image_path = image_path or self.image_path
        
        # 如果是网络图片
        if self.image_path and self.image_path.startswith('http'):
            try:
                # 下载网络图片
                response = requests.get(self.image_path, stream=True)
                response.raise_for_status()
                
                # 转换为PIL图像
                img = Image.open(BytesIO(response.content))
                img = img.resize((self.size, self.size))
                
                # 创建圆形遮罩
                mask = Image.new('L', (self.size, self.size), 0)
                draw = ImageDraw.Draw(mask)
                draw.ellipse((0, 0, self.size, self.size), fill=255)
                
                # 应用圆形遮罩
                result = Image.new('RGBA', (self.size, self.size))
                result.paste(img, (0, 0), mask=mask)
                
                self.network_image = ImageTk.PhotoImage(result)
                self.configure(image=self.network_image)
                return
            except Exception as e:
                logging.error(f"加载网络头像错误: {e}")
        
        # 如果是本地文件
        if self.image_path and os.path.exists(self.image_path):
            try:
                img = Image.open(self.image_path)
                img = img.resize((self.size, self.size))
                
                # 创建圆形遮罩
                mask = Image.new('L', (self.size, self.size), 0)
                draw = ImageDraw.Draw(mask)
                draw.ellipse((0, 0, self.size, self.size), fill=255)
                
                # 应用圆形遮罩
                result = Image.new('RGBA', (self.size, self.size))
                result.paste(img, (0, 0), mask=mask)
                
                self.image = ImageTk.PhotoImage(result)
                self.configure(image=self.image)
                return
            except Exception as e:
                logging.error(f"加载头像错误: {e}")
        
        # 使用默认头像
        self.configure(image=self.default_image)

class UserInfoPanel(MD3Card):
    """用户信息面板"""
    def __init__(self, parent, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.configure(padding=10)
        
        # 头像
        self.avatar = AvatarLabel(self, size=40)
        self.avatar.grid(row=0, column=0, rowspan=2, padx=(0, 10), sticky="ns")
        
        # 用户名标签
        self.username_label = ttk.Label(self, text="未登录", style="Subtitle.TLabel")
        self.username_label.grid(row=0, column=1, sticky="w")
        
        # 用户ID标签
        self.userid_label = ttk.Label(self, text="ID: 未登录", style="TLabel")
        self.userid_label.grid(row=1, column=1, sticky="w")
    
    def update_user_info(self, username, user_id, avatar_path=None):
        """更新用户信息"""
        self.username_label.config(text=username)
        self.userid_label.config(text=f"ID: {user_id}")
        self.avatar.update_avatar(avatar_path)

class HistoryDetailWindow(tk.Toplevel):
    """历史详情悬浮窗"""
    def __init__(self, parent, history_item, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.title("历史详情")
        self.geometry("500x400")
        self.transient(parent)
        self.grab_set()
        
        # 应用主题
        self.theme = parent.theme
        self.theme.apply_theme(self)
        
        # 创建内容
        frame = MD3Card(self, padding=16)
        frame.pack(fill="both", expand=True, padx=16, pady=16)
        
        # 标题
        title_frame = ttk.Frame(frame)
        title_frame.pack(fill="x", pady=(0, 12))
        
        title_label = ttk.Label(title_frame, text=history_item.get("title", "历史详情"), 
                              style="Title.TLabel")
        title_label.pack(side="left")
        
        close_btn = MD3Button(title_frame, text="关闭", 
                             command=self.destroy,
                             width=80)
        close_btn.pack(side="right")
        
        # 详情内容
        content_frame = MD3Card(frame, padding=12)
        content_frame.pack(fill="both", expand=True)
        
        content = history_item.get("content", "")
        detail_text = tk.Text(content_frame, wrap="word", 
                            bg=self.theme.get_surface_color(),
                            fg=self.theme.get_fg_color(),
                            font=("Segoe UI", 10),
                            padx=12, pady=12,
                            relief="flat",
                            borderwidth=0)
        detail_text.insert("1.0", content)
        detail_text.config(state="disabled")
        
        scrollbar = ttk.Scrollbar(content_frame, orient="vertical")
        scrollbar.pack(side="right", fill="y")
        
        detail_text.config(yscrollcommand=scrollbar.set)
        scrollbar.config(command=detail_text.yview)
        
        detail_text.pack(fill="both", expand=True)