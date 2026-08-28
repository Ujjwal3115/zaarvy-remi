import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';
import { cleanCommitMessage } from '../utils/git.js';
import { printCommandBanner, MASCOT } from '../ui/brand.js';

export async function standupCommand(options) {
  try {
    const days = options.days ? parseInt(options.days, 10) : 1;
    const targetProject = options.project || null;

    const configPath = path.join(os.homedir(), '.remi', 'config.json');
    let config = {};
    try {
      const configData = await fs.readFile(configPath, 'utf8');
      config = JSON.parse(configData);
    } catch (e) {}

    const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
    const db = new Database(dbPath);

    // Calculate cutoff date
    const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19);

    let query = `
      SELECT work_logs.id, projects.name as project_name, work_logs.action_summary, work_logs.tags, work_logs.created_at 
      FROM work_logs 
      JOIN projects ON work_logs.project_id = projects.id
      WHERE work_logs.created_at >= ?
    `;
    const params = [cutoffDate];

    if (targetProject) {
      query += ` AND projects.name = ?`;
      params.push(targetProject);
    }

    query += ` ORDER BY work_logs.created_at DESC`;

    const logs = db.prepare(query).all(...params);

    if (logs.length === 0) {
      console.log(chalk.yellow(`\nNo work logs found for the last ${days} day(s)${targetProject ? ` in project "${targetProject}"` : ''}.`));
      console.log(chalk.gray(`Tip: Use "zaarvy-remi log" or "zaarvy-remi sync" to record work history.`));
      return;
    }

    printCommandBanner(`DAILY STANDUP REPORT (${days === 1 ? 'Last 24 Hours' : `Last ${days} Days`})`, MASCOT.standup);

    // Group logs by project
    const byProject = {};
    for (const log of logs) {
      if (!byProject[log.project_name]) byProject[log.project_name] = [];
      byProject[log.project_name].push(log);
    }

    for (const [proj, projLogs] of Object.entries(byProject)) {
      console.log(chalk.yellow.bold(`📌 Project: ${proj}`));
      console.log(chalk.gray(`   Total Accomplishments: ${projLogs.length}`));
      console.log(chalk.green(`   Done / Completed:`));

      for (const item of projLogs) {
        const cleanMsg = cleanCommitMessage(item.action_summary);
        console.log(`     • ${cleanMsg}`);
      }
      console.log('');
    }

    console.log(chalk.cyan(`🎯 Next Steps:`));
    console.log(`   • Continue feature development and testing.`);
    console.log(`   • Review open pull requests and feedback.\n`);

    console.log(chalk.red(`🛑 Blockers:`));
    console.log(`   • None reported.\n`);

    console.log(chalk.gray(`Report generated cleanly from REMI memory graph.`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
