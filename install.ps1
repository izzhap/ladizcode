param (
    [switch]$NoPath = $false
)

$ErrorActionPreference = 'Stop'

# Application & Hosting Configuration
$AppName = "ladizcode"
$BaseDownloadUrl = "https://ladizai.chinafezz.my.id/downloads"
$InstallDir = "$env:LOCALAPPDATA\$AppName\bin"

Write-Host "Installing $AppName for Windows..." -ForegroundColor Cyan

# 1. Detect System Architecture
$Arch = if ([Environment]::Is64BitOperatingSystem) {
    if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64" -or $env:PROCESSOR_ARCHITEW6432 -eq "ARM64") { "arm64" } else { "x64" }
} else {
    Write-Host "Error: 32-bit operating systems are not supported." -ForegroundColor Red
    exit 1
}

$ZipName = "$AppName-windows-$Arch.zip"
$DownloadUrl = "$BaseDownloadUrl/$ZipName"

# 2. Ensure Installation Directory
if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
}

# 3. Download Release Archive
$TempZip = Join-Path $env:TEMP "$AppName-installer-$([Guid]::NewGuid().ToString('N')).zip"
Write-Host "Downloading $AppName ($Arch)..." -ForegroundColor Yellow
Write-Host "URL: $DownloadUrl" -ForegroundColor Gray

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
    Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempZip -UseBasicParsing

    # Validate downloaded archive size
    $FileSize = (Get-Item $TempZip).Length
    if ($FileSize -lt 1048576) {
        throw "Downloaded file size ($([math]::Round($FileSize/1KB, 2)) KB) is invalid. Please verify '$ZipName' exists on the server."
    }
} catch {
    Write-Host "`nError: Failed to download release archive." -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    if (Test-Path $TempZip) { Remove-Item $TempZip -Force }
    exit 1
}

# 4. Extract Archive
Write-Host "Extracting package to $InstallDir..." -ForegroundColor Yellow
try {
    Expand-Archive -Path $TempZip -DestinationPath $InstallDir -Force
} catch {
    Write-Host "Error: Failed to extract binary archive." -ForegroundColor Red
    Write-Host "Details: $_" -ForegroundColor Red
    exit 1
} finally {
    if (Test-Path $TempZip) { Remove-Item $TempZip -Force }
}

# 5. Environment PATH Setup
if (-not $NoPath) {
    $UserPath = [Environment]::GetEnvironmentVariable("Path", "User")
    if ($UserPath -split ";" -notcontains $InstallDir) {
        Write-Host "Adding $InstallDir to User PATH environment variable..." -ForegroundColor Yellow
        $NewPath = "$UserPath;$InstallDir"
        [Environment]::SetEnvironmentVariable("Path", $NewPath, "User")
        $env:Path = "$env:Path;$InstallDir"
    }
}

Write-Host "`n$AppName installed successfully." -ForegroundColor Green
Write-Host "Run '$AppName' in a new terminal session to begin." -ForegroundColor Cyan
