# 禅道（ZenTao） 月度工时统计脚本

一个基于 React 的浮动面板用户脚本，用于统计指定月份内已完成任务的工时消耗。支持 Tampermonkey/Greasemonkey。

## 🚀 快速开始

### 安装依赖
```bash
yarn install
```

### 开发模式
```bash
yarn dev
```

### 构建生产版本
```bash
yarn build
```

构建后的用户脚本将生成在 `dist/zentao-userscript.user.js`。

## 📦 安装脚本

1. 打开 Tampermonkey 扩展程序
2. 创建新脚本
3. 将构建后的文件内容粘贴进去，或直接拖拽文件到页面

## ⚙️ 配置说明

1. 访问 `禅道（ZenTao）` 的任意页面
2. 点击页面右下角的浮动"报告"按钮打开配置面板
3. 输入您的 API Token 并点击保存(可选，脚本默认使用当前已登陆的token)
4. 脚本将使用 `Token: <your token>` 头部进行 API 认证
5. API 基础地址：`http://<your domain>/zentao/api.php/v1`

## ✨ 功能特性

- **多维度筛选**：支持项目（多选）、执行（多选）、月份（单选）、用户（多选）
- **实时更新**：获取任务时表格数据实时滚动更新
- **并发控制**：限制并发请求数量，避免浏览器连接数限制
- **数据展示**：表格显示用户姓名、工时（小时）、工时（天）
- **本地存储**：配置信息自动保存到浏览器本地存储

## 🛠️ 技术栈

- **React 18** - 用户界面框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 快速构建工具
- **Tampermonkey** - 用户脚本管理器

## 📊 API 文档

本项目使用的禅道 API 接口：

- [用户列表](https://www.zentao.net/book/api/666.html) - 获取系统用户信息
- [项目列表](https://www.zentao.net/book/api/699.html) - 获取所有项目
- [执行列表](https://www.zentao.net/book/api/710.html) - 获取项目下的执行
- [任务列表](https://www.zentao.net/book/api/715.html) - 获取执行下的任务

## 📁 项目结构

```
src/
├── api/           # API 接口定义
├── components/    # React 组件
├── hooks/         # 自定义 Hooks
├── lib/           # 工具库
├── utils/         # 通用工具函数
└── types.ts       # TypeScript 类型定义
```

## 🎯 使用场景

适用于需要统计团队成员在特定月份内工时消耗的场景，帮助管理者了解项目资源分配和工时使用情况。
