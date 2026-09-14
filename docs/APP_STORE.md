# App Store 上架清单（「AI形象重塑」）

本文档列出**代码已覆盖**与**需你在 Apple / EAS 人工完成**的事项。

## 已在工程内完成

- iOS `bundleIdentifier`：`com.zsaos.aistylereshape`，`buildNumber`，不支持 iPad
- 相机 / 相册权限说明文案；关闭麦克风权限声明
- `ITSAppUsesNonExemptEncryption: false`（若实际使用豁免范围外加密需改回并申报）
- Privacy Manifest（UserDefaults / 文件时间戳 / 磁盘空间 / 启动时间）
- EAS 构建配置：`eas.json`
- 会话写入 `expo-secure-store`；密码 SHA-256；登录可升级旧哈希
- **删除账号**（清除本地用户与该用户历史）
- 应用内 **隐私政策 / 用户协议** 与注册同意勾选
- API Key 仅通过 `EXPO_PUBLIC_OUTFIT_API_KEY` 注入，仓库不含真实 Key

## 你必须人工完成

### 1. 替换图标与启动图

当前 `assets/images/icon.png` 等仍可能是模板图。请提供：

- App Icon 1024×1024（无透明、无圆角）
- 启动图 / Android adaptive icon 前景

替换 `assets/images/` 后重新 `eas build`。

### 2. 初始化 EAS 项目

```bash
npx eas-cli login
npx eas init
```

`eas init` 会自动写入 `app.json` → `expo.extra.eas.projectId`。  
**注意：** 在完成 `eas init` 之前，不要手写假的 `projectId`，否则 Expo Go 扫码会因登录校验报 500。

### 3. 配置生产环境变量

复制 `.env.example` 为 `.env`（本地）或在 EAS Secrets 配置：

- `EXPO_PUBLIC_OUTFIT_API_BASE_URL`
- `EXPO_PUBLIC_OUTFIT_API_KEY`

生产构建**不要**开启 `EXPO_PUBLIC_USE_MOCK_AI=1`。

### 4. App Store Connect

1. 创建 App，Bundle ID 与 `com.zsaos.aistylereshape` 一致  
2. 填写 `eas.json` → `submit.production.ios` 的 `appleId` / `ascAppId` / `appleTeamId`  
3. 隐私问卷：说明收集的数据（照片、联系信息等）及用途  
4. **账号删除**：说明应用内「我的账户 → 删除账号」路径  
5. 审核备注：提供测试账号与密码；说明需相机/相册权限才能测评  
6. 若审核要求可公开访问的隐私政策 URL：将 `constants/legal.ts` 内容托管到 HTTPS 页面，并在 ASC 填写该 URL  

### 5. 构建与提交

```bash
npx eas build --platform ios --profile production
npx eas submit --platform ios --profile production
```

### 6. 法务文案审阅

上架前请法务/运营审阅 `constants/legal.ts` 中的运营主体名称、联系邮箱与存储说明，确保与实际一致。
