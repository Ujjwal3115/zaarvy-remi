import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import { fetchExportLogs } from '../db/client.js';

export async function exportCommand(projectName) {
  try {
    if (!projectName) {
      console.error(chalk.red('[Error] Please specify a project name using -p <name>'));
      process.exit(1);
    }

    const data = await fetchExportLogs(projectName);
    if (!data || !data.project) {
      console.error(chalk.red(`[Error] Project "${projectName}" not found.`));
      process.exit(1);
    }

    const { project, logs } = data;
    
    let markdown = `# Work Log Export: ${projectName}\n\n`;
    for (const log of logs) {
      const dateStr = log.created_at ? log.created_at.slice(0, 10) : 'Unknown Date';
      markdown += `- **[${dateStr}]** ${log.action_summary} *(Tags: ${log.tags || 'None'})*\n`;
    }

    const outputPath = path.join(process.cwd(), `${projectName.replace(/[^a-z0-9]/gi, '_')}_export.md`);
    await fs.writeFile(outputPath, markdown);

    console.log(chalk.green(`[*] Exported ${logs.length} logs to ${outputPath}`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
