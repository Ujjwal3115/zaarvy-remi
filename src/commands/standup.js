import chalk from 'chalk';
import { cleanCommitMessage } from '../utils/git.js';
import { printCommandBanner, MASCOT } from '../ui/brand.js';
import { fetchStandupLogs } from '../db/client.js';

export async function standupCommand(options) {
  try {
    const days = options.days ? parseInt(options.days, 10) : 1;
    const targetProject = options.project || null;

    const logs = await fetchStandupLogs(days, targetProject);

    if (logs.length === 0) {
      console.log(chalk.yellow(`\nNo work logs found for the last ${days} day(s)${targetProject ? ` in project "${targetProject}"` : ''}.`));
      console.log(chalk.gray(`Tip: Use "remi log" or "remi sync" to record work history.`));
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
      console.log(chalk.yellow.bold(`Project: ${proj}`));
      console.log(chalk.gray(`   Total Accomplishments: ${projLogs.length}`));
      console.log(chalk.green(`   Done / Completed:`));

      for (const item of projLogs) {
        const cleanMsg = cleanCommitMessage(item.action_summary);
        console.log(`     • ${cleanMsg}`);
      }
      console.log('');
    }

    console.log(chalk.cyan(`Next Steps:`));
    console.log(`   • Continue feature development and testing.`);
    console.log(`   • Review open pull requests and feedback.\n`);

    console.log(chalk.red(`Blockers:`));
    console.log(`   • None reported.\n`);

    console.log(chalk.gray(`Report generated cleanly from REMI memory.`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
