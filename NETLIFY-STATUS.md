# Netlify 迁移状态与上传方法

## 已修复的源码问题
原 GitHub 仓库只上传了 ZIP 压缩包。必须将本包解压后的文件和文件夹上传到仓库根目录，确保能直接看到 package.json、src、public、netlify.toml；不要再次只上传 ZIP。

netlify.toml 使用独立的 Vite 静态构建配置，不依赖原 Sites 托管配置。发布目录 dist/client，Node.js 22。页面路由已配置；API 不会被错误地改写为 HTML。

## 尚未完成
这是前端部署修正版，完整后端迁移尚未完成。数据库、WebSocket、管理后台认证、参与者历史数据及定时清理仍需部署配置。此时不要对外正式收集作品。

## 当前需要操作
1. 在 Codex 应用设置重新连接 GitHub，授权 Yantti3841/UM-design-week- 仓库读写。当前写入 API 返回 403。
2. 重新连接 Netlify。当前连接返回 requires reauthentication，无法读取实际部署失败详情。
3. Cloudflare 登录已由用户确认，后续仍需授权部署自己的 Worker 和 D1；不要公开发送密码或 Token。

现有 Sites 线上系统未被修改。不要删除原站或原数据库，待新系统完成上传、上屏、管理、断线恢复和数据迁移验证后再切换二维码。
