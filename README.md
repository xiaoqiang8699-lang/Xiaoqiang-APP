# AI 形象重塑（MVP）

Expo SDK 54 + Expo Router。完整需求见 [docs/PRD.md](docs/PRD.md)。  
穿搭评估接口文档见 [docs/outfit_evaluation_api_doc.md](docs/outfit_evaluation_api_doc.md)。

## 启动

```bash
npx.cmd expo start
```

手机需安装支持 **SDK 54** 的 Expo Go。

## 真实接口（默认开启）

App 默认请求：

`POST https://dev.aizhitree.com/store/pub/openApi/outfitEvaluate.api`

本地选图会压缩后转 **纯 Base64** 上传（Header 带 `apiKey`）。

可选环境变量见 [.env.example](.env.example)：

- `EXPO_PUBLIC_OUTFIT_API_BASE_URL` — 基准地址（本地联调可改 `http://局域网IP:28080`）
- `EXPO_PUBLIC_OUTFIT_API_KEY` — 鉴权密钥
- `EXPO_PUBLIC_USE_MOCK_AI=1` — 不走真实接口，用本地 Mock

改 `.env` 后需重启 Expo。

## 调试开关（Mock 时）

- `EXPO_PUBLIC_FORCE_TONE=aesthetic_buddy` — 强制「贴心好友」语境
- `EXPO_PUBLIC_FORCE_INVALID=1` — 强制无效图兜底
