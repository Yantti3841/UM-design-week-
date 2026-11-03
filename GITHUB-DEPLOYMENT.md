# UMDW GitHub 源码交付包

基准：2026-11-03，线上 v42。此包包含全部已跟踪的程序源码、网页素材、数据库迁移、构建与本地预览脚本。不含线上参与者数据、账号密钥、node_modules 或本地数据库。

## 本地运行
安装 Node.js 22 或更新 LTS，并启用 pnpm。项目目录运行：

    corepack enable
    pnpm install --frozen-lockfile
    pnpm build

PowerShell 启动本地空数据库演示：

    $env:UMDW_LOCAL_DATABASE='1'
    pnpm preview

打开 http://127.0.0.1:4180/links 查看所有页面。本地空数据库与线上数据库独立。

## 页面
/ 生成器；/invite 邀请卡；/wall 实时花海；/scan 大二维码展示；/links 页面汇总；/archive 作品库；/admin 管理后台。

## GitHub 上传
解压后将整个目录作为新仓库上传，包含 public 素材和 pnpm-lock.yaml。不要上传 .env、.sites-runtime、node_modules、dist 或凭证。GitHub Pages 只能托管静态内容，无法独立运行此项目的 D1 数据库和 WebSocket 后端。

## 部署迁移边界（尚需配置）
当前是 Sites 上运行的 Cloudflare Worker + D1 + WebSocket。现有线上网站保持正常，本包不自动迁移线上数据。
1. 建议选择 Cloudflare Workers + D1，在自己的账号创建数据库。
2. 添加 Wrangler 配置，将 Worker 入口指向构建后的 dist/server/index.js，D1 绑定名称为 DB，迁移目录为 drizzle。
3. 按顺序执行 drizzle 中 SQL 迁移；配置 ADMIN_EMAIL 及独立域名。
4. 必须替换管理员登录：src/Admin.jsx 的 /signin-with-chatgpt 和 server/admin.js 的 oai-authenticated-user-* 信任头仅适用于原 Sites 身份认证。独立 Worker 不能信任客户端传来的同名头；需接入并验证 Cloudflare Access JWT 或其他正式身份认证，完成前不要开放管理 API。
5. src/event.js 的 PUBLIC_EVENT_URL 改为最终公开地址。检查邀请卡、展示页及大屏二维码都进入新生成器。
6. 在手机提交作品，另一个浏览器确认大屏同步；验证隐藏、回收站、恢复、数据库持久化和断线重连。
7. 保留展陈结束策略：2026-11-17 结束后停止收集并清理数据。原 Sites 自动清理任务不随源码迁移；新平台必须配置对应定时执行机制，不能仅依靠请求触发清理。

部署平台及身份认证尚未选定，因此此包是完整源码备份与迁移起点，不宣称一键部署完成。线上数据库导出需另行执行，避免个人信息进入公开 GitHub 仓库。
