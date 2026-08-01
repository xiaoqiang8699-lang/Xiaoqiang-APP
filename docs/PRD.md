# AI 形象重塑 APP — MVP 开发需求文档（修订版）

> 基于 PRD 审查结论修订。技术决策：前端 Mock 分析 + Expo Router。

## 1. 项目背景与定位

- **产品名称**：AI 形象重塑（暂定）
- **目标受众**：18–30 岁年轻女性；开发期需兼容男性穿搭自测照。
- **产品基调**：高情商贴心闺蜜；专业理论底层，网感赞美前端表达。
- **跨性别语境**：识别为男性穿搭时，切换为「懂审美的贴心好友」语气（字段 `tone`）。

## 2. 技术栈

| 项 | 选型 |
| --- | --- |
| 框架 | React Native · Expo 托管（SDK 54，对齐 Expo Go） |
| 语言 | TypeScript（严格类型） |
| 路由 | **Expo Router**（文件路由；底层仍为 React Navigation） |
| 图片 | `expo-image-picker`（选取）+ `expo-file-system`（本地缓存/体积信息） |
| 样式 | React Native `StyleSheet`；黑 / 白 / 灰极简高级感 |
| AI（MVP） | **前端 Mock**，接口形状与未来真实 API 一致，便于替换 |

## 3. 页面与导航

```
app/index.tsx   → 首页（含 Loading 态）
app/result.tsx  → 结果报告页
```

- Loading **不是独立路由**，为首页内遮罩状态。
- 分析结果经内存 store 传递（避免大图 URI + JSON 塞进 URL params）。
- 「再测一次」：清空结果与选图，回到首页空白态。

## 4. 用户流程

### 4.1 首页

- 顶栏标题：「AI 形象重塑」
- 中央占位卡：未选图显示「+」与提示「上传今日穿搭，解锁专属形象密码」
- 底部双按钮：**拍照** / **从相册选择**（图标组件 + 文字，不用 emoji）
- 权限：相机 / 相册；拒绝时 Alert，引导可去系统设置
- 选图后：预览图；按钮变为 **开始 AI 分析** / **重新选择**

### 4.2 分析中（Loading）

- 图上半透明遮罩 + 轻扫描动效
- 文案轮播：面部轮廓 → 穿搭色彩 → 面料质感与氛围
- 分析中禁用重复点击；失败则收起遮罩并 Toast/Alert

### 4.3 结果页

- `is_valid: false`：仅兜底文案卡 + **重新上传**
- `is_valid: true`：穿搭氛围分（85–100）、夸夸、专业解析、1–2 条建议
- 底栏：**再测一次**

## 5. 数据模型

```typescript
export type AnalysisTone = 'girl_friend' | 'aesthetic_buddy';
export type InvalidReason = 'no_person' | 'blurry' | 'other';

export type AIAnalysisResult =
  | {
      is_valid: false;
      praise: string;
      invalid_reason?: InvalidReason;
    }
  | {
      is_valid: true;
      /** 穿搭氛围分，产品策略区间 85–100（非外貌贬损分） */
      score: number;
      praise: string;
      analysis: string;
      advice: [string] | [string, string];
      tone: AnalysisTone;
    };
```

分数模块对用户展示文案为 **「穿搭氛围分」**，避免「颜值打分」敏感表述。

## 6. Mock API 契约（可替换为真实 HTTP）

- **函数**：`analyzeOutfit(imageUri: string): Promise<AIAnalysisResult>`
- **耗时**：约 2.5–3.5s（模拟）
- **调试**：可通过 `EXPO_PUBLIC_FORCE_TONE=aesthetic_buddy|girl_friend` 强制语气；`EXPO_PUBLIC_FORCE_INVALID=1` 强制无效图
- **图片**：客户端将选图复制到 cache（file-system）；MVP 不上传远端
- **失败**：Mock 偶发网络错误可扩展；默认成功

## 7. 权限与配置（app.json）

- iOS：`NSCameraUsageDescription`、`NSPhotoLibraryUsageDescription`
- Android：image-picker 插件默认权限
- 拒绝态文案：「需要相册/相机权限才能上传穿搭哦，可在系统设置中开启。」

## 8. 错误与边界

| 场景 | 行为 |
| --- | --- |
| 权限拒绝 | Alert，不崩溃 |
| 用户取消选图 | 无操作 |
| 分析失败 | Alert + 回到可再次分析态 |
| 无效图 | 结果页兜底，不展示分数模块 |
| 再测一次 | 清 store，回首页 |

## 9. 非功能（MVP）

- 不登录、不存历史、不做云同步
- 照片仅本机临时缓存，用于预览与 Mock
- 亮色为主；暗色沿用系统 automatic，使用同一套灰阶令牌

## 10. 后续（非 MVP）

- 真实视觉模型 API、鉴权、压缩上传、历史记录、误判纠正入口
