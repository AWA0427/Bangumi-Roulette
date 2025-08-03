import tkinter as tk
from tkinter import ttk, messagebox
from .components import MD3Card, MD3Button, AvatarLabel, UserInfoPanel
import math
import random
import logging
import time

class WheelTab(ttk.Frame):
    """轮盘抽签标签页"""
    def __init__(self, parent, theme, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.theme = theme
        self.filtered_items = []  # 初始化过滤后的项目列表
        self.rotating = False     # 旋转状态标志
        self.selected_item = None # 选中的项目
        
        # 应用主题
        self.theme.apply_theme(self)
        self.configure(style="Card.TFrame")
        
        # 主框架
        main_frame = ttk.Frame(self)
        main_frame.pack(fill="both", expand=True, padx=16, pady=16)
        
        # 标题区域
        title_frame = MD3Card(main_frame, padding=16)
        title_frame.pack(fill="x", pady=(0, 16))
        
        title_label = ttk.Label(title_frame, text="Bangumi番剧抽签转盘", 
                              style="Title.TLabel")
        title_label.pack(side="left")
        
        # 用户信息
        self.user_info = UserInfoPanel(title_frame)
        self.user_info.pack(side="right")
        
        # 内容区域
        content_frame = ttk.Frame(main_frame)
        content_frame.pack(fill="both", expand=True)
        
        # 结果展示区域
        result_frame = MD3Card(content_frame, padding=16)
        result_frame.pack(fill="x", pady=(0, 16))
        
        self.result_label = ttk.Label(result_frame, text="请先登录并获取收藏列表", 
                                    font=("Segoe UI", 14),
                                    justify="center")
        self.result_label.pack(fill="x", pady=10)
        
        # 转盘区域
        wheel_frame = MD3Card(content_frame, padding=16)
        wheel_frame.pack(fill="both", expand=True, pady=(0, 16))
        
        # 转盘画布
        self.canvas = tk.Canvas(wheel_frame, bg=self.theme.get_surface_color(), 
                              highlightthickness=0)
        self.canvas.pack(fill="both", expand=True, padx=16, pady=16)
        
        # 按钮区域
        button_frame = MD3Card(main_frame, padding=16)
        button_frame.pack(fill="x")
        
        btn_container = ttk.Frame(button_frame)
        btn_container.pack(expand=True)
        
        self.spin_btn = MD3Button(btn_container, text="开始抽签", accent=True,
                                 command=self.start_spin,
                                 width=120)
        self.spin_btn.pack(side="left", padx=8)
        
        # 筛选信息
        self.filter_label = ttk.Label(btn_container, text="当前筛选: 全部")
        self.filter_label.pack(side="left", padx=8)
        
        # 绑定事件
        self.canvas.bind("<Configure>", self.draw_wheel)
    
    def draw_wheel(self, event=None):
        """绘制转盘"""
        try:
            if not event:
                return
                
            self.canvas.delete("all")
            width = event.width
            height = event.height
            center_x = width // 2
            center_y = height // 2
            radius = min(width, height) * 0.4
            
            # 绘制圆形背景
            self.canvas.create_oval(center_x - radius, center_y - radius,
                                  center_x + radius, center_y + radius,
                                  fill=self.theme.get_card_color(),
                                  outline=self.theme.accent_color,
                                  width=3)
            
            # 绘制中心点
            self.canvas.create_oval(center_x - 12, center_y - 12,
                                  center_x + 12, center_y + 12,
                                  fill=self.theme.accent_color,
                                  outline=self.theme.accent_color)
            
            # 绘制指示器
            indicator_size = 20
            self.canvas.create_polygon(
                center_x + radius, center_y - indicator_size,
                center_x + radius + 30, center_y,
                center_x + radius, center_y + indicator_size,
                fill=self.theme.accent_color,
                outline=self.theme.accent_color
            )
            
            # 如果有项目则绘制项目，否则绘制占位符
            if self.filtered_items:
                items = [item["name"] for item in self.filtered_items]
            else:
                items = ["请获取收藏列表", "点击设置标签页", "登录并获取", "收藏列表", "然后返回"]
            
            angle_per_item = 360 / len(items)
            
            for i, item in enumerate(items):
                # 绘制扇形
                self.canvas.create_arc(
                    center_x - radius, center_y - radius,
                    center_x + radius, center_y + radius,
                    start=i * angle_per_item,
                    extent=angle_per_item,
                    fill=self.get_wedge_color(i),
                    outline=self.theme.accent_color,
                    width=1
                )
                
                # 绘制文本
                text_angle = math.radians(i * angle_per_item + angle_per_item / 2)
                text_x = center_x + radius * 0.7 * math.cos(text_angle)
                text_y = center_y + radius * 0.7 * math.sin(text_angle)
                
                # 调整文本方向
                text_rotation = i * angle_per_item + angle_per_item / 2
                if text_rotation > 90 and text_rotation < 270:
                    text_rotation += 180
                    
                # 缩短长文本
                display_text = item[:8] + "..." if len(item) > 8 else item
                    
                self.canvas.create_text(
                    text_x, text_y,
                    text=display_text,
                    angle=text_rotation,
                    font=("Segoe UI", 10),
                    fill=self.theme.get_fg_color()
                )
        except Exception as e:
            logging.error(f"绘制转盘错误: {e}")
    
    def get_wedge_color(self, index):
        """获取扇形颜色（基于主题色变化）"""
        try:
            base_color = self.theme.accent_color
            if not base_color.startswith("#") or len(base_color) != 7:
                return "#CCCCCC"
                
            # 提取RGB值
            r = int(base_color[1:3], 16)
            g = int(base_color[3:5], 16)
            b = int(base_color[5:7], 16)
            
            # 根据索引调整亮度
            factor = 0.8 + (index % 4) * 0.1
            r = min(255, int(r * factor))
            g = min(255, int(g * factor))
            b = min(255, int(b * factor))
            
            return f"#{r:02x}{g:02x}{b:02x}"
        except:
            return "#CCCCCC"   
    
    def start_spin(self):
        """开始旋转转盘"""
        if not self.filtered_items:
            messagebox.showinfo("提示", "没有可用的项目，请先在设置标签页获取收藏列表并应用筛选")
            self.result_label.config(text="请先获取收藏列表")
            return
            
        if self.rotating:
            return
            
        self.rotating = True
        self.canvas.delete("all")
        
        # 绘制初始转盘
        self.draw_wheel()
        
        # 随机选择一个项目
        self.selected_item = random.choice(self.filtered_items)
        selected_index = self.filtered_items.index(self.selected_item)
        
        # 计算旋转角度（确保停在选中的项目上）
        total_items = len(self.filtered_items)
        angle_per_item = 360 / total_items
        target_angle = 360 - (selected_index * angle_per_item + angle_per_item / 2)

        # 增加初始速度和额外旋转圈数
        extra_rotations = random.randint(5, 8)  # 增加额外旋转圈数
        final_angle = target_angle + extra_rotations * 360
    
        # 开始旋转动画
        self.rotation_start_time = time.time()
        self.rotate_wheel(0, final_angle, 30)
    
    def rotate_wheel(self, current_angle, target_angle, speed):
        """执行旋转动画"""
        if current_angle < target_angle:
            # 继续旋转
            current_angle += min(speed, target_angle - current_angle)
            self.canvas.delete("all")
            
            width = self.canvas.winfo_width()
            height = self.canvas.winfo_height()
            center_x = width // 2
            center_y = height // 2
            
            # 计算半径，使转盘充满画布
            radius = min(width, height) * 0.4
            
            # 保存当前状态以便旋转
            self.canvas.create_arc(
                center_x - radius, center_y - radius,
                center_x + radius, center_y + radius,
                start=current_angle, extent=0.1,  # 很小的扇形只是为了旋转整个画布
                fill="white", outline="white"
            )
            
            # 应用旋转
            self.canvas.move("all", 0, 0)  # 强制重绘
            
            # 更新速度（减速效果）
            elapsed = time.time() - self.rotation_start_time
            deceleration = max(0.95, 1.0 - elapsed * 0.01)
            new_speed = max(1, speed * deceleration)
            
            # 安排下一次旋转
            self.after(20, lambda: self.rotate_wheel(current_angle, target_angle, new_speed))
        else:
            # 旋转结束
            self.rotating = False
            
            # 显示结果
            result_text = f"《{self.selected_item['name']}》 ({self.selected_item['type']})"
            self.result_label.config(text=result_text)
            
            # 重新绘制转盘以显示最终位置
            self.draw_wheel()
    
    def update_theme(self):
        """更新主题"""
        try:
            self.canvas.configure(bg=self.theme.get_surface_color())
            self.draw_wheel()
        except Exception as e:
            logging.error(f"更新主题错误: {e}")
    
    def update_user_info(self, username, user_id, avatar_url=None):
        """更新用户信息"""
        self.user_info.update_user_info(username, user_id, avatar_url)
    
    def update_collections(self, filtered_items):
        """更新收藏列表"""
        self.filtered_items = filtered_items
        self.filter_label.config(text=f"当前筛选: {len(filtered_items)}个项目")
        self.draw_wheel()