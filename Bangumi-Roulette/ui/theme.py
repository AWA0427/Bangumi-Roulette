import tkinter as tk
from tkinter import ttk
import json
import os
import logging

class ThemeManager:
    DARK_THEMES = {
        "深灰": "#121212",
        "深蓝": "#1E293B",
        "深紫": "#1A1A2E",
        "深绿": "#0D1B1E",
        "深红": "#1A0D0D",
    }
    
    LIGHT_THEMES = {
        "浅灰": "#F5F5F5",
        "浅蓝": "#E3F2FD",
        "浅紫": "#F3E5F5",
        "浅绿": "#E8F5E9",
        "浅红": "#FFEBEE",
    }
    
    ACCENT_COLORS = {
        "蓝色": "#2196F3",
        "紫色": "#9C27B0",
        "绿色": "#4CAF50",
        "橙色": "#FF9800",
        "红色": "#F44336",
    }
    
    def __init__(self):
        self.current_theme = "dark"
        self.dark_theme = "深灰"
        self.light_theme = "浅灰"
        self.accent_color = "#2196F3"
        self.load_settings()
        
    def load_settings(self):
        """加载主题设置"""
        try:
            if os.path.exists("theme_settings.json"):
                with open("theme_settings.json", "r") as f:
                    settings = json.load(f)
                    self.current_theme = settings.get("current_theme", "dark")
                    self.dark_theme = settings.get("dark_theme", "深灰")
                    self.light_theme = settings.get("light_theme", "浅灰")
                    self.accent_color = settings.get("accent_color", "#2196F3")
        except Exception as e:
            logging.error(f"加载主题设置错误: {e}")
    
    def save_settings(self):
        """保存主题设置"""
        try:
            settings = {
                "current_theme": self.current_theme,
                "dark_theme": self.dark_theme,
                "light_theme": self.light_theme,
                "accent_color": self.accent_color
            }
            with open("theme_settings.json", "w") as f:
                json.dump(settings, f)
        except Exception as e:
            logging.error(f"保存主题设置错误: {e}")
    
    def get_bg_color(self):
        """获取背景颜色"""
        if self.current_theme == "dark":
            return self.DARK_THEMES.get(self.dark_theme, "#121212")
        return self.LIGHT_THEMES.get(self.light_theme, "#FFFFFF")
    
    def get_fg_color(self):
        """获取前景颜色"""
        return "#FFFFFF" if self.current_theme == "dark" else "#000000"
    
    def get_card_color(self):
        """获取卡片颜色"""
        if self.current_theme == "dark":
            bg = self.DARK_THEMES.get(self.dark_theme, "#121212")
            return self.lighten_color(bg, 10)
        bg = self.LIGHT_THEMES.get(self.light_theme, "#FFFFFF")
        return self.darken_color(bg, 5)
    
    def get_surface_color(self):
        """获取表面颜色"""
        if self.current_theme == "dark":
            bg = self.DARK_THEMES.get(self.dark_theme, "#121212")
            return self.lighten_color(bg, 15)
        bg = self.LIGHT_THEMES.get(self.light_theme, "#FFFFFF")
        return self.darken_color(bg, 10)
    
    def lighten_color(self, hex_color, amount):
        """增加颜色亮度"""
        try:
            hex_color = hex_color.lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            rgb = tuple(min(255, c + amount) for c in rgb)
            return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
        except:
            return "#CCCCCC"
    
    def darken_color(self, hex_color, amount):
        """降低颜色亮度"""
        try:
            hex_color = hex_color.lstrip('#')
            rgb = tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))
            rgb = tuple(max(0, c - amount) for c in rgb)
            return f"#{rgb[0]:02x}{rgb[1]:02x}{rgb[2]:02x}"
        except:
            return "#CCCCCC"
    
    def apply_theme(self, root):
        """应用主题到指定根窗口"""
        try:
            bg = self.get_bg_color()
            fg = self.get_fg_color()
            card = self.get_card_color()
            surface = self.get_surface_color()
            accent = self.accent_color
            
            # 仅对 Tk 和 Toplevel 设置背景色
            if isinstance(root, (tk.Tk, tk.Toplevel)):
                root.configure(bg=bg)
            
            style = ttk.Style()
            
            # 配置整体样式
            style.configure(".", 
                            background=bg, 
                            foreground=fg, 
                            font=("Segoe UI", 10),
                            borderwidth=0,
                            relief="flat")
            
            # 标题样式
            style.configure("Title.TLabel", 
                           font=("Segoe UI", 16, "bold"),
                           foreground=fg)
            
            # 副标题样式
            style.configure("Subtitle.TLabel", 
                           font=("Segoe UI", 12, "bold"),
                           foreground=fg)
            
            # 卡片样式
            style.configure("Card.TFrame", 
                           background=surface, 
                           borderwidth=1,
                           relief="solid",
                           padding=10,width=10000)
            
            # 按钮样式
            style.configure("Accent.TButton", 
                           background=accent, 
                           foreground="#FFFFFF",
                           font=("Segoe UI", 10, "bold"),
                           borderwidth=0,
                           padding=(10, 5))
            
            style.map("Accent.TButton", 
                     background=[("active", self.lighten_color(accent, 20)), 
                                ("pressed", self.darken_color(accent, 10))])
            
            # 普通按钮样式
            style.configure("TButton", 
                           background=card, 
                           foreground=fg,
                           font=("Segoe UI", 10),
                           borderwidth=0,
                           padding=(8, 4))
            
            style.map("TButton", 
                     background=[("active", self.lighten_color(card, 10)), 
                                ("pressed", self.darken_color(card, 5))])
            
            # 输入框样式
            style.configure("TEntry", 
                           fieldbackground=surface,
                           foreground=fg,
                           insertcolor=fg,
                           borderwidth=1,
                           relief="solid")
            
            style.configure("TCombobox", 
                           fieldbackground=surface,
                           foreground=fg,
                           selectbackground=accent)
            
            # 滚动条样式
            style.configure("Vertical.TScrollbar", 
                           background=card,
                           troughcolor=bg,
                           bordercolor=bg,
                           arrowcolor=fg,
                           gripcount=0)
            
            # 列表样式
            style.configure("TListbox", 
                           background=surface,
                           foreground=fg,
                           selectbackground=accent,
                           selectforeground="#FFFFFF",
                           borderwidth=0,
                           relief="flat")
            
            # 应用主题到根窗口
            root.configure(bg=bg)
        except Exception as e:
            logging.error(f"应用主题错误: {e}")