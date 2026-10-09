param([Parameter(Mandatory)][string]$GitleaksPath)
$ErrorActionPreference = 'Stop'
$scanner = (Resolve-Path -LiteralPath $GitleaksPath).Path
$hooks = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '../.githooks')).Path
$tempRoot = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd([IO.Path]::DirectorySeparatorChar)
$testRepo = Join-Path $tempRoot ('wassis-hook-test-' + [Guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Path $testRepo
$oldPath = $env:PATH
$env:PATH = (Split-Path $scanner) + [IO.Path]::PathSeparator + $env:PATH
try {
    & git -C $testRepo init --quiet
    if ($LASTEXITCODE -ne 0) { throw 'Could not initialize hook test repository.' }
    # Inert, randomly generated scanner fixture. Never printed or sent to a provider.
    $synthetic = 'ghp_' + [Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(18))
    $fixture = Join-Path $testRepo 'fixture.txt'
    [IO.File]::WriteAllText($fixture, 'credential=' + $synthetic)
    & git -C $testRepo add fixture.txt
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage hook fixture.' }
    $report = Join-Path $testRepo 'report.json'
    $scanLog = Join-Path $testRepo 'scan.log'
    & $scanner git --pre-commit --staged --redact=100 --no-banner --report-path $report $testRepo *> $scanLog
    if ($LASTEXITCODE -ne 1) { throw 'Staged synthetic credential was not rejected by Gitleaks.' }
    $findings = @(Get-Content -LiteralPath $report -Raw | ConvertFrom-Json)
    if ($findings.Count -ne 1 -or $findings[0].RuleID -ne 'github-pat' -or $findings[0].File -ne 'fixture.txt') {
        throw 'Unexpected staged scan category or location.'
    }
    if ((Get-Content -LiteralPath $scanLog -Raw).Contains($synthetic) -or
        (Get-Content -LiteralPath $report -Raw).Contains($synthetic)) {
        throw 'Scanner did not fully redact the synthetic fixture.'
    }
    $hookLog = Join-Path $testRepo 'hook.log'
    & git -C $testRepo -c 'user.name=Security fixture' -c 'user.email=fixture@example.invalid' -c "core.hooksPath=$hooks" commit -m 'synthetic hook regression' *> $hookLog
    if ($LASTEXITCODE -eq 0 -or (Get-Content -LiteralPath $hookLog -Raw) -notmatch 'leaks found') {
        throw 'Actual pre-commit hook did not block the staged fixture.'
    }
    [IO.File]::WriteAllText($fixture, 'benign fixture')
    & git -C $testRepo add fixture.txt
    if ($LASTEXITCODE -ne 0) { throw 'Could not stage clean fixture.' }
    & git -C $testRepo -c 'user.name=Security fixture' -c 'user.email=fixture@example.invalid' -c "core.hooksPath=$hooks" commit -m 'clean hook regression' *> $hookLog
    if ($LASTEXITCODE -ne 0) { throw 'Actual pre-commit hook rejected a clean commit.' }
    Write-Output 'Secret hook passed: staged synthetic github-pat in fixture.txt blocked; clean commit allowed; output fully redacted.'
} finally {
    $env:PATH = $oldPath
    $resolved = [IO.Path]::GetFullPath($testRepo)
    if ($resolved -ne $testRepo -or !$resolved.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Refusing to remove a test path outside the temporary directory.'
    }
    Remove-Item -LiteralPath $resolved -Recurse -Force
}
