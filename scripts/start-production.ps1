$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'logs'
$caddyPath = Join-Path $projectRoot 'tools\caddy.exe'
$caddyConfig = Join-Path $projectRoot 'Caddyfile'

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

$port3000Open = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $port3000Open) {
    Start-Process -FilePath 'npm.cmd' `
        -ArgumentList @('run', 'start', '--', '-H', '0.0.0.0', '-p', '3000') `
        -WorkingDirectory $projectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'next.stdout.log') `
        -RedirectStandardError (Join-Path $logDirectory 'next.stderr.log')

    Start-Sleep -Seconds 3
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $caddyPath reload --config $caddyConfig --adapter caddyfile *> $null
$caddyExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

if ($caddyExitCode -ne 0) {
    & $caddyPath start --config $caddyConfig --adapter caddyfile *> $null
    if ($LASTEXITCODE -ne 0) {
        throw "Caddy failed to start (exit code $LASTEXITCODE)."
    }

    # On Windows, reload once after startup so persisted ACME certificates are
    # attached before the first browser TLS handshake.
    Start-Sleep -Seconds 3
    $ErrorActionPreference = 'Continue'
    & $caddyPath reload --config $caddyConfig --adapter caddyfile *> $null
    $caddyReloadExitCode = $LASTEXITCODE
    $ErrorActionPreference = $previousErrorActionPreference
    if ($caddyReloadExitCode -ne 0) {
        throw "Caddy failed to load certificates (exit code $caddyReloadExitCode)."
    }
}
