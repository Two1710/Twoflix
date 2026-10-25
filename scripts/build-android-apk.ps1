$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$localJdkRoot = Join-Path $projectRoot '.android-build-tools\jdk'
$localSdkRoot = Join-Path $projectRoot '.android-build-tools\sdk'

if (Test-Path $localJdkRoot) {
  $jdk = Get-ChildItem -LiteralPath $localJdkRoot -Directory | Select-Object -First 1
  if ($jdk) {
    $env:JAVA_HOME = $jdk.FullName
    $env:Path = "$($jdk.FullName)\bin;$env:Path"
  }
}

if (Test-Path (Join-Path $localSdkRoot 'cmdline-tools\latest\bin\sdkmanager.bat')) {
  $env:ANDROID_HOME = $localSdkRoot
  $env:ANDROID_SDK_ROOT = $localSdkRoot
}

Push-Location $projectRoot
try {
  & npm.cmd run android:sync
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

  Push-Location (Join-Path $projectRoot 'android')
  try {
    & .\gradlew.bat assembleDebug
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}

Write-Output "APK: $projectRoot\android\app\build\outputs\apk\debug\app-debug.apk"
