# Life-Point 前端 📅

人生事件节点记录应用 —— 记录、可视化和回顾你的人生轨迹。

## ✨ 功能（MVP）

- 👤 **个人档案**：创建/编辑个人档案（姓名、出生日期、简介）
- 📝 **事件管理**：添加、编辑、删除人生节点（时间点事件）
- 🏷️ **事件分类**：8 种生活分类（生活 / 学业 / 工作 / 旅行 / 感情 / 健康 / 成就 / 其他）
- 📖 **纵向时间线**：中心时间轴 + 之字形卡片排列 + 出生起点，按年份分组
- 🌙 **暗黑模式**：浅色 / 深色 / 跟随系统，自动记忆偏好
- 📱 **响应式设计**：桌面端左右交替，移动端单侧排列
- 💾 **本地存储**：所有数据保存在浏览器（IndexedDB），隐私优先

## 🛠 技术栈

- Vue 3 + TypeScript + Vite
- Pinia（状态管理）
- Vue Router 4（路由）
- Tailwind CSS 3 + @tailwindcss/forms（样式）
- Dexie.js（IndexedDB 封装）

## 🚀 快速开始

```bash
npm install      # 安装依赖
npm run dev      # 启动开发服务器（默认 http://localhost:5173）
npm run build    # 类型检查 + 生产构建
npm run preview  # 预览生产构建
```

## 📁 项目结构

```
src/
├── components/
│   ├── common/        # AppHeader / AppModal / AppButton
│   ├── EventForm/     # EventForm / EventDeleteConfirm
│   ├── Profile/       # ProfileCard / ProfileEditor
│   └── Timeline/      # TimelineView / EventCard
├── views/             # HomeView / TimelinePageView / ProfileView / SettingsView
├── stores/            # userStore / eventStore / uiStore (Pinia)
├── services/          # storageService (Dexie + localStorage)
├── types/             # TypeScript 类型定义
├── utils/             # constants / dateUtils / validators
├── router/            # 路由配置 + 全局守卫
└── styles/            # main.css (Tailwind + 设计系统)
```

## 📚 相关文档

- [设计理念与 UI 指南](../docs/设计理念与UI指南.md)
- [开发规划](../docs/开发规划.md)

## 🗺 路线图

后续阶段（详见开发规划）：
- Phase 2：时间区间事件、搜索筛选、数据导入导出
- Phase 3：分享、统计图表、主题定制
- Phase 4：用户系统与云同步
