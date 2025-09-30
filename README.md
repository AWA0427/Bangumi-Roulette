---
# 目前代码存在问题，正在修改
---


#
#
#


# Bangumi-Roulette

一个基于 Bangumi API 的番剧抽签转盘应用
## ✨ 项目简介
Bangumi-Roulette 是一个桌面应用，通过连接 Bangumi 个人收藏数据，提供一个可视化的抽签转盘，旨在帮助用户随机选择下一部要观看的动画，解决“看什么”的烦恼。
## 🚧 当前状态
项目正在进行前端 UI 界面重构与优化，以提升用户体验和功能稳定性。部分功能可能仍在开发或调试阶段。
## 📁 项目文件结构
根据仓库最新内容，项目结构如下：
```Bangumi-Roulette/
├── .gitignore                 # Git 忽略文件配置
├── LICENSE                    # 许可证文件 (MIT)
├── main.py                    # 主程序入口 (Python/pywebview/Bottle)
├── requirements.txt           # Python 依赖包列表
├── README.md                  # 项目说明文档
└── ui/                        # 前端 UI 模块 (React/JavaScript)
    ├── node_modules/          # Node.js 依赖
    ├── public/                # 静态资源文件
    ├── src/                   # React 源码目录
    │   ├── api.js             # 与 Python API 通信的接口
    │   ├── App.js             # 主组件
    │   ├── components/        # 可复用 UI 组件
    │   ├── pages/             # 页面/标签页组件
    │   ├── styles/            # 样式文件
    │   └── utils/             # 工具函数
    ├── package.json           # Node/NPM 依赖配置
    └── ...                    # 其他配置文件
```

## 🛠️ 安装使用
运行本项目需要 `Python 3.x` 和 `Node.js/npm` 环境。
1. 克隆仓库
```git clone https://github.com/AWA0427/Bangumi-Roulette.git
cd Bangumi-Roulette```

2. 安装 `Python` 后端依赖
```pip install -r requirements.txt```

3. 构建前端 UI
进入 ui 目录，安装 Node 依赖并构建前端项目。
```cd ui
npm install
npm run build
cd ..```

4. 运行应用
回到项目根目录，启动主程序：
```python main.py```

## 📝 说明
本项目代码由 AI 辅助完成。
感谢您为项目更新文档！如果您对文件结构有任何其他需要强调的细节，请告诉我。

AI真好用啊！
