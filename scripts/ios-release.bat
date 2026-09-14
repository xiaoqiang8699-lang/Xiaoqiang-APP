@echo off
cd /d "e:\桌面文件-2\AppProject"
echo.
echo ========================================
echo  Zhaoxing iOS: credentials + build + submit
echo ========================================
echo  When asked to log in to Apple: choose Yes
echo  Apple ID tip: 344820048@qq.com
echo  Prefer an App-Specific Password
echo ========================================
echo.

set EAS_BUILD_NO_EXPO_GO_WARNING=true
set CI=

echo [1/3] Configure iOS credentials...
call npx.cmd eas credentials:configure-build -p ios -e production
if errorlevel 1 (
  echo CREDENTIALS FAILED
  pause
  exit /b 1
)

echo.
echo [2/3] EAS production build (15-30 min)...
call npx.cmd eas build --platform ios --profile production --non-interactive --wait
if errorlevel 1 (
  echo BUILD FAILED
  pause
  exit /b 1
)

echo.
echo [3/3] Submit to App Store Connect...
echo Interactive login may be required for ASC API Key / Apple ID.
call npx.cmd eas submit --platform ios --profile production --latest --wait
if errorlevel 1 (
  echo SUBMIT FAILED
  pause
  exit /b 1
)

echo.
echo DONE. Finish ASC screenshots/privacy then Submit for Review.
pause
