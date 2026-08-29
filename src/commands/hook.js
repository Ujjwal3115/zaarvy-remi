import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { getProjectNameFromGit } from '../utils/git.js';

export async function hookCommand() {
  try {
    const gitPath = path.join(process.cwd(), '.git');
    
    try {
      const stat = await fs.stat(gitPath);
      if (!stat.isDirectory()) throw new Error();
    } catch {
      console.error(chalk.red('[Error] Not a git repository (or no .git directory found). Please run this in the root of a git project.'));
      process.exit(1);
    }

    const hookDir = path.join(gitPath, 'hooks');
    try {
      await fs.mkdir(hookDir, { recursive: true });
    } catch(e) {}

    const hookPath = path.join(hookDir, 'post-commit');
    const repoName = getProjectNameFromGit();
    
    // The bash script that will run after a commit
    const hookContent = `#!/bin/sh
# REMI Auto-Logger Git Hook
# Automatically logs your commit messages to your local graph

COMMIT_MSG=$(git log -1 --pretty=%B)

# Extract just the first line (subject)
SUBJECT=$(echo "$COMMIT_MSG" | head -n 1)

echo "Logging to REMI..."
zaarvy-remi log -p "${repoName}" -m "Committed: $SUBJECT" -t "git"
`;

    // 0o755 makes the script executable
    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
    
    console.log(chalk.green(`[*] Git post-commit hook successfully installed!`));
    console.log(chalk.gray(`Whenever you commit in this repo, it will automatically log to project "${repoName}" in REMI.`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
