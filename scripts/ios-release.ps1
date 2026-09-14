# 照型 iOS：配置证书 → 云端构建 → 提交 App Store Connect
# 在弹出的窗口中按提示登录 Apple 开发者账号（建议使用 app 专用密码）
$ErrorActionPreference = "Stop"
Set-Location -LiteralPath $PSScriptRoot\..

$env:EAS_BUILD_NO_EXPO_GO_WARNING = "true"
Remove-Item Env:CI -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "=== 1/3 配置 iOS 构建证书 (com.xiaoqiang.toolbox) ===" -ForegroundColor Cyan
Write-Host "提示：若询问是否登录 Apple，选 Yes，账号可用 344820048@qq.com"
Write-Host ""
npx.cmd eas credentials:configure-build -p ios -e production
if ($LASTEXITCODE -ne 0) {
  Write-Host "证书配置失败，已中止。" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== 2/3 EAS iOS production 构建（云端，可能需 15-30 分钟）===" -ForegroundColor Cyan
npx.cmd eas build --platform ios --profile production --non-interactive --wait
if ($LASTEXITCODE -ne 0) {
  Write-Host "构建失败，已中止。" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== 3/3 提交到 App Store Connect (6797169974) ===" -ForegroundColor Cyan
npx.cmd eas submit --platform ios --profile production --latest --non-interactive --wait
if ($LASTEXITCODE -ne 0) {
  Write-Host "提交失败。" -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "全部完成。请到 App Store Connect 补截图/隐私问卷并点「提交以供审核」。" -ForegroundColor Green
Write-Host "按任意键关闭窗口..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
