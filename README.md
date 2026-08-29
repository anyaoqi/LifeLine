# Life-Point 前端 📅

人生事件节点记录应用 —— 记录、可视化和回顾你的人生轨迹。

## ✨ 功能（当前 v0.4.0）

- 👤 **个人档案**：创建/编辑个人档案（姓名、出生日期、简介、年龄计算）
- 📝 **事件管理**：添加、编辑、删除人生节点；明确区分**时间点**（结婚、第一次出国）与**时间区间**（上高中、某份工作），支持「至今」
- 📅 **如实记录日期**：可按年 / 月 / 日记录，不记得具体日期也无需编造
- ⭐ **重要程度分层**：小事到人生里程碑共 5 级，可一键「只看大事」
- 🏷️ **事件分类**：8 种生活分类（生活 / 学业 / 工作 / 旅行 / 感情 / 健康 / 成就 / 其他）
- 📖 **纵向时间线**：中心时间轴 + 之字形卡片排列 + 出生起点，按年份分组
- 🔍 **搜索筛选**：关键词搜索 + 分类多选 + 命中计数
- 📊 **统计面板**：年度趋势 / 分类分布 / 月份活跃度
- 📤 **导入导出**：JSON 数据备份恢复 + 时间线导出为 PNG
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

- [产品需求规格](docs/产品需求规格.md) —— 要做什么（先看这个）
- [开发规划](docs/开发规划.md) —— 怎么做、做到哪了
- [设计理念与 UI 指南](docs/设计理念与UI指南.md) —— 长什么样、怎么动

## 🗺 路线图

**v0.4.0「记录能力补强」已完成**（详见开发规划）：
- 日期精度（年/月/日）—— 记不清具体某天也能如实记录
- 重要程度分层 + 「只看大事」—— 大事不被小事淹没
- 时间点 / 时间区间视觉强区分 —— 点是节点，区间是贯穿时间轴的色带
- 起止独立精度、「至今」、跨天/月/年自适应跨度，以及形态筛选

下一步：年份导航尺 + 吸顶年份、500 条事件性能兜底、删除 30 秒撤销、列表视图快速整理、人生阶段模板一键铺底。

后续：主题定制、事件配图/地点/参与人、单元测试与部署；更远期为用户系统与云同步。
