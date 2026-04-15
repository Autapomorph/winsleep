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
    const toolName = payload.tool_name;
    const toolInput = payload.tool_input || {};
    
    const targetTools = [
      'replace_file_content', 
      'multi_replace_file_content', 
      'write_to_file',
      'EditFile',
      'WriteFile'
    ];

    if (targetTools.includes(toolName)) {
      const filePath = toolInput.TargetFile || toolInput.filePath || toolInput.path;
      if (filePath && fs.existsSync(filePath)) {
        execSync(`npx prettier --write "${filePath}"`, { stdio: 'ignore' });
      }
    }
  } catch {
    // Fail silently to avoid breaking tool execution loop
  }
});
