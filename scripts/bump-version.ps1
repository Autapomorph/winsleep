param(
  [Parameter(Mandatory=$true)]
  [string]$NewVersion
)

$ErrorActionPreference = "Stop"

Write-Host "Updating version to: $NewVersion"

# 1. Update package.json & package-lock.json via npm
npm version $NewVersion --no-git-tag-version --allow-same-version
Write-Host "✓ Updated package.json and package-lock.json"

# 3. Update src-tauri/tauri.conf.json
$tauriConfPath = "src-tauri/tauri.conf.json"
if (Test-Path $tauriConfPath) {
  $tauriConf = Get-Content $tauriConfPath -Raw
  $tauriConf = $tauriConf -replace '(?ms)(^  "version": ")[^"]+(")', ('${1}' + $NewVersion + '${2}')
  Set-Content -Path $tauriConfPath -Value $tauriConf -NoNewline
  Write-Host "✓ Updated tauri.conf.json"
}

# 4. Update src-tauri/Cargo.toml
$cargoTomlPath = "src-tauri/Cargo.toml"
if (Test-Path $cargoTomlPath) {
  $cargoToml = Get-Content $cargoTomlPath -Raw
  $cargoToml = $cargoToml -replace '(?ms)(^\[package\].*?^version\s*=\s*")[^"]+(")', ('${1}' + $NewVersion + '${2}')
  Set-Content -Path $cargoTomlPath -Value $cargoToml -NoNewline
  Write-Host "✓ Updated Cargo.toml"
}

# 5. Update src-tauri/Cargo.lock
$cargoLockPath = "src-tauri/Cargo.lock"
if (Test-Path $cargoLockPath) {
  $cargoLock = Get-Content $cargoLockPath -Raw
  $cargoLock = $cargoLock -replace '(?ms)(^\[\[package\]\]\r?\nname = "winsleep"\r?\nversion = ")[^"]+(")', ('${1}' + $NewVersion + '${2}')
  Set-Content -Path $cargoLockPath -Value $cargoLock -NoNewline
  Write-Host "✓ Updated Cargo.lock"
}

Write-Host "Version bump to $NewVersion completed successfully."
