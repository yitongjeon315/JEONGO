$ErrorActionPreference = 'Stop'

$hostsPath = Join-Path ([Environment]::GetFolderPath('System')) 'drivers\etc\hosts'
$backupPattern = 'hosts.jeongo.*.bak'
$currentHosts = Get-Item -LiteralPath $hostsPath

if ($currentHosts.Length -gt 0) {
    $backupPath = $hostsPath + '.jeongo.' + (Get-Date -Format 'yyyyMMddHHmmss') + '.bak'
    Copy-Item -LiteralPath $hostsPath -Destination $backupPath
    $sourcePath = $hostsPath
} else {
    $sourcePath = Get-ChildItem -LiteralPath (Split-Path $hostsPath) -Filter $backupPattern |
        Where-Object Length -gt 0 |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1 -ExpandProperty FullName

    if (-not $sourcePath) {
        throw 'No valid hosts backup was found.'
    }
}

$sourceLines = @(Get-Content -LiteralPath $sourcePath)
$filteredLines = $sourceLines | Where-Object {
    $_ -notmatch '^\s*(127\.0\.0\.1|192\.168\.219\.102)\s+.*\b(aina365\.com|www\.aina365\.com)\b'
}

$candidatePath = Join-Path $env:TEMP 'jeongo-hosts-candidate'
$candidateLines = @($filteredLines) + @('127.0.0.1 aina365.com www.aina365.com')
Set-Content -LiteralPath $candidatePath -Value $candidateLines -Encoding ASCII

if (-not (Select-String -LiteralPath $candidatePath -Pattern '^127\.0\.0\.1 aina365\.com www\.aina365\.com$' -Quiet)) {
    throw 'The hosts candidate file did not pass validation.'
}

Copy-Item -LiteralPath $candidatePath -Destination $hostsPath -Force
Remove-Item -LiteralPath $candidatePath -Force

Clear-DnsClientCache
Write-Output "Source: $sourcePath"
