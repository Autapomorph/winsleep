import fs from 'node:fs';

const token = process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || 'Autapomorph/winsleep';
const newVersion = process.env.NEW_VERSION;
const previousTag = process.env.PREVIOUS_VERSION;

if (!token) {
  console.error('Error: GITHUB_TOKEN environment variable is required.');
  process.exit(1);
}

if (!newVersion) {
  console.error('Error: NEW_VERSION environment variable is required.');
  process.exit(1);
}

const payload = {
  tag_name: newVersion,
};

if (previousTag && previousTag !== 'null') {
  payload.previous_tag_name = previousTag;
}

try {
  const response = await fetch(`https://api.github.com/repos/${repo}/releases/generate-notes`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'node-script',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Failed to generate release notes: HTTP ${response.status} - ${errorText}`);
    process.exit(1);
  }

  const releaseNotes = await response.json();
  const rawBody = releaseNotes.body || '';

  // Remove lines for version bumps, docs, ci, and chore(ci)
  const excludedKeywords = [
    '* chore: update changelog',
    '* chore(version): bump to',
    '* chore: push notification',
    '* chore(i18n): pull translations from crowdin',
    '* chore(ci):',
    '* ci:',
    '* docs:',
  ];

  const releaseNotesLines = rawBody.split('\n');

  const newReleaseNotesLines = releaseNotesLines.filter(line => {
    const sanitizedLine = line.trim().toLowerCase();
    return !excludedKeywords.some(keyword => sanitizedLine.includes(keyword));
  });

  const newReleaseNotesBody = newReleaseNotesLines.join('\n');

  fs.writeFileSync('./release_notes.md', newReleaseNotesBody);

  console.log('Generated release notes:');
  console.log(newReleaseNotesBody);
} catch (error) {
  console.error('Error generating release notes:', error);
  process.exit(1);
}
