# Life-Point 前端 📅

人生事件节点记录应用 —— 记录、可视化和回顾你的人生轨迹。

## ✨ 功能（当前 v0.5.0）

- 👤 **个人档案**：创建/编辑个人档案（姓名、出生日期、简介、年龄计算）
- 📝 **事件管理**：添加、编辑、删除人生节点；明确区分**时间点**（结婚、第一次出国）与**时间区间**（上高中、某份工作），支持「至今」
- 📅 **如实记录日期**：可按年 / 月 / 日记录，不记得具体日期也无需编造
- ⭐ **重要程度分层**：小事到人生里程碑共 5 级，可一键「只看大事」
- 🏷️ **事件分类**：8 种生活分类（生活 / 学业 / 工作 / 旅行 / 感情 / 健康 / 成就 / 其他）
- 📖 **纵向时间线**：中心时间轴 + 之字形卡片排列 + 出生起点，按年份分组
- 🧭 **年份导航尺**：顶部年份胶囊一键直达该年，滚动时联动高亮当前年份
- 📌 **吸顶年份**：滚动阅读时当前年份始终钉在页头下方，深浅色模式均适配
- ↩️ **删除撤销**：误删 30 秒内可一键恢复，倒计时与进度条同步
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
npm test         # 运行单元测试（Vitest）
```

## 🌐 在线访问（GitHub Pages）

应用自动部署在 **https://anyaoqi.github.io/LifeLine/**：

- 合并 Pull Request 到 `main`，或推送 `v*` 标签（如 `v0.5.0`）时，GitHub Actions 自动构建并发布
- Pull Request 会先运行单元测试 + 生产构建（CI），通过后方可合并
- 首次启用需在仓库 **Settings → Pages → Source** 选择「GitHub Actions」
- 自定义域名时设置环境变量 `BASE_PATH=/` 即可去掉子路径前缀

## 🔒 数据隐私

所有数据（档案、事件）仅保存在你自己的浏览器（IndexedDB + localStorage），**不上传任何服务器**。换设备或清空浏览器数据前，请先在「设置」中导出 JSON 备份。云端同步在路线图中，会以可选功能提供。

## 📁 项目结构

```
src/
├── components/
│   ├── common/        # AppHeader / AppModal / AppButton
│   ├── EventForm/     # EventForm / PrecisionDatePicker / EventDeleteConfirm
│   ├── Profile/       # ProfileCard / ProfileEditor
│   ├── Stats/         # StatsBarChart / StatsCategoryChart / StatsMonthHeatmap
│   └── Timeline/      # TimelineView / EventCard / TimelineFilter / DeleteUndoToast
├── views/             # HomeView / TimelinePageView / ProfileView / SettingsView / StatsView
├── stores/            # userStore / eventStore / uiStore (Pinia)
├── services/          # storageService (Dexie + localStorage) / exportService
├── types/             # TypeScript 类型定义
├── utils/             # constants / dateUtils / filter / stats / validators
├── router/            # 路由配置 + 全局守卫
└── styles/            # main.css (Tailwind + 设计系统)
```

## 🔀 分支与发布流程

- `main` 为稳定分支，通过 Pull Request 合入（合并即触发部署）
- 功能分支命名 `feat/vX.Y.Z-描述`，发布时打 `vX.Y.Z` 标签
- 工作流：`.github/workflows/ci.yml`（PR 测试构建）、`.github/workflows/deploy.yml`（自动部署）

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

**v0.5.0「时间轴体验 + 自动部署」已完成**：
- 年份导航尺 + 吸顶年份 + 滚动联动高亮
- 删除 30 秒撤销（Toast + 倒计时进度条）
- 入场动画错峰封顶（长时间线秒开）、`prefers-reduced-motion` 适配
- GitHub Actions：PR CI（测试 + 构建），合并到 main / 推送 v* 标签自动部署 Pages

下一步：列表视图快速整理、人生阶段模板一键铺底、事件配图/地点/参与人。

更远期：用户系统与可选云同步（本地数据优先不变）。
