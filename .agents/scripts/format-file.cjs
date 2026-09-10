const { execSync } = require('child_process');
const fs = require('fs');

let data = '';
process.stdin.on('data', chunk => {
  data += chunk;
});

process.stdin.on('end', () => {
  try {
    if (!data.trim()) {
      return;
    }

    const payload = JSON.parse(data);
    const input = payload.tool_input || payload.toolCall?.args || {};
    const filePath =
      input.file_path ||
      input.TargetFile ||
      input.filePath ||
      input.path;

    if (filePath && fs.existsSync(filePath)) {
      execSync(`npx prettier --write "${filePath}"`, { stdio: 'ignore' });
    }
  } catch {
  } finally {
    process.stdout.write(JSON.stringify({}));
  }
});