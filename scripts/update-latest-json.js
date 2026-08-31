import fs from 'node:fs';
import path from 'node:path';

const repo = process.env.GITHUB_REPOSITORY || 'Autapomorph/winsleep';
const newVersion = process.env.NEW_VERSION;
const isMajor = process.env.IS_MAJOR === 'true';

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

const latestJsonPath = path.resolve('latest.json');
const bundlesDir = path.resolve('release-bundles');

const x64SigPath = path.join(bundlesDir, `WinSleep_${newVersion}_x64-setup.exe.sig`);
const arm64SigPath = path.join(bundlesDir, `WinSleep_${newVersion}_arm64-setup.exe.sig`);

if (!fs.existsSync(x64SigPath)) {
  console.error(`Error: Signature file not found at ${x64SigPath}`);
  process.exit(1);
}

if (!fs.existsSync(arm64SigPath)) {
  console.error(`Error: Signature file not found at ${arm64SigPath}`);
  process.exit(1);
}

const x64Sig = fs.readFileSync(x64SigPath, 'utf-8').trim();
const arm64Sig = fs.readFileSync(arm64SigPath, 'utf-8').trim();

let latestJson = {
  version: newVersion,
  major: isMajor,
  platforms: {},
};

if (fs.existsSync(latestJsonPath)) {
  try {
    latestJson = JSON.parse(fs.readFileSync(latestJsonPath, 'utf-8'));
  } catch {
    console.warn('Could not parse existing latest.json, creating a new structure.');
  }
}

latestJson.version = newVersion;
latestJson.major = isMajor;
latestJson.platforms = latestJson.platforms || {};

latestJson.platforms['windows-x86_64'] = {
  url: `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_x64-setup.exe`,
  signature: x64Sig,
};

latestJson.platforms['windows-aarch64'] = {
  url: `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_arm64-setup.exe`,
  signature: arm64Sig,
};

fs.writeFileSync(latestJsonPath, `${JSON.stringify(latestJson, null, 2)}\n`);
console.log(`✓ Successfully updated latest.json for version ${newVersion}`);
