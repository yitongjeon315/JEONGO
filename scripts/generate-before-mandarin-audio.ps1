$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$outputDirectory = Join-Path $projectRoot 'services\before-jeongo\public\audio\mandarin'
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

$clips = [ordered]@{
    'pf-2' = '爸'; 'pf-3' = '你'; 'pf-4' = '好'; 'pf-5' = '我'; 'pf-6' = '是'
    'pf-7' = '中'; 'pf-8' = '学'; 'pf-9' = '请'; 'pf-10' = '家'
    'ws-1' = '你'; 'ws-2' = '好'; 'ws-3' = '我'; 'ws-4' = '是'; 'ws-5' = '不'
    'ws-6' = '人'; 'ws-7' = '水'; 'ws-8' = '茶'; 'ws-9' = '妈妈'; 'ws-10' = '朋友'
    'ws-11' = '中国'; 'ws-12' = '学习'
    'rr-1' = '你好'; 'rr-2' = '我是'; 'rr-3' = '不是'; 'rr-4' = '谢谢'
    'rr-5' = '再见'; 'rr-6' = '中国人'; 'rr-7' = '一个人'; 'rr-8' = '很好'
}

Add-Type -AssemblyName System.Speech
$voice = New-Object System.Speech.Synthesis.SpeechSynthesizer
$mandarinVoice = $voice.GetInstalledVoices() | Where-Object {
    $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'zh-CN' -and $_.VoiceInfo.Name -eq 'Microsoft Huihui'
} | Select-Object -First 1
if (-not $mandarinVoice) { throw 'The Microsoft Huihui Simplified Chinese (zh-CN) voice is required.' }
$voice.SelectVoice($mandarinVoice.VoiceInfo.Name)
$voice.Rate = -1
$voice.Volume = 100

foreach ($clip in $clips.GetEnumerator()) {
    $path = Join-Path $outputDirectory "$($clip.Key).wav"
    try {
        $voice.SetOutputToWaveFile($path)
        $voice.Speak($clip.Value)
    }
    finally {
        $voice.SetOutputToNull()
    }
}

$voice.Dispose()
Write-Host "Generated $($clips.Count) Mandarin clips with $($mandarinVoice.VoiceInfo.Description)."
