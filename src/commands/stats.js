import chalk from 'chalk';
import { printCommandBanner, MASCOT } from '../ui/brand.js';
import { fetchStatsData } from '../db/client.js';

export async function statsCommand() {
  try {
    const { totalLogs, totalProjects, logs } = await fetchStatsData();

    if (totalLogs === 0) {
      console.log(chalk.yellow('\nNo activity recorded in REMI memory yet.'));
      console.log(chalk.gray('Use "remi log" or "remi sync" to start recording stats.'));
      return;
    }

    const dateCounts = {};
    const tagCounts = {};
    const projectCounts = {};

    for (const log of logs) {
      // Group by project (strictly partitions totalLogs)
      const proj = log.project_name || 'General';
      projectCounts[proj] = (projectCounts[proj] || 0) + 1;

      // Group by calendar date
      if (log.created_at) {
        const day = log.created_at.slice(0, 10); // YYYY-MM-DD
        dateCounts[day] = (dateCounts[day] || 0) + 1;
      }

      // Group by tech tags
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

    const today = new Date();

    // Calculate Active Streak (consecutive days leading up to today or yesterday)
    let streak = 0;
    let currentDate = new Date(today);

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

    // Calculate active days in the last 30 days
    let activeDays30d = 0;
    const heatmap = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      const cnt = dateCounts[key] || 0;

      if (cnt > 0) activeDays30d++;

      let char = '░';
      if (cnt === 0) char = chalk.gray('░');
      else if (cnt <= 2) char = chalk.green('▒');
      else if (cnt <= 5) char = chalk.yellow('▓');
      else char = chalk.yellow.bold('█');

      heatmap.push(char);
    }

    const totalActiveDaysAllTime = Object.keys(dateCounts).length;

    // Print Header & Banner
    printCommandBanner('DEVELOPER STATS & ACTIVITY DASHBOARD', MASCOT.stats);

    console.log(`  ${chalk.red.bold('Current Streak:')}         ${chalk.green.bold(streak + ' Days')} ${chalk.gray('(Consecutive active days)')}`);
    console.log(`  ${chalk.cyan('Total Work Logs:')}        ${chalk.white.bold(totalLogs)}`);
    console.log(`  ${chalk.magenta('Projects Tracked:')}      ${chalk.white.bold(totalProjects)}`);
    console.log(`  ${chalk.blue('Active Days (Last 30d):')} ${chalk.white.bold(activeDays30d + ' Days')}`);
    if (totalActiveDaysAllTime > activeDays30d) {
      console.log(`  ${chalk.gray('All-time Active Days:')}   ${chalk.gray(totalActiveDaysAllTime + ' Days (includes imported Git history)')}`);
    }
    console.log('');

    // Project Breakdown (strictly adds up to totalLogs)
    console.log(chalk.cyan.bold(`Work Logs by Project (Total: ${totalLogs}):`));
    const sortedProjects = Object.entries(projectCounts).sort((a, b) => b[1] - a[1]);
    const maxProjCount = sortedProjects.length > 0 ? sortedProjects[0][1] : 1;

    for (const [proj, count] of sortedProjects) {
      const percentage = Math.round((count / totalLogs) * 100);
      const barLength = Math.max(1, Math.round((count / maxProjCount) * 10));
      const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
      console.log(`  ${proj.padEnd(18)} [${chalk.yellow(bar)}] ${count.toString().padStart(3)} logs (${percentage}%)`);
    }
    console.log('');

    // Top Tech Stack Tags
    const sortedTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sortedTags.length > 0) {
      console.log(chalk.cyan.bold(`Top Tech Stack Tags:`));
      const maxTagCount = sortedTags[0][1];
      for (const [tag, count] of sortedTags) {
        const barLength = Math.max(1, Math.round((count / maxTagCount) * 10));
        const bar = '█'.repeat(barLength) + '░'.repeat(10 - barLength);
        console.log(`  ${tag.padEnd(18)} [${chalk.green(bar)}] ${count} mentions`);
      }
      console.log('');
    }

    // ASCII 30-Day Activity Heatmap
    console.log(chalk.magenta.bold(`30-Day Activity Heatmap (${activeDays30d} active days):`));
    console.log(`  [ ${heatmap.join(' ')} ]`);
    console.log(chalk.gray(`  Less ░ ▒ ▓ █ More\n`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
