import fs from 'node:fs';
import path from 'node:path';

import semver from 'semver';

const repo = process.env.GITHUB_REPOSITORY || 'Autapomorph/winsleep';
const newVersion = process.env.NEW_VERSION;
const isMajor = process.env.IS_MAJOR === 'true';
const isPrerelease =
  process.env.IS_PRERELEASE === 'true' ||
  (newVersion ? Boolean(semver.prerelease(newVersion)) : false);

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

const bundlesDir = path.resolve('release-bundles');

const x64SigPath = path.join(bundlesDir, `WinSleep_${newVersion}_x64-setup.exe.sig`);
const arm64SigPath = path.join(bundlesDir, `WinSleep_${newVersion}_arm64-setup.exe.sig`);

if (!fs.existsSync(x64SigPath)) {
  const existingFiles = fs.existsSync(bundlesDir) ? fs.readdirSync(bundlesDir) : [];
  console.error(
    `Error: Signature file not found at ${x64SigPath}. Available files in ${bundlesDir}: ${existingFiles.join(', ')}`,
  );
  process.exit(1);
}

if (!fs.existsSync(arm64SigPath)) {
  const existingFiles = fs.existsSync(bundlesDir) ? fs.readdirSync(bundlesDir) : [];
  console.error(
    `Error: Signature file not found at ${arm64SigPath}. Available files in ${bundlesDir}: ${existingFiles.join(', ')}`,
  );
  process.exit(1);
}

const x64Sig = fs.readFileSync(x64SigPath, 'utf-8').trim();
const arm64Sig = fs.readFileSync(arm64SigPath, 'utf-8').trim();

const platforms = {
  'windows-x86_64': {
    url: `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_x64-setup.exe`,
    signature: x64Sig,
  },
  'windows-aarch64': {
    url: `https://github.com/${repo}/releases/download/${newVersion}/WinSleep_${newVersion}_arm64-setup.exe`,
    signature: arm64Sig,
  },
};

function updateManifest(filename) {
  const filePath = path.resolve(filename);
  let manifest = {
    version: newVersion,
    major: isMajor,
    platforms: {},
  };

  if (fs.existsSync(filePath)) {
    try {
      manifest = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch {
      console.warn(`Could not parse existing ${filename}, creating a new structure.`);
    }
  }

  // Prevent manifest downgrade if existing version is higher
  if (manifest.version && semver.valid(manifest.version)) {
    if (semver.lt(newVersion, manifest.version)) {
      console.log(
        `ℹ Skipping update of ${filename}: existing version ${manifest.version} is newer than ${newVersion}`,
      );
      return;
    }
  }

  manifest.version = newVersion;
  manifest.major = isMajor;
  manifest.platforms = manifest.platforms || {};
  manifest.platforms['windows-x86_64'] = platforms['windows-x86_64'];
  manifest.platforms['windows-aarch64'] = platforms['windows-aarch64'];

  fs.writeFileSync(filePath, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`✓ Successfully updated ${filename} for version ${newVersion}`);
}

// 1. latest.prerelease.json is always updated (for both stable and prerelease releases)
updateManifest('latest.prerelease.json');

// 2. latest.stable.json and latest.json are only updated on stable releases
if (isPrerelease) {
  console.log(`ℹ Skipping latest.stable.json and latest.json update for pre-release ${newVersion}`);
} else {
  updateManifest('latest.stable.json');
  updateManifest('latest.json');
}
