param([string]$InstallDirectory = (Join-Path ([IO.Path]::GetTempPath()) ('wassis-gitleaks-' + [Guid]::NewGuid())))

$ErrorActionPreference = 'Stop'
$version = '8.30.1'
if ([Runtime.InteropServices.RuntimeInformation]::OSArchitecture -ne [Runtime.InteropServices.Architecture]::X64) {
    throw 'This pinned installer supports x64 Windows and Linux only.'
}
if ($IsWindows) {
    $asset = "gitleaks_${version}_windows_x64.zip"
    $expectedHash = 'd29144deff3a68aa93ced33dddf84b7fdc26070add4aa0f4513094c8332afc4e'
    $binary = 'gitleaks.exe'
} elseif ($IsLinux) {
    $asset = "gitleaks_${version}_linux_x64.tar.gz"
    $expectedHash = '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb'
    $binary = 'gitleaks'
} else {
    throw 'This pinned installer supports x64 Windows and Linux only.'
}

$null = New-Item -ItemType Directory -Path $InstallDirectory -Force
$archive = Join-Path $InstallDirectory $asset
Invoke-WebRequest -Uri "https://github.com/gitleaks/gitleaks/releases/download/v$version/$asset" -OutFile $archive
if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash -ne $expectedHash) {
    throw 'Gitleaks archive checksum mismatch. No binary was executed.'
}
if ($IsWindows) {
    Expand-Archive -LiteralPath $archive -DestinationPath $InstallDirectory -Force
} else {
    & tar -xzf $archive -C $InstallDirectory $binary
    if ($LASTEXITCODE -ne 0) { throw 'Could not extract Gitleaks.' }
}
$executable = Join-Path $InstallDirectory $binary
if (-not (Test-Path -LiteralPath $executable -PathType Leaf)) { throw 'Gitleaks binary missing.' }
return $executable
