$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host ""
Write-Host "HeimerClean Signal Hub hazirlaniyor..." -ForegroundColor Cyan

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Host "Node.js bulunamadi. Once https://nodejs.org adresinden Node.js LTS kurun." -ForegroundColor Red
  Read-Host "Kapatmak icin Enter"
  exit 1
}

if (-not (Test-Path "node_modules")) {
  Write-Host "Ilk kurulum: paketler indiriliyor..." -ForegroundColor Yellow
  corepack pnpm install
}

$firstRun = -not (Test-Path ".env")
if ($firstRun) {
  $bytes = New-Object byte[] 48
  [Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
  $secret = [Convert]::ToBase64String($bytes)

  $saltBytes = New-Object byte[] 32
  [Security.Cryptography.RandomNumberGenerator]::Fill($saltBytes)
  $salt = [Convert]::ToBase64String($saltBytes)

  @"
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEFAULT_LOCALE=en
DATABASE_URL=file:./dev.db
AUTH_SECRET=$secret
ANALYTICS_RETENTION_DAYS=90
ANALYTICS_DAILY_SALT_SECRET=$salt
"@ | Set-Content ".env" -Encoding UTF8
}

$databaseMissing = -not (Test-Path "prisma/dev.db")
if ($databaseMissing) {
  Write-Host "Yerel veritabani olusturuluyor (Docker gerekmez)..." -ForegroundColor Yellow
}
corepack pnpm setup:local
if ($LASTEXITCODE -ne 0) {
  throw "Yerel veritabani hazirlanamadi."
}

corepack pnpm admin:exists *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "Admin hesabinizi bir kez olusturun." -ForegroundColor Cyan
  corepack pnpm admin:create
  if ($LASTEXITCODE -ne 0) {
    throw "Admin hesabi olusturulamadi."
  }
}

Write-Host ""
Write-Host "Site aciliyor: http://localhost:3000/tr" -ForegroundColor Green
Write-Host "Admin paneli:  http://localhost:3000/admin" -ForegroundColor Green
Write-Host "Durdurmak icin bu pencerede Ctrl+C tuslarina basin." -ForegroundColor DarkGray
Write-Host ""
corepack pnpm dev
