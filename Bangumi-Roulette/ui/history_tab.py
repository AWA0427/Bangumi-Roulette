import tkinter as tk
from tkinter import ttk
from .components import MD3Card, MD3Button, HistoryDetailWindow
import logging
import json
import os
from datetime import datetime
import traceback

class HistoryTab(ttk.Frame):
    """历史记录标签页"""
    def __init__(self, parent, theme, *args, **kwargs):
        super().__init__(parent, *args, **kwargs)
        self.parent = parent
        self.theme = theme
        self.history_data = []
        
        # 应用主题
        self.theme.apply_theme(self)
        self.configure(style="Card.TFrame")
        
        # 主框架
        main_frame = ttk.Frame(self)
        main_frame.pack(fill="both", expand=True, padx=16, pady=16)
        
        # 标题
        title_frame = MD3Card(main_frame, padding=16)
        title_frame.pack(fill="x", pady=(0, 16))
        
        ttk.Label(title_frame, text="抽签历史记录", style="Title.TLabel").pack(anchor="w")
        
        # 历史记录控制按钮
        control_frame = MD3Card(main_frame, padding=16)
        control_frame.pack(fill="x", pady=(0, 16))
        
        export_history_btn = MD3Button(control_frame, text="导出历史", 
                                      command=self.export_history)
        export_history_btn.pack(side="left", padx=8)
        
        clear_history_btn = MD3Button(control_frame, text="清除历史", 
                                     command=self.clear_history)
        clear_history_btn.pack(side="left", padx=8)
        
        # 历史记录列表框架
        list_frame = MD3Card(main_frame, padding=16)
        list_frame.pack(fill="both", expand=True)
        
        # 创建带滚动条的列表框
        scrollbar = ttk.Scrollbar(list_frame, style="Vertical.TScrollbar")
        scrollbar.pack(side="right", fill="y")
        
        self.history_list = tk.Listbox(list_frame, 
                                     bg=self.theme.get_surface_color(),
                                     fg=self.theme.get_fg_color(),
                                     font=("Segoe UI", 10),
                                     borderwidth=0,
                                     highlightthickness=0,
                                     selectbackground=self.theme.accent_color,
                                     yscrollcommand=scrollbar.set)
        self.history_list.pack(fill="both", expand=True, padx=8, pady=8)
        
        scrollbar.config(command=self.history_list.yview)
        
        # 绑定双击事件查看详情
        self.history_list.bind("<Double-Button-1>", self.show_history_detail)
        
        # 加载历史记录
        self.load_history()
        
        # 绑定鼠标滚轮
        self.history_list.bind("<MouseWheel>", self.on_mousewheel)

    def on_mousewheel(self, event):
        """处理鼠标滚轮事件"""
        self.history_list.yview_scroll(int(-1*(event.delta/120)), "units")
    
    def load_history(self):
        """加载历史记录"""
        try:
            if os.path.exists("history.json"):
                with open("history.json", "r", encoding="utf-8") as f:
                    self.history_data = json.load(f)
                    self.update_history_list()
                    logging.info(f"已加载 {len(self.history_data)} 条历史记录")
        except Exception as e:
            logging.error(f"加载历史记录失败: {str(e)}")
            logging.error(traceback.format_exc())
    
    def save_history(self):
        """保存历史记录"""
        try:
            with open("history.json", "w", encoding="utf-8") as f:
                json.dump(self.history_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logging.error(f"保存历史记录失败: {str(e)}")
            logging.error(traceback.format_exc())
    
    def update_history_list(self):
        """更新历史记录列表"""
        self.history_list.delete(0, tk.END)
        for item in self.history_data:
            timestamp = item.get("timestamp", "")
            name = item.get("name", "未知项目")
            self.history_list.insert(tk.END, f"{timestamp} - {name}")

    def export_history(self):
        """导出历史记录"""
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        default_filename = f"bangumi_Roulette_history_{timestamp}.json"
        
        file_path = filedialog.asksaveasfilename(
            defaultextension=".json",
            filetypes=[("JSON文件", "*.json"), ("所有文件", "*.*")],
            title="保存历史记录",
            initialfile=default_filename
        )
        
        if not file_path:
            return
            
        try:
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(self.history_data, f, ensure_ascii=False, indent=2)
            logging.info(f"历史记录已导出到: {file_path}")
            messagebox.showinfo("成功", f"历史记录已成功导出到:\n{file_path}")
        except Exception as e:
            logging.error(f"导出历史记录失败: {str(e)}")
            logging.error(traceback.format_exc())
            messagebox.showerror("错误", f"导出历史记录失败:\n{str(e)}")
    
    def clear_history(self):
        """清除历史记录"""
        if messagebox.askyesno("确认", "确定要清除所有历史记录吗？"):
            self.history_data = []
            self.history_list.delete(0, tk.END)
            self.save_history()
            logging.info("历史记录已清除")
            messagebox.showinfo("成功", "历史记录已清除")
    
    def show_history_detail(self, event):
        """显示历史详情"""
        try:
            selection = self.history_list.curselection()
            if selection:
                index = selection[0]
                if 0 <= index < len(self.history_data):
                    HistoryDetailWindow(self, self.history_data[index])
        except Exception as e:
            logging.error(f"显示历史详情错误: {e}")
    
    def update_theme(self):
        """更新主题"""
        try:
            self.history_list.configure(
                bg=self.theme.get_surface_color(),
                fg=self.theme.get_fg_color(),
                selectbackground=self.theme.accent_color
            )
        except Exception as e:
            logging.error(f"更新主题错误: {e}")