const rawPrev = process.env.PREVIOUS_VERSION;
const prevVersion = rawPrev ? rawPrev.replace(/^v/, '') : '';
const isFirstRelease = !rawPrev || rawPrev === 'null';
const newVersion = process.env.NEW_VERSION;
const forceVersion = process.env.FORCE_VERSION === 'true';

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

if (isFirstRelease) {
  console.log(
    `ℹ️ No previous releases found. Proceeding with ${newVersion} as the initial release.`,
  );
  process.exit(0);
}

const [prevMajor, prevMinor, prevPatch] = prevVersion.split('.').map(Number);
const [newMajor, newMinor, newPatch] = newVersion.split('.').map(Number);

// Check if it's a valid increment
const isMajor = newMajor > prevMajor && newMinor === 0 && newPatch === 0;
const isMinor = newMajor === prevMajor && newMinor > prevMinor && newPatch === 0;
const isPatch = newMajor === prevMajor && newMinor === prevMinor && newPatch === prevPatch + 1;

if (!forceVersion && !isMajor && !isMinor && !isPatch) {
  const validOptions = [
    `${prevMajor}.${prevMinor}.${prevPatch + 1} (patch)`,
    `${prevMajor}.${prevMinor + 1}.0 (minor)`,
    `${prevMajor + 1}.0.0 (major)`,
  ];

  console.error(
    `❌ Invalid version increment!\n\n` +
      `Current: ${prevVersion}\n` +
      `Attempted: ${newVersion}\n\n` +
      `Valid options:\n${validOptions.map(v => `  • ${v}`).join('\n')}`,
  );
  process.exit(1);
}

if (forceVersion) {
  console.log('⚠️ Force version enabled: skipping increment validation');
} else {
  console.log(`✅ Valid version increment: ${prevVersion} → ${newVersion}`);
}
