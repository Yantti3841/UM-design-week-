$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$nodePath = (Get-Command node -ErrorAction Stop).Source
$baseUrl = 'http://127.0.0.1:4180'

function Test-LocalPage {
    try { $page = Invoke-RestMethod -Uri "$baseUrl/health" -TimeoutSec 2; return $page.ready -eq $true }
    catch { return $false }
}

& $nodePath 'scripts/build.mjs'
if ($LASTEXITCODE -ne 0) { throw 'The local UMDW build failed.' }

if (-not (Test-LocalPage)) {
    Start-Process -FilePath $nodePath -ArgumentList @('scripts/preview.mjs') -WorkingDirectory $PSScriptRoot -WindowStyle Hidden
    for ($attempt = 0; $attempt -lt 20; $attempt++) {
        if (Test-LocalPage) { break }
        Start-Sleep -Milliseconds 250
    }
    if (-not (Test-LocalPage)) { throw 'The local UMDW server did not start.' }
}

Start-Process "$baseUrl/"
Start-Process "$baseUrl/wall"
