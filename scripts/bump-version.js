import { execSync } from 'node:child_process';
import fs from 'node:fs';

const prevVersion = process.argv[2];
const newVersion = process.argv[3];

if (!newVersion) {
  console.error('Usage: node scripts/bump-version.js <prev_version> <new_version>');
  process.exit(1);
}

const repo = process.env.GITHUB_REPOSITORY || 'Autapomorph/winsleep';

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
  const tauriConf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
  tauriConf.version = newVersion;
  fs.writeFileSync(tauriConfPath, `${JSON.stringify(tauriConf, null, 2)}\n`, 'utf8');
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

// 5. latest.json
const latestJsonPath = 'latest.json';
if (fs.existsSync(latestJsonPath)) {
  const latestJson = JSON.parse(fs.readFileSync(latestJsonPath, 'utf8'));
  latestJson.version = newVersion;

  const defaultX64Url = `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_x64-setup.exe`;
  const defaultArm64Url = `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_arm64-setup.exe`;

  if (latestJson.platforms && latestJson.platforms['windows-x86_64']) {
    if (prevVersion && prevVersion !== 'null') {
      latestJson.platforms['windows-x86_64'].url = latestJson.platforms['windows-x86_64'].url
        .split(prevVersion)
        .join(newVersion)
        .replace(/ /g, '.');
    } else {
      latestJson.platforms['windows-x86_64'].url = defaultX64Url;
    }
  }

  if (latestJson.platforms && latestJson.platforms['windows-aarch64']) {
    if (prevVersion && prevVersion !== 'null') {
      latestJson.platforms['windows-aarch64'].url = latestJson.platforms['windows-aarch64'].url
        .split(prevVersion)
        .join(newVersion)
        .replace(/ /g, '.');
    } else {
      latestJson.platforms['windows-aarch64'].url = defaultArm64Url;
    }
  }

  fs.writeFileSync(latestJsonPath, `${JSON.stringify(latestJson, null, 2)}\n`, 'utf8');
  console.log('✓ Updated latest.json');
}

console.log(`Version bump to ${newVersion} completed successfully.`);
