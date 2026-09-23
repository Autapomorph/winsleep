import { randomUUID } from 'node:crypto';
import fs from 'node:fs';

/**
 * Sets an output parameter for GitHub Actions workflow steps.
 * Safely writes to the $GITHUB_OUTPUT file if running inside GitHub Actions.
 *
 * @param {string} name - Output parameter name
 * @param {string | number | boolean} value - Output parameter value
 */
export function setOutput(name, value) {
  if (!process.env.GITHUB_OUTPUT) {
    return;
  }

  const strValue = String(value ?? '');
  let content = `${name}=${strValue}\n`;

  if (strValue.includes('\n')) {
    const delimiter = `ghadelimiter_${randomUUID()}`;
    content = `${name}<<${delimiter}\n${strValue}\n${delimiter}\n`;
  }

  fs.appendFileSync(process.env.GITHUB_OUTPUT, content);
}

/**
 * Fetches all releases for a repository from GitHub REST API, handling pagination.
 *
 * @param {object} [options]
 * @param {string} [options.repo] - Full repository name (owner/repo). Defaults to GITHUB_REPOSITORY env or 'Autapomorph/winsleep'.
 * @param {string} [options.token] - GitHub access token. Defaults to GITHUB_TOKEN env.
 * @returns {Promise<Array<object>>}
 */
export async function fetchAllReleases(options = {}) {
  const repo = options.repo || process.env.GITHUB_REPOSITORY || 'Autapomorph/winsleep';
  const token = options.token || process.env.GITHUB_TOKEN;
  const allReleases = [];
  let page = 1;
  const perPage = 100;

  /* eslint-disable no-await-in-loop */
  while (true) {
    const response = await fetch(
      `https://api.github.com/repos/${repo}/releases?per_page=${perPage}&page=${page}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'X-GitHub-Api-Version': '2026-03-10',
          'User-Agent': 'node-script',
        },
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch releases: HTTP ${response.status} - ${errorText}`);
    }

    const releases = await response.json();
    if (!Array.isArray(releases) || releases.length === 0) {
      break;
    }

    allReleases.push(...releases);

    if (releases.length < perPage) {
      break;
    }

    page += 1;
  }
  /* eslint-enable no-await-in-loop */

  return allReleases;
}
