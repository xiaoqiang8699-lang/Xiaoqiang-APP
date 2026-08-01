/**
 * 选图后的本地路径处理。
 * MVP：直接使用 ImagePicker 返回的 URI（预览与 Mock 分析足够）。
 * 后续接真实上传时可在此压缩并写入缓存目录。
 */
export async function cachePickedImage(uri: string): Promise<string> {
  return uri;
}
