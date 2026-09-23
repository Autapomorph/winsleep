import { execSync } from 'node:child_process';
import fs from 'node:fs';

const prevVersion = process.argv[2];
const newVersion = process.argv[3];

if (!newVersion) {
  console.error('Usage: node scripts/bump-version.js <prev_version> <new_version>');
  process.exit(1);
}

console.log(`Bumping version from ${prevVersion || 'unknown'} to ${newVersion}`);

// 1. package.json & package-lock.json via npm
try {
  execSync(`npm version ${newVersion} --no-git-tag-version --allow-same-version`, {
    stdio: 'inherit',
  });
  console.log('✓ Updated package.json and package-lock.json');
} catch (error) {
  console.error('Failed to run npm version:', error);
  process.exit(1);
}

// 2. tauri.conf.json
const tauriConfPath = 'src-tauri/tauri.conf.json';
if (fs.existsSync(tauriConfPath)) {
  let tauriConf = fs.readFileSync(tauriConfPath, 'utf8');
  tauriConf = tauriConf.replace(/(^\s*"version"\s*:\s*")[^"]+(")/m, `$1${newVersion}$2`);
  fs.writeFileSync(tauriConfPath, tauriConf, 'utf8');
  console.log('✓ Updated tauri.conf.json');
}

// 3. Cargo.toml
const cargoTomlPath = 'src-tauri/Cargo.toml';
if (fs.existsSync(cargoTomlPath)) {
  let cargoToml = fs.readFileSync(cargoTomlPath, 'utf8');
  cargoToml = cargoToml.replace(
    /(^\[package\][\s\S]*?^version\s*=\s*")[^"]+(")/m,
    `$1${newVersion}$2`,
  );
  fs.writeFileSync(cargoTomlPath, cargoToml, 'utf8');
  console.log('✓ Updated Cargo.toml');
}

// 4. Cargo.lock
const cargoLockPath = 'src-tauri/Cargo.lock';
if (fs.existsSync(cargoLockPath)) {
  let cargoLock = fs.readFileSync(cargoLockPath, 'utf8');
  cargoLock = cargoLock.replace(
    /(^\[\[package\]\]\r?\nname = "winsleep"\r?\nversion = ")[^"]+(")/m,
    `$1${newVersion}$2`,
  );
  fs.writeFileSync(cargoLockPath, cargoLock, 'utf8');
  console.log('✓ Updated Cargo.lock');
}

console.log(`Version bump to ${newVersion} completed successfully.`);
