#!/usr/bin/env pwsh
# JobSync Chrome Extension - Setup Script
# Run this script to download dependencies and generate icons

$ErrorActionPreference = "Stop"
$ExtensionDir = Join-Path $PSScriptRoot "extension"
$LibDir = Join-Path $ExtensionDir "lib"
$AssetsDir = Join-Path $ExtensionDir "assets"

Write-Host "=== JobSync Chrome Extension Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Create directories
Write-Host "[1/4] Creating directory structure..." -ForegroundColor Yellow
@($ExtensionDir, $LibDir, $AssetsDir) | ForEach-Object {
    if (-not (Test-Path $_)) {
        New-Item -ItemType Directory -Path $_ -Force | Out-Null
        Write-Host "  Created: $_"
    }
}

# Step 2: Download SheetJS (xlsx) library
Write-Host "[2/4] Downloading SheetJS library..." -ForegroundColor Yellow
$XlsxUrl = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"
$XlsxPath = Join-Path $LibDir "xlsx.full.min.js"

if (-not (Test-Path $XlsxPath)) {
    try {
        Write-Host "  Downloading from $XlsxUrl ..."
        Invoke-WebRequest -Uri $XlsxUrl -OutFile $XlsxPath -UseBasicParsing
        Write-Host "  Downloaded to: $XlsxPath" -ForegroundColor Green
    } catch {
        Write-Warning "  Failed to download SheetJS library: $_"
        Write-Host "  You can manually download it from: https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js" -ForegroundColor Yellow
        Write-Host "  Place it at: $XlsxPath" -ForegroundColor Yellow
    }
} else {
    Write-Host "  Already exists: $XlsxPath" -ForegroundColor Green
}

# Step 3: Generate icon PNGs using .NET Drawing
Write-Host "[3/4] Generating extension icons..." -ForegroundColor Yellow

function Generate-Icon {
    param([int]$Size, [string]$OutputPath)

    try {
        Add-Type -AssemblyName System.Drawing

        $bitmap = New-Object System.Drawing.Bitmap($Size, $Size)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

        # Background circle
        $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(26, 26, 46))
        $graphics.FillEllipse($brush, 0, 0, $Size-1, $Size-1)

        # Letter "J" in white
        $fontSize = [Math]::Max(8, [Math]::Floor($Size * 0.55))
        $font = New-Object System.Drawing.Font("Segoe UI", $fontSize, [System.Drawing.FontStyle]::Bold)
        $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)

        $text = "J"
        $stringFormat = New-Object System.Drawing.StringFormat
        $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
        $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

        $rect = New-Object System.Drawing.RectangleF(0, 0, $Size, $Size)
        $graphics.DrawString($text, $font, $whiteBrush, $rect, $stringFormat)

        $graphics.Dispose()
        $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
        $bitmap.Dispose()

        Write-Host "  Generated: $OutputPath" -ForegroundColor Green
    } catch {
        Write-Warning "  Could not generate icon ($Size`x$Size): $_"
    }
}

Generate-Icon -Size 16 -OutputPath (Join-Path $AssetsDir "icon16.png")
Generate-Icon -Size 48 -OutputPath (Join-Path $AssetsDir "icon48.png")
Generate-Icon -Size 128 -OutputPath (Join-Path $AssetsDir "icon128.png")

# Step 4: Generate placeholder icons if .NET Drawing failed
Write-Host "[4/4] Verifying assets..." -ForegroundColor Yellow
$allIconsExist = (Test-Path (Join-Path $AssetsDir "icon16.png")) -and
                (Test-Path (Join-Path $AssetsDir "icon48.png")) -and
                (Test-Path (Join-Path $AssetsDir "icon128.png"))

if (-not $allIconsExist) {
    Write-Host "  Some icons could not be generated. Creating minimal placeholders..." -ForegroundColor Yellow
    Write-Host "  You can use any 16x16, 48x48, and 128x128 PNG icons." -ForegroundColor Yellow
    Write-Host "  Place them in: $AssetsDir" -ForegroundColor Yellow

    @("icon16.png", "icon48.png", "icon128.png") | ForEach-Object {
        $path = Join-Path $AssetsDir $_
        if (-not (Test-Path $path)) {
            # Create a minimal 1x1 transparent PNG
            $header = [byte[]]@(
                0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
                0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
                0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
                0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41,
                0x54, 0x08, 0xD7, 0x63, 0x60, 0x60, 0x60, 0x00,
                0x00, 0x00, 0x04, 0x00, 0x01, 0x27, 0x34, 0x27,
                0x0A, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E,
                0x44, 0xAE, 0x42, 0x60, 0x82
            )
            [System.IO.File]::WriteAllBytes($path, $header)
            Write-Host "  Created placeholder: $_" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. Open Chrome and go to chrome://extensions/" -ForegroundColor White
Write-Host "  2. Enable 'Developer mode' (toggle in top-right)" -ForegroundColor White
Write-Host "  3. Click 'Load unpacked' and select the 'extension' folder" -ForegroundColor White
Write-Host "  4. Pin the extension to your toolbar" -ForegroundColor White
Write-Host "  5. Click the extension icon and open Settings to select your Excel file" -ForegroundColor White
Write-Host ""
Write-Host "If icons are blank, replace files in assets/ with real PNG icons." -ForegroundColor Yellow
