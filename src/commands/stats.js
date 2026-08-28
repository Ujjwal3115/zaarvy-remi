import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';

export async function statsCommand() {
  try {
    const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
    const db = new Database(dbPath);

    const totalLogs = db.prepare('SELECT COUNT(*) as count FROM work_logs').get().count;
    const totalProjects = db.prepare('SELECT COUNT(*) as count FROM projects').get().count;

    if (totalLogs === 0) {
      console.log(chalk.yellow('\nNo activity recorded in REMI memory yet.'));
      console.log(chalk.gray('Use "zaarvy-remi log" or "zaarvy-remi sync" to start recording stats.'));
      return;
    }

    // Get all log dates (YYYY-MM-DD)
    const logs = db.prepare(`SELECT created_at, tags FROM work_logs ORDER BY created_at DESC`).all();

    const dateCounts = {};
    const tagCounts = {};

    for (const log of logs) {
      if (!log.created_at) continue;
      const day = log.created_at.slice(0, 10); // YYYY-MM-DD
      dateCounts[day] = (dateCounts[day] || 0) + 1;

      if (log.tags) {
        const rawTags = log.tags.split(',').map(t => t.trim()).filter(Boolean);
        const clutter = new Set(['git', 'import', 'feat', 'fix', 'docs', 'style', 'test', 'chore', 'repository']);
        for (const tag of rawTags) {
          if (!clutter.has(tag.toLowerCase()) && !tag.startsWith('@')) {
            tagCounts[tag] = (tagCounts[tag] || 0) + 1;
          }
        }
      }
    }

    // Calculate Active Streak
    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    // Check today or yesterday as start of streak
    const todayStr = currentDate.toISOString().slice(0, 10);
    const yesterdayDate = new Date(today.getTime() - 86400000);
    const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

    if (!dateCounts[todayStr] && dateCounts[yesterdayStr]) {
      currentDate = yesterdayDate;
    }

    while (true) {
      const dayStr = currentDate.toISOString().slice(0, 10);
      if (dateCounts[dayStr]) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    // Print Header & Banner
    console.log(chalk.yellow.bold(`\n================================================`));
    console.log(chalk.yellow.bold(`   🔥 REMI DEVELOPER STATS & STREAK DASHBOARD   `));
    console.log(chalk.yellow.bold(`================================================\n`));

    console.log(`  ${chalk.red.bold('🔥 Current Streak:')} ${chalk.green.bold(streak + ' Days')}`);
    console.log(`  ${chalk.cyan('📊 Total Work Logs:')} ${chalk.white.bold(totalLogs)}`);
    console.log(`  ${chalk.magenta('📁 Projects Tracked:')} ${chalk.white.bold(totalProjects)}`);
    console.log(`  ${chalk.blue('📅 Active Logging Days:')} ${chalk.white.bold(Object.keys(dateCounts).length)}\n`);

    // Top 5 Technologies
    console.log(chalk.cyan.bold(`💻 Top Technologies & Topics:`));
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    if (sortedTags.length === 0) {
      console.log(chalk.gray(`  No tech tags recorded yet.`));
    } else {
      const maxCount = sortedTags[0][1];
      for (const [tag, count] of sortedTags) {
        const percentage = Math.round((count / maxCount) * 10);
        const bar = '█'.repeat(percentage) + '░'.repeat(10 - percentage);
        console.log(`  ${tag.padEnd(16)} [${chalk.green(bar)}] ${count} logs`);
      }
    }
    console.log('');

    // ASCII 30-Day Activity Matrix Heatmap
    console.log(chalk.magenta.bold(`🗓 30-Day Activity Heatmap:`));
    const heatmap = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const cnt = dateCounts[key] || 0;

      let char = '░';
      if (cnt === 0) char = chalk.gray('░');
      else if (cnt <= 2) char = chalk.green('▒');
      else if (cnt <= 5) char = chalk.yellow('▓');
      else char = chalk.yellow.bold('█');

      heatmap.push(char);
    }

    console.log(`  [ ${heatmap.join(' ')} ]`);
    console.log(chalk.gray(`  Less ░ ▒ ▓ █ More\n`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
