# Bangumi Roulette Web UI (中文说明)

本项目是 "Bangumi Roulette" 应用的网页版用户界面。它被设计嵌入在 `pywebview` 桌面应用中，让用户可以连接他们的 Bangumi 账户，并从他们的收藏中随机抽取动画、书籍、音乐、游戏或三次元剧集。

## ✨ 主要功能

- **Bangumi 账户集成**: 通过 Bangumi 账户安全登录，访问您的个人收藏。
- **随机轮盘**: 根据选择的分类（如：动画、书籍）和收藏状态（如：在看、想看），从您的收藏中随机获取一个条目。
- **动态筛选**: 轻松地根据分类和收藏状态筛选轮盘的抽取范围。
- **详细结果展示**: 显示随机抽中条目的封面、中文名，并提供一个直接跳转到其 Bangumi 页面的链接。
- **数据管理**: 查看、清空和导出您的抽取历史与应用日志。
- **个性化设置**:
    - 切换是否显示 NSFW (不适宜工作场所浏览) 内容。
    - 一键将应用主题色同步为您的操作系统强调色。
- **响应式界面**: 简洁、现代化的界面，包含一个侧边栏用于在不同功能页之间轻松导航。
- **用户反馈**: 通过应用内通知（Snackbar）为登录成功、操作失败等事件提供即时反馈。

## 🛠️ 核心技术

- **React**: 用于构建用户界面的 JavaScript 库。
- **TypeScript**: 为 JavaScript 添加静态类型，以提高代码质量和可维护性。
- **Tailwind CSS**: 一个功能类优先的 CSS 框架，用于快速开发 UI (通过 CDN 链接加载)。
- **pywebview**: 本应用旨在 `pywebview` 容器内运行，它在 Python 后端和 Web 前端之间架起了一座通信的桥梁。

## 🏛️ 应用架构与通信

此前端应用是一个客户端，通过 `pywebview` 提供的 API 与 Python 后端进行通信。

- **前端调用后端**: JavaScript 通过 `window.pywebview.api` 对象调用 Python 中暴露的函数。例如，`api.get_collection(...)` 会触发 Python 端的函数来获取数据。
- **后端调用前端**: Python 后端可以直接在 `window` 对象上执行 JavaScript 函数，以实时更新 UI。主要使用的函数包括：
    - `window.updateUserInfo(userData)`: 登录成功后调用，将用户信息发送到 UI。
    - `window.showSnackbar(type, message)`: 用于显示通知。
    - `window.updateThemeColor(primary, secondary)`: 用于更改应用的主题颜色。

### 浏览器开发模式

为了便于开发，本应用内置了一套 **模拟 API**。当检测不到 `window.pywebview` 对象时（例如，在普通浏览器中运行时），应用会自动模拟后端响应。这使得开发者无需运行完整的 Python 应用即可快速进行 UI 开发和测试。

## 📁 文件结构与功能说明

`bangumi-roulette-web` 文件夹包含以下核心文件：

- **`index.html`**: **(HTML 入口文件)**
  - 这是整个网页应用的骨架。它负责设置页面的基本结构、标题、图标等。
  - 通过 CDN 引入并配置了 `Tailwind CSS`，用于界面的样式渲染。
  - 定义了用于动态主题化的 CSS 变量（例如 `--color-primary`），允许 JavaScript 动态修改主题色。
  - 包含了 `<div id="root"></div>`，这是 React 应用将会挂载的根节点。
  - 最后，通过 `<script type="module">` 引入并执行核心逻辑文件 `index.tsx`。

- **`index.tsx`**: **(React 核心逻辑与组件文件)**
  - 这是应用的绝对核心，使用 TypeScript 和 React 编写。
  - **API 通信层**: 定义了与 `pywebview` 后端的通信接口。同时，它包含了一套完整的模拟 API，使得在没有 Python 环境的浏览器中也能独立运行和调试。
  - **全局状态管理**: 使用 `useState`, `useEffect` 等 React Hooks 来管理整个应用的全局状态，例如用户是否登录、当前所在的页面、通知消息的内容和类型等。
  - **组件定义**: 包含了所有构成界面的 React 组件，例如：
      - `App`: 根组件，负责组织页面布局和全局逻辑。
      - `Header`: 顶部栏，显示应用标题和用户信息/登录按钮。
      - `Sidebar`: 左侧导航栏，用于页面切换。
      - `RoulettePage`: "轮盘" 核心功能页面。
      - `SettingsPage`: "设置" 页面。
      - `DataManagementPage`: 一个可复用的数据管理页面，用于展示 "历史记录" 和 "日志"。
      - `Snackbar`: 右下角弹出的消息通知条。
  - **应用渲染**: 使用 `ReactDOM.createRoot` 将 `App` 主组件渲染到 `index.html` 中的 `root` 元素上，从而启动整个应用。

- **`metadata.json`**: **(元数据文件)**
  - 一个标准的项目元数据文件，用于存放项目的描述或其他配置信息。
  - 目前仅包含一个由 AI Studio 自动生成的简单描述。在未来可以扩展，用于请求特定权限（如摄像头、地理位置等）。

- **`README.md`**: **(项目说明文件)**
  - 即您当前正在阅读的这个文件。
  - 它为项目的开发者或用户提供了全面的介绍，详细说明了项目的功能、技术栈、架构、文件结构和使用方法。

## 🚀 如何开始

本项目旨在特定的环境中运行（例如 `pywebview` 实例或像 AI Studio 这样的 Web 开发服务器）。

1.  确保您已经运行了相应的 Python `pywebview` 后端，后端程序会负责加载这个 `index.html` 文件。
2.  Python 应用需要暴露 `index.tsx` 中调用的所有 API 函数（如 `start_login_flow`, `get_collection` 等）。
3.  或者，您也可以直接在现代浏览器中打开 `index.html` 文件，此时应用将使用内置的模拟数据在开发模式下运行。
