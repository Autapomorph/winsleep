const { execSync } = require('child_process');

const isClaude =
  process.argv.includes('--claude') ||
  process.argv.includes('--agent=claude') ||
  Boolean(process.env.CLAUDE_CODE || process.env.CLAUDE_PROJECT_DIR);

function runCommand(cmd) {
  try {
    return { ok: true, output: execSync(cmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) };
  } catch (err) {
    const errorOutput = (err.stdout || '') + '\n' + (err.stderr || '') + '\n' + err.message;
    return { ok: false, output: errorOutput.trim() };
  }
}

try {
  const statusOutput = execSync('git status --porcelain', { encoding: 'utf8' });

  const files = statusOutput
    .split('\n')
    .map(line => {
      const clean = line.trim();
      if (!clean) {
        return null;
      }

      const rawPath = clean.slice(3).trim();
      return rawPath.includes(' -> ') ? rawPath.split(' -> ')[1] : rawPath;
    })
    .filter(Boolean);

  let hasFrontendChanges = false;
  let hasRustChanges = false;

  for (const file of files) {
    if (/\.(js|jsx|ts|tsx|json|css|html)$/.test(file)) {
      hasFrontendChanges = true;
    }

    if (/\.rs$/.test(file) || file.includes('src-tauri/')) {
      hasRustChanges = true;
    }
  }

  const failures = [];

  if (hasFrontendChanges) {
    const fmt = runCommand('npm run format');
    if (!fmt.ok) {
      failures.push(`Format check failed:\n${fmt.output}`);
    }

    const tc = runCommand('npm run typecheck');
    if (!tc.ok) {
      failures.push(`Typecheck failed:\n${tc.output}`);
    }

    const lint = runCommand('npm run lint');
    if (!lint.ok) {
      failures.push(`Lint failed:\n${lint.output}`);
    }
  }

  if (hasRustChanges) {
    const cargo = runCommand('cargo check --manifest-path src-tauri/Cargo.toml');
    if (!cargo.ok) {
      failures.push(`Cargo check failed:\n${cargo.output}`);
    }
  }

  if (failures.length > 0) {
    const errorMsg = `Pre-completion verification checks failed. Please fix the following issues before finishing:\n\n${failures.join('\n\n')}`;

    if (isClaude) {
      console.error(errorMsg);
      process.exit(1);
    } else {
      process.stdout.write(
        JSON.stringify({
          decision: 'continue',
          reason: errorMsg
        })
      );
      process.exit(0);
    }
  } else {
    process.stdout.write(
      JSON.stringify({
        decision: 'approve'
      })
    );
    process.exit(0);
  }
} catch (err) {
  const errorMsg = `Verification hook script encountered an unexpected error: ${err.message}`;
  
  if (isClaude) {
    console.error(errorMsg);
    process.exit(1);
  } else {
    process.stdout.write(
      JSON.stringify({
        decision: 'continue',
        reason: errorMsg
      })
    );
    process.exit(0);
  }
}