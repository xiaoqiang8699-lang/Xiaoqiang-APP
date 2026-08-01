# 穿搭评估接口（Outfit Evaluation API）外部对接文档

本文档用于描述「AI 形象重塑」系统中穿搭评估接口（`/pub/openApi/outfitEvaluate.api`）的调用规范，方便外部系统（如 Cursor 等 AI 辅助开发工具）快速对接。

---

## 1. 接口概述

该接口接收用户上传的穿搭照片（支持 **公网可访问的图片 URL** 以及 **图片的 Base64 编码**），通过鉴权后调用本地/云端视觉多模态大模型，判定图片的有效性，对有效穿搭照提供六个维度的打分、闺蜜/好友口吻的“情绪价值夸夸”，以及针对性的穿搭优化建议。

---

## 2. 请求信息

* **接口路径**：`/store/pub/openApi/outfitEvaluate.api`
* **开发/生产环境基准地址**：`https://dev.aizhitree.com`  
  *(本地联调测试地址默认为：`http://localhost:28080`)*
* **请求方式**：`POST`
* **请求头 (Headers)**：
  * `Content-Type`: `application/json`
  * `apiKey`: `azs-tag-2026-secure-keyHJKHJHGHHF` *(必填，用作鉴权)*

---

## 3. 请求体（Request Body）

发送格式为 JSON，包含 `image` 参数（向下兼容 `imageUrl`）：

```json
{
  "image": "https://dev.aizhitree.com/store/resources/storeImage/10/ffe54705d6584342ada75fcc7db0e18d.png"
}
```

> **注意**：
> 如果使用 **Base64** 传入，必须是图片的 Base64 编码字符串。不需要带有 `data:image/png;base64,` 等前缀，直接将纯 Base64 内容作为字符串传入即可。建议上传图片大小控制在 **5MB** 以内。

---

## 4. 响应体（Response Body）

接口返回系统标准的 HTTP 响应格式，包含 `code`, `message` 和存放业务数据的 `data` 节点。

### 4.1 场景一：有效穿搭图返回（`is_valid: true`）

当上传的图片能够辨认出人像穿搭主体时，`data` 节点内会返回完整的结构化分析数据：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "is_valid": true,
    "tone": "girl_friend", 
    "score": 94,
    "dimensions": [
      { "key": "overall", "label": "整体氛围", "value": 94 },
      { "key": "color", "label": "色彩搭配", "value": 96 },
      { "key": "fabric", "label": "面料质感", "value": 93 },
      { "key": "proportion", "label": "廓形比例", "value": 95 },
      { "key": "style", "label": "风格完成", "value": 97 },
      { "key": "detail", "label": "精致细节", "value": 92 }
    ],
    "praise": "姐妹今日状态绝了！整身干净又有气质，色彩和版型都很加分。",
    "analysis": "肤色偏暖，当前上装明度与之较搭；上装版型利落，下装延长了腿部线条。色彩过渡自然，面料质感干净，整体风格统一，氛围完成度高。",
    "advice": [
      "内搭可微调为更贴合肤色冷暖的米色系，气色会更稳。",
      "领口可加一条细项链或调整叠穿层次，让视觉焦点更清晰。"
    ]
  }
}
```

#### 有效图关键字段逻辑说明：
1. **`tone`**：输出语气风格，有 `"girl_friend"`（贴心闺蜜口吻，适合女性主体）和 `"aesthetic_buddy"`（懂审美的好友口吻，适合男性或中性主体）。
2. **`score`**：穿搭氛围/完成度综合得分，范围在 `85 ~ 100` 之间，该值**必定等于** `dimensions` 列表中 `key` 为 `overall` 的 `value`。
3. **`dimensions`**：包含细分评分的数组，固定为 6 个维度，字段的 `key`（键）和 `label`（名称展示）顺序及命名不可变，具体数值在 `85 ~ 100` 之间。
4. **`praise`**：情绪价值夸夸点评（2~4 句短语，贴合当前 `tone` 语气风格）。
5. **`analysis`**：专业解析段落，融合对人脸/发型/肤色气质（若可见）与服装颜色版型、面料质感、廓形等维度的通俗评价。
6. **`advice`**：优化穿搭的具体可执行建议，以字符串数组形式返回，有 **1 ~ 2 条** 建议（不超过 2 条）。

---

### 4.2 场景二：无效图片返回（`is_valid: false`）

当传入风景照、纯物品、极度模糊或非人像穿着主体照片时，模型判定为无效，只返回判定原因和温柔的引导语：

```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "is_valid": false,
    "invalid_reason": "no_person",
    "praise": "这张图好有氛围，不过我更想好好看看你和今日穿搭～换一张半身或全身穿搭照，我马上给你专属夸夸和造型密码。"
  }
}
```

#### 无效图关键字段逻辑说明：
1. **`invalid_reason`**：判定为无效图的精准原因，仅包含以下三个枚举值之一：
   * `"no_person"`：图片中没有人像主体。
   * `"blurry"`：画面极度模糊，无法辨识。
   * `"other"`：其他无效原因（风景、非服装类纯物品等）。
2. **`praise`**：由 AI 依据当前画面生成的温柔高情商回复，用以替代硬编码报错，引导用户重新更换穿搭照进行测评。

---

## 5. 常见调用代码示例 (JavaScript / Node.js)

```javascript
const axios = require('axios');

async function evaluateOutfit(imageSource) {
  const url = "https://dev.aizhitree.com/store/pub/openApi/outfitEvaluate.api";
  const headers = {
    "Content-Type": "application/json",
    "apiKey": "azs-tag-2026-secure-keyHJKHJHGHHF"
  };
  const payload = {
    "image": imageSource // 可以是图片的 URL 或是 Base64 编码字符串
  };

  try {
    const response = await axios.post(url, payload, { headers });
    if (response.data && response.data.code === 0) {
      const result = response.data.data;
      if (result.is_valid) {
        console.log(`综合评分: ${result.score}`);
        console.log(`夸夸寄语: ${result.praise}`);
        console.log(`优化建议: ${result.advice.join('; ')}`);
      } else {
        console.warn(`测评失败原因: ${result.invalid_reason}`);
        console.warn(`提示语: ${result.praise}`);
      }
      return result;
    } else {
      throw new Error(response.data.message || "请求失败");
    }
  } catch (error) {
    console.error("调用穿搭评估接口异常:", error.message);
  }
}
```
