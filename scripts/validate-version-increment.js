import semver from 'semver';

import { setOutput } from './helpers.js';

const prevVersionRaw = process.env.PREVIOUS_VERSION;
const prevVersion = prevVersionRaw ? prevVersionRaw.replace(/^v/, '').trim() : '';
const newVersionRaw = process.env.NEW_VERSION;
const newVersion = newVersionRaw ? newVersionRaw.replace(/^v/, '').trim() : '';
const isForceVersion = process.env.FORCE_VERSION === 'true';
const isFirstRelease = !prevVersionRaw || prevVersionRaw === 'null' || !prevVersion;

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

const parsedNew = semver.parse(newVersion);
if (!parsedNew) {
  console.error(`❌ Invalid SemVer version format: "${newVersion}"`);
  process.exit(1);
}

const isPrerelease = Boolean(parsedNew.prerelease && parsedNew.prerelease.length > 0);

setOutput('is_prerelease', isPrerelease);

if (isFirstRelease) {
  console.log(
    `ℹ️ No previous releases found. Proceeding with ${newVersion} as the initial release (is_prerelease: ${isPrerelease}).`,
  );
  process.exit(0);
}

const parsedPrev = semver.parse(prevVersion);
if (!parsedPrev) {
  console.warn(
    `⚠️ Warning: Previous version "${prevVersion}" is not valid SemVer. Skipping increment check.`,
  );
  process.exit(0);
}

if (!semver.gt(parsedNew, parsedPrev)) {
  if (!isForceVersion) {
    console.error(
      `❌ Invalid version increment!\n` +
        `New version ${newVersion} must be strictly greater than previous version ${prevVersion} according to SemVer 2.0.`,
    );
    process.exit(1);
  } else {
    console.log(
      `⚠️ Force version enabled: proceeding despite ${newVersion} not being greater than ${prevVersion}`,
    );
    process.exit(0);
  }
}

// Check valid increment stepping
const prevBase = `${parsedPrev.major}.${parsedPrev.minor}.${parsedPrev.patch}`;
const newBase = `${parsedNew.major}.${parsedNew.minor}.${parsedNew.patch}`;

const isValidStep = (() => {
  // Case 1: Graduating from pre-release to stable or incrementing pre-release of the same base version
  // Example: 1.3.2-beta.1 -> 1.3.2-beta.2 OR 1.3.2-beta.1 -> 1.3.2
  if (newBase === prevBase) {
    return true;
  }

  // Case 2: Incrementing patch (e.g. 1.3.1 -> 1.3.2 or 1.3.2-beta.1)
  if (
    parsedNew.major === parsedPrev.major &&
    parsedNew.minor === parsedPrev.minor &&
    parsedNew.patch === parsedPrev.patch + 1
  ) {
    return true;
  }

  // Case 3: Incrementing minor (e.g. 1.3.1 -> 1.4.0 or 1.4.0-beta.1)
  if (
    parsedNew.major === parsedPrev.major &&
    parsedNew.minor === parsedPrev.minor + 1 &&
    parsedNew.patch === 0
  ) {
    return true;
  }

  // Case 4: Incrementing major (e.g. 1.3.1 -> 2.0.0 or 2.0.0-beta.1)
  if (parsedNew.major === parsedPrev.major + 1 && parsedNew.minor === 0 && parsedNew.patch === 0) {
    return true;
  }

  return false;
})();

if (!isForceVersion && !isValidStep) {
  console.error(
    `❌ Invalid version increment stepping!\n\n` +
      `Current: ${prevVersion}\n` +
      `Attempted: ${newVersion}\n\n` +
      `Valid increments from ${prevVersion}:\n` +
      `  • Same base (if current is pre-release): ${prevBase} or newer pre-release\n` +
      `  • Patch: ${parsedPrev.major}.${parsedPrev.minor}.${parsedPrev.patch + 1} (or pre-release)\n` +
      `  • Minor: ${parsedPrev.major}.${parsedPrev.minor + 1}.0 (or pre-release)\n` +
      `  • Major: ${parsedPrev.major + 1}.0.0 (or pre-release)`,
  );
  process.exit(1);
}

if (isForceVersion) {
  console.log(
    `⚠️ Force version enabled: skipping step validation (${prevVersion} → ${newVersion})`,
  );
} else {
  console.log(
    `✅ Valid version increment: ${prevVersion} → ${newVersion} (is_prerelease: ${isPrerelease})`,
  );
}
