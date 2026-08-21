$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$logDirectory = Join-Path $projectRoot 'logs'
$caddyPath = Join-Path $projectRoot 'tools\caddy.exe'
$caddyConfig = Join-Path $projectRoot 'Caddyfile'
$localDomainScript = Join-Path $PSScriptRoot 'set-local-domain.ps1'
$hostsPath = Join-Path ([Environment]::GetFolderPath('System')) 'drivers\etc\hosts'

New-Item -ItemType Directory -Path $logDirectory -Force | Out-Null

# Ensure the local SQLite schema exists and take a consistent backup before startup.
& npm.cmd run db:init
if ($LASTEXITCODE -ne 0) { throw "SQLite initialization failed (exit code $LASTEXITCODE)." }
& npm.cmd run db:backup
if ($LASTEXITCODE -ne 0) { throw "SQLite backup failed (exit code $LASTEXITCODE)." }

# Routers without NAT loopback cannot reach the public domain from this PC.
# Restore the local domain mapping at logon if another process removed it.
$hasLocalDomainMapping = Select-String -LiteralPath $hostsPath `
    -Pattern '^127\.0\.0\.1 aina365\.com www\.aina365\.com$' `
    -Quiet
if (-not $hasLocalDomainMapping) {
    try {
        & $localDomainScript
    }
    catch {
        Write-Warning '로컬 hosts 매핑을 갱신하지 못했습니다. 공인 DNS 연결로 운영 서버 시작을 계속합니다.'
    }
}

$port3000Open = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $port3000Open) {
    Start-Process -FilePath 'node.exe' `
        -ArgumentList @('node_modules/next/dist/bin/next', 'start', '-H', '0.0.0.0', '-p', '3000') `
        -WorkingDirectory $projectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'next.stdout.log') `
        -RedirectStandardError (Join-Path $logDirectory 'next.stderr.log')

    Start-Sleep -Seconds 3
    $port3000Open = Test-NetConnection -ComputerName 127.0.0.1 -Port 3000 -InformationLevel Quiet -WarningAction SilentlyContinue
    if (-not $port3000Open) { throw 'JEONGO failed to listen on port 3000.' }
}

$beforeJeongoRoot = Join-Path $projectRoot 'services\before-jeongo'
$port3002Open = Test-NetConnection -ComputerName 127.0.0.1 -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $port3002Open) {
    Start-Process -FilePath 'node.exe' `
        -ArgumentList @('..\..\node_modules\next\dist\bin\next', 'start', '-H', '127.0.0.1', '-p', '3002') `
        -WorkingDirectory $beforeJeongoRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'before-jeongo.stdout.log') `
        -RedirectStandardError (Join-Path $logDirectory 'before-jeongo.stderr.log')

    Start-Sleep -Seconds 3
    $port3002Open = Test-NetConnection -ComputerName 127.0.0.1 -Port 3002 -InformationLevel Quiet -WarningAction SilentlyContinue
    if (-not $port3002Open) { throw 'BEFORE JEONGO failed to listen on port 3002.' }
}

$previousErrorActionPreference = $ErrorActionPreference
$ErrorActionPreference = 'Continue'
& $caddyPath reload --config $caddyConfig --adapter caddyfile *> $null
$caddyExitCode = $LASTEXITCODE
$ErrorActionPreference = $previousErrorActionPreference

if ($caddyExitCode -ne 0) {
    Start-Process -FilePath $caddyPath `
        -ArgumentList @('run', '--config', $caddyConfig, '--adapter', 'caddyfile') `
        -WorkingDirectory $projectRoot `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $logDirectory 'caddy.stdout.log') `
        -RedirectStandardError (Join-Path $logDirectory 'caddy.stderr.log')

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
