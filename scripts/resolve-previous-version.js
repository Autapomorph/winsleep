import semver from 'semver';

import { fetchAllReleases, setOutput } from './helpers.js';

const newVersion = process.env.NEW_VERSION;

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

function resolvePreviousVersion(releases, version) {
  const cleanTarget = version.replace(/^v/, '').trim();
  const target = semver.parse(cleanTarget);

  if (!target) {
    return null;
  }

  const isTargetPrerelease = Boolean(target.prerelease && target.prerelease.length > 0);
  const targetBase = `${target.major}.${target.minor}.${target.patch}`;

  // Parse and sort published releases descending by semver
  const validReleases = (releases || [])
    .filter(r => !r.draft && r.tag_name)
    .map(r => ({
      tag: r.tag_name,
      sem: semver.parse(r.tag_name.replace(/^v/, '').trim()),
    }))
    .filter(r => r.sem !== null)
    .sort((a, b) => semver.rcompare(a.sem, b.sem));

  if (isTargetPrerelease) {
    // 1. Look for previous pre-release of the same base version (e.g. 1.4.0-beta.1 for 1.4.0-beta.2)
    const prevPrerelease = validReleases.find(r => {
      const base = `${r.sem.major}.${r.sem.minor}.${r.sem.patch}`;
      return r.sem.prerelease.length > 0 && base === targetBase && semver.lt(r.sem, target);
    });

    if (prevPrerelease) {
      return prevPrerelease.tag;
    }
  }

  // 2. Look for highest stable release < target (e.g. 1.3.1 for 1.4.0 or first beta 1.4.0-beta.1)
  const prevStable = validReleases.find(r => {
    return r.sem.prerelease.length === 0 && semver.lt(r.sem, target);
  });

  return prevStable ? prevStable.tag : null;
}

try {
  const releases = await fetchAllReleases();
  const previousVersion = resolvePreviousVersion(releases, newVersion) || '';

  console.log(`Resolved previous version for ${newVersion}: "${previousVersion}"`);

  setOutput('previous_version', previousVersion);
} catch (error) {
  console.error('Failed to resolve previous version:', error);
  process.exit(1);
}
