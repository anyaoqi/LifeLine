# LifePoint · 人生纪念册 📖

把人生里值得记住的时刻留在纸上 —— 一本只属于你的时间线:大事清晰立传,小事温柔收好。

> v0.6.0「纪念册」大改版:纸面设计语言、编年体虚拟滚动时间线、快速连续录入、人生模板铺底、列表整理视图、事件配图。

## ✨ 功能(当前 v0.6.0)

### 记录
- ⚡ **快速连续录入**:标题 + 日期即可保存;「保存并继续」批量录入不关弹窗;全局快捷键 `n` / 顶栏 / FAB 任意唤起
- 📅 **如实记录日期**:年 / 月 / 日三档精度,记不清就写「2003 年」,绝不伪造「2003年1月1日」
- ⏱ **时间点与时间区间**泾渭分明:点 = 节点,区间 = 贯穿时间轴的色带;支持「至今」与起止独立精度
- ⭐ **重要程度 1-5 星**:里程碑大卡立传,小事轻量单行,大事不被淹没
- 🏷 **8 种分类**:lucide 图标 + 降饱和分类色;支持地点 / 参与人 / 心情
- 🖼 **事件配图**:多图存 IndexedDB Blob,详情画廊 + 灯箱查看
- 📝 **人生模板一键铺底**:学业 / 职业 / 感情 / 生活四套模板按出生年份生成草稿,确认后转正 —— 冷启动 10 分钟建档

### 浏览
- 📖 **编年体时间线**:出生 → 现在,像纪念册一样翻阅;「生」起点节点 + 「现在」呼吸终点
- 🚀 **虚拟滚动**:500+ 条事件 DOM 恒定有界(实测 513 条仅渲染 10 张卡),滚动不掉帧
- 🎨 **三档视觉分层**:里程碑衬线大卡(分类色左标 + 发光环)/ 标准卡 / 轻量单行
- 🧭 **年份导航尺 + 吸顶年份**:粘性芯片直达该年,衬线年份大字随滚动点亮
- 🔢 **年龄标注**:每条记录如实显示「当时几岁」
- 🔍 **搜索与筛选**:关键词(` `/ 快捷键聚焦)+ 分类多选 + 形态切换 + 「纪念册 / 只看大事」密度
- ⌨️ **键盘导航**:`↑↓` 事件间移动、`Enter` 打开编辑、`Esc` 收起、`n` 新建、`/` 搜索

### 整理与回顾
- 📋 **列表整理视图**:按年份分组、行内编辑、批量选择删除、与时间线共享筛选
- 📊 **人生统计**:年度趋势 / 分类分布 / 月份活跃度 / **人生比例图**(岁月都花在了哪里)/ **那年今日**
- ↩️ **删除撤销**:30 秒内一键恢复(配图同步延迟清理)
- 📤 **导入导出**:JSON 备份(格式 2.1,含配图,兼容旧版)+ 时间线 PNG 导出
- 🌙 **暗黑模式**:纸面 / 暖炭两态,全组件语义色自动切换
- 📱 **移动端**:底部固定 tab 导航 + 下滑式弹层 + 安全区适配
- 💾 **本地存储**:所有数据只在你的浏览器里,隐私优先

## 🛠 技术栈

- Vue 3.5 + TypeScript + Vite
- Pinia(状态管理)、Vue Router
- **Tailwind CSS v4**(CSS-first 设计令牌,`--app-*` 语义色随主题切换)
- **lucide-vue-next**(图标)、**Noto Serif SC**(衬线标题字体)
- Dexie.js v4(IndexedDB,含 images Blob 表)
- Vitest(42 用例)

## 🚀 快速开始

```bash
pnpm install     # 安装依赖
pnpm dev         # 启动开发服务器
pnpm build       # 类型检查 + 生产构建
pnpm test        # 运行单元测试(Vitest)
```

## 🌐 在线访问(GitHub Pages)

应用自动部署在 **https://anyaoqi.github.io/LifeLine/**:

- 合并 Pull Request 到 `main`,或推送 `v*` 标签时,GitHub Actions 自动构建发布
- PR 会先跑单元测试 + 生产构建(CI),通过后方可合并
- 自定义域名时设置环境变量 `BASE_PATH=/` 去掉子路径前缀

## 🔒 数据隐私

所有数据(档案、事件、配图)仅保存在你自己的浏览器,**不上传任何服务器**。换设备前请在「设置」导出 JSON 备份(包含配图)。云端同步在路线图中,会以可选功能提供。

## 📁 项目结构

```
src/
├── app/               # 应用壳:AppHeader / MobileTabBar
├── components/
│   ├── ui/            # 设计系统原子组件(Button/Modal/BottomSheet/Toast/StarRating…)
│   ├── timeline/      # VirtualTimeline / EventCard / TimelineFilter
│   ├── event/         # QuickCapture / EventFormPanel / EventDetail / LifeTemplatePicker
│   ├── Profile/       # ProfileCard / ProfileEditor / WelcomePanel / BirthDatePicker
│   └── Stats/         # 各统计图 + StatsLifeRatio / StatsOnThisDay
├── composables/       # useVirtualTimeline / useToast / useGlobalShortcuts
├── views/             # HomeView(=时间线) / ListPageView / StatsView / ProfileView / SettingsView
├── stores/            # eventStore / userStore / uiStore
├── services/          # storageService(Dexie) / imageService / exportService
├── utils/             # constants / dateUtils / lifeTemplates / stats / filter / validators
├── router/            # 路由 + 守卫
└── styles/            # main.css(设计令牌,单一样式入口)
```

## 🔀 分支与发布流程

- `main` 为稳定分支,通过 Pull Request 合入(合并即部署)
- 功能分支命名 `feat/vX.Y.Z-描述`,发布打 `vX.Y.Z` 标签
- 工作流:`.github/workflows/ci.yml`(PR 测试构建)、`deploy.yml`(自动部署)

## 📚 相关文档

- [产品需求规格](docs/产品需求规格.md) —— 要做什么(先看这个)
- [开发规划](docs/开发规划.md) —— 怎么做、做到哪了
- [设计理念与 UI 指南](docs/设计理念与UI指南.md) —— 长什么样、怎么动

## 🗺 路线图

**v0.6.0「纪念册」已完成**:设计系统全面翻新(Tailwind v4 令牌 + 衬线排版 + 图标库)、编年体虚拟滚动时间线、QuickCapture 连续录入、列表整理视图、人生模板铺底、配图/地点/参与人/心情、人生比例与那年今日。

**下一步**:回顾与提醒(人生倒计时、里程碑庆祝)、时间线海报导出、主题与时间线风格定制。

**更远期**:用户系统与可选云同步(本地数据优先不变)。
