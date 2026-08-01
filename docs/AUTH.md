# 登录 / 注册方案（MVP）

## 产品规则
- 首页右上角圆形头像（App Store「Today」风格）
- **未登录**：点头像进入账户页 → 登录 / 注册；点「开始分析 / 拍照 / 相册」会先引导登录
- **已登录**：可使用 AI 形象测评；头像显示昵称首字

## 当前实现（本地账号）
- 注册：昵称 + 手机号 + 密码（≥6 位）
- 登录：手机号 + 密码
- 会话：AsyncStorage 持久化
- 密码：仅本地轻量哈希（演示用，**非生产安全方案**）

## 后续接服务端（推荐）
1. 后端提供：
   - `POST /auth/register`
   - `POST /auth/login`
   - `POST /auth/logout`
   - `GET /auth/me`（Bearer Token）
2. 前端把 `services/auth-local.ts` 换成 HTTP 实现，Context 接口保持不变
3. 中国区可升级为：手机号 + 短信验证码（替换密码或双因素）

## 页面
- `/account` 账户中心
- `/profile-settings` 我的信息（改头像 / 名称 / 手机号 / 密码）
- `/login` 登录
- `/register` 注册
