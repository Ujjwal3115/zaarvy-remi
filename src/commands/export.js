import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';

export async function exportCommand(projectName) {
  try {
    if (!projectName) {
      console.error(chalk.red('[Error] Please specify a project name using -p <name>'));
      process.exit(1);
    }

    const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
    const db = new Database(dbPath);

    const project = db.prepare('SELECT id FROM projects WHERE name = ?').get(projectName);
    if (!project) {
       console.error(chalk.red(`[Error] Project "${projectName}" not found.`));
       process.exit(1);
    }

    const logs = db.prepare('SELECT action_summary, tags, log_date FROM work_logs WHERE project_id = ? ORDER BY log_date DESC, created_at DESC').all(project.id);
    
    let markdown = `# Work Log Export: ${projectName}\n\n`;
    for (const log of logs) {
      markdown += `- **[${log.log_date}]** ${log.action_summary} *(Tags: ${log.tags || 'None'})*\n`;
    }

    const outputPath = path.join(process.cwd(), `${projectName.replace(/[^a-z0-9]/gi, '_')}_export.md`);
    await fs.writeFile(outputPath, markdown);

    console.log(chalk.green(`✔ Exported ${logs.length} logs to ${outputPath}`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
