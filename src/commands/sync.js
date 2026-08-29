import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { logWork } from '../db/client.js';
import { getProjectNameFromGit, extractTechStackFromCommit } from '../utils/git.js';

export async function syncCommand(options) {
  try {
    const gitPath = path.join(process.cwd(), '.git');
    try {
      const stat = await fs.stat(gitPath);
      if (!stat.isDirectory()) throw new Error();
    } catch {
      console.error(chalk.red('[Error] Not a git repository. Please run this command inside the root of a git project.'));
      process.exit(1);
    }

    const repoName = getProjectNameFromGit();
    const limit = options.limit ? parseInt(options.limit, 10) : 50;

    console.log(chalk.blue(`Reading past ${limit} git commits for project "${repoName}"...`));

    // Format: hash|author|date|subject
    const gitLogRaw = execSync(`git log -n ${limit} --pretty=format:"%h|%an|%cd|%s" --date=iso`, { encoding: 'utf8' });

    if (!gitLogRaw.trim()) {
      console.log(chalk.yellow('No commit history found in this repository.'));
      return;
    }

    const lines = gitLogRaw.trim().split('\n');
    let importedCount = 0;

    for (const line of lines) {
      const parts = line.split('|');
      if (parts.length < 4) continue;
      
      const hash = parts[0];
      const author = parts[1];
      const dateStr = parts[2];
      const subject = parts.slice(3).join('|');

      const actionSummary = `[Git ${hash}] ${subject}`;
      const techTags = extractTechStackFromCommit(subject);
      
      // Store author as a tag prefixed with @ (e.g. "@Ujjwal3115")
      const allTags = [...techTags, `@${author}`];

      let createdAt;
      try {
        createdAt = new Date(dateStr).toISOString().replace('T', ' ').slice(0, 19);
      } catch (e) {
        createdAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
      }

      await logWork({
        project: repoName,
        action: actionSummary,
        tags: allTags,
        createdAt: createdAt
      });

      importedCount++;
    }

    console.log(chalk.green(`\n[*] Imported ${importedCount} past commits to project "${repoName}" in REMI!\n`));
    console.log(chalk.gray(`Run "zaarvy-remi graph" to view your updated work graph.`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
