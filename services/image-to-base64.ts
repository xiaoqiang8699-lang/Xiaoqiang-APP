import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

/**
 * 压缩本地图片并转为接口可识别的 Data URI。
 *
 * 实测：纯 Base64（尤其 JPEG 的 `/9j/` 开头）会被后端误当成 URL，
 * 报 InvalidParameter / URL invalid。
 * 使用 `data:image/jpeg;base64,<pure>` 后，服务端可正确解码。
 */
export async function imageUriToBase64(uri: string): Promise<string> {
  const result = await manipulateAsync(
    uri,
    [{ resize: { width: 1280 } }],
    {
      compress: 0.72,
      format: SaveFormat.JPEG,
      base64: true,
    },
  );

  if (!result.base64) {
    throw new Error('图片编码失败，请换一张照片再试');
  }

  const pure = result.base64
    .replace(/^data:image\/\w+;base64,/i, '')
    .replace(/\s/g, '');

  return `data:image/jpeg;base64,${pure}`;
}
