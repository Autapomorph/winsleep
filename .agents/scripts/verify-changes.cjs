const { execSync } = require('child_process');

try {
  // Get list of changed files from git status (staged and unstaged)
  const output = execSync('git status --porcelain', { encoding: 'utf8' });
  const files = output
    .split('\n')
    .map(line => {
      const cleanLine = line.trim();

      if (!cleanLine) {
        return null;
      }

      const parts = cleanLine.split(/\s+/);

      return parts[parts.length - 1];
    })
    .filter(Boolean);

  let hasFrontendChanges = false;
  let hasRustChanges = false;

  for (const file of files) {
    if (/\.(js|jsx|ts|tsx)$/.test(file)) {
      hasFrontendChanges = true;
    }
    
    if (/\.rs$/.test(file) || file.includes('src-tauri/')) {
      hasRustChanges = true;
    }
  }

  if (hasFrontendChanges) {
    console.log('Detected JS/TS changes. Running frontend checks...');
    execSync('npm run format', { stdio: 'inherit' });
    execSync('npm run typecheck', { stdio: 'inherit' });
    execSync('npm run lint', { stdio: 'inherit' });
  } else {
    console.log('No JS/TS changes detected. Skipping frontend checks.');
  }

  if (hasRustChanges) {
    console.log('Detected Rust/Tauri changes. Running cargo check...');
    execSync('cargo check --manifest-path src-tauri/Cargo.toml', { stdio: 'inherit' });
  } else {
    console.log('No Rust changes detected. Skipping cargo check.');
  }
} catch (err) {
  console.error('Verification hook failed:', err.message);
  process.exit(1);
}
