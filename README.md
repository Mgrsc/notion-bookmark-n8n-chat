# Notion + n8n 智能书签管理系统

这是一个集成了 Notion 页面展示和 n8n 智能助手的书签管理应用，旨在通过对话方式轻松管理和组织您的书签收藏。

## 功能特性

-   📚 **Notion 书签展示**: 居中悬浮式显示 Notion 书签数据库页面。
-   🤖 **智能书签助手**: 通过 n8n workflow 提供对话式书签管理能力。
-   🔍 **智能搜索**: 支持通过自然语言搜索和筛选书签。
-   ➕ **快速添加**: 可通过聊天对话快速添加新书签。
-   🏷️ **标签管理**: 提供智能分类和标签管理功能。
-   🔐 **安全认证**: 内置单用户认证机制，保护您的书签数据。
-   🎨 **现代化 UI**: 采用淡绿色主题、圆润设计及优雅动画，提供现代化的用户界面。
-   📱 **响应式设计**: 完美适配桌面和移动设备，提供一致的用户体验。

## 应用场景

-   **个人知识管理**: 高效收集和整理学习资源、文章链接。
-   **项目资源库**: 集中管理项目相关的参考资料和工具。
-   **研究收藏**: 便于学术研究中的文献和资源管理。
-   **日常浏览**: 轻松保存感兴趣的网页和内容。
-   **团队协作**: 方便团队共享资源和参考链接。

## 环境变量配置

### 必需配置

```bash
# n8n Webhook 配置 - 书签管理 workflow 的 webhook URL
N8N_CHAT_WEBHOOK_URL="your-n8n-bookmark-workflow-webhook-url"

# Notion 书签数据库页面 URL
NEXT_PUBLIC_NOTION_EMBED_URL="your-notion-bookmark-database-url"
```

### 可选配置

```bash
# n8n 认证（如果 webhook 需要认证）
N8N_CHAT_AUTH_USERNAME="your-n8n-username"
N8N_CHAT_AUTH_PASSWORD="your-n8n-password"

# 应用层认证（保护聊天功能）
CHAT_AUTH_USERNAME="admin"
CHAT_AUTH_PASSWORD="your-password"

# 调试模式
DEBUG_MODE=false
```

### 认证配置说明

您可以通过设置 `CHAT_AUTH_USERNAME` 和 `CHAT_AUTH_PASSWORD` 环境变量来配置聊天功能的认证。

如果未设置，将使用默认配置：
-   用户名：`admin`
-   密码：`admin123`

## Notion 数据库设置

您的 Notion 书签数据库应包含以下属性（列）：

-   **标题** (Title): 书签名称
-   **URL** (URL): 书签链接
-   **描述** (Text): 书签的简要描述
-   **标签** (Multi-select): 用于分类的标签
-   **添加日期** (Date): 书签的添加时间
-   **状态** (Select): 书签的阅读状态（如：未读/已读/收藏）

## n8n Workflow 配置

您的 n8n workflow 应该被设计为能够处理以下书签管理操作，并能接收和返回相应的 JSON 格式数据。

### 支持的操作示例
-   📝 **添加书签**: "帮我保存这个链接：https://example.com"
-   🔍 **搜索书签**: "找一下关于 React 的书签"
-   🏷️ **标签筛选**: "显示所有编程相关的书签"
-   📊 **统计信息**: "我总共有多少个书签？"
-   🗑️ **删除书签**: "删除这个过期的链接"

### 请求格式
```json
{
  "sessionId": "uuid-string",
  "action": "sendMessage",
  "chatInput": "用户的书签管理指令"
}
```

### 响应格式
```json
{
  "text": "AI 助手的回复，包含操作结果或书签信息"
}
```

## 系统默认配置

-   **请求超时时间**: 50 秒（固定）
-   **时区**: Asia/Shanghai（固定）
-   **会话管理**: 自动生成 UUID 会话 ID
-   **数据同步**: 与 Notion 数据库实时同步

## 部署说明

1.  克隆项目到本地仓库。
2.  安装项目依赖：`npm install`。
3.  配置环境变量：复制 `.env.local.example` 到 `.env.local` 并根据您的实际情况修改。
4.  确保 Notion 数据库已按上述要求设置，并且 n8n workflow 已正确配置。
5.  运行开发服务器进行本地测试：`npm run dev`。
6.  部署到 Vercel (或其他平台)：点击 "Deploy" 按钮或按照平台指引操作。

## 使用指南

在聊天窗口中，您可以输入以下指令来管理书签：

### 1. 添加书签
-   "保存这个链接：https://example.com，标题是：React 官方文档"
-   "添加书签：https://github.com/facebook/react，标签：开源,前端"

### 2. 搜索书签
-   "找一下关于 JavaScript 的书签"
-   "搜索标签为'教程'的所有书签"
-   "显示最近添加的书签"

### 3. 管理书签
-   "删除标题为'旧文档'的书签"
-   "将这个书签标记为已读"
-   "给这个书签添加'重要'标签"

## 技术栈

-   **前端框架**: Next.js 14 (使用 App Router 架构)
-   **样式系统**: Tailwind CSS
-   **UI 组件库**: shadcn/ui
-   **图标库**: Lucide React
-   **数据存储**: Notion Database
-   **自动化平台**: n8n Workflow
-   **部署平台**: Vercel

## 开发

```bash
# 安装项目依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 扩展功能展望

-   🔗 **批量导入**: 支持从浏览器书签文件批量导入。
-   📱 **移动端优化**: 集成 PWA 支持，实现移动端快速添加。
-   🔄 **自动同步**: 定时同步和备份书签数据。
-   📈 **使用统计**: 提供书签访问频率和使用分析报告。
-   🌐 **多语言**: 界面支持多语言切换。
-   👥 **协作功能**: 探索团队共享和权限管理能力。

## 许可证

MIT License
