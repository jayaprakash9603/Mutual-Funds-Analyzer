# Build host artifacts, then create Docker images (no Maven/npm inside Docker).
param(
  [string]$Version = $(if ($env:MFA_VERSION) { $env:MFA_VERSION } else { "1.0.3" }),
  [switch]$Push,
  [switch]$SkipBackend,
  [switch]$SkipFrontend
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

Write-Host "==> Version: $Version" -ForegroundColor Cyan

if (-not $SkipBackend) {
  Write-Host "==> Building backend JAR (Maven)" -ForegroundColor Cyan
  mvn -f backend/pom.xml -B -DskipTests package
  $jar = Get-ChildItem -Path "backend/target" -Filter "mutual-funds-analyzer-backend-*.jar" |
    Where-Object { $_.Name -notlike "*-sources.jar" -and $_.Name -notlike "*-javadoc.jar" } |
    Select-Object -First 1
  if (-not $jar) { throw "Backend JAR not found under backend/target" }
  New-Item -ItemType Directory -Force -Path "backend/docker" | Out-Null
  Copy-Item -Force $jar.FullName "backend/docker/app.jar"
  Write-Host "    Staged: backend/docker/app.jar ($([math]::Round($jar.Length/1MB, 1)) MB)"
}

if (-not $SkipFrontend) {
  Write-Host "==> Building frontend (npm run build:live)" -ForegroundColor Cyan
  if (-not (Test-Path "node_modules")) { npm ci }
  npm run build:live
  if (-not (Test-Path "dist/index.html")) { throw "Frontend dist/ missing after build:live" }
}

Write-Host "==> Building Docker images" -ForegroundColor Cyan
$env:MFA_VERSION = $Version
docker compose build backend frontend

docker tag "jayaprakash9603/mfa-backend:$Version" "jayaprakash9603/mfa-backend:latest"
docker tag "jayaprakash9603/mfa-frontend:$Version" "jayaprakash9603/mfa-frontend:latest"

Write-Host "==> Images ready:" -ForegroundColor Green
docker images "jayaprakash9603/mfa-*"

if ($Push) {
  Write-Host "==> Pushing to Docker Hub" -ForegroundColor Cyan
  docker push "jayaprakash9603/mfa-backend:$Version"
  docker push "jayaprakash9603/mfa-backend:latest"
  docker push "jayaprakash9603/mfa-frontend:$Version"
  docker push "jayaprakash9603/mfa-frontend:latest"
  Write-Host "==> Push complete" -ForegroundColor Green
} else {
  Write-Host "Tip: re-run with -Push to upload to Docker Hub" -ForegroundColor Yellow
}
