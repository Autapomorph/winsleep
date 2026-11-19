import { config } from './env';

export const GITHUB_REPO_ID = 'Autapomorph/winsleep';
export const GITHUB_REPO_URL = `https://github.com/${GITHUB_REPO_ID}`;
export const GITHUB_API_REPO_URL = `https://api.github.com/repos/${GITHUB_REPO_ID}`;

export const RELEASES_PAGE_URL = `${GITHUB_REPO_URL}/releases`;

export const GATEWAY_URL = config.GATEWAY_URL ?? undefined;
export const GATEWAY_RELEASE_NOTES_URL = GATEWAY_URL
  ? `${GATEWAY_URL}/api/v1/release-notes`
  : undefined;
