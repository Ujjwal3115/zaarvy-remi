#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { printHeader } from '../src/ui/brand.js';
import { setupCommand } from '../src/config/setup.js';
import { logCommand } from '../src/commands/log.js';
import { graphCommand } from '../src/commands/graph.js';
import { exportCommand } from '../src/commands/export.js';
import { searchCommand } from '../src/commands/search.js';
import { hookCommand } from '../src/commands/hook.js';
import { scheduleCommand } from '../src/commands/schedule.js';
import { syncCommand } from '../src/commands/sync.js';
import { standupCommand } from '../src/commands/standup.js';
import { statsCommand } from '../src/commands/stats.js';

const program = new Command();

printHeader();

program
  .name('zaarvy-remi')
  .description('REMI: Autonomous Project Memory & Work Graph CLI')
  .version('1.0.0');

program
  .command('setup')
  .description('Run the interactive setup wizard for DB and AI preferences')
  .action(async () => {
    try {
      await setupCommand();
    } catch (error) {
      console.error(chalk.red('\n[Error]'), error.message);
      process.exit(1);
    }
  });

program
  .command('log [rawString]')
  .description('Log your work using natural language or strict flags')
  .option('-p, --project <name>', 'Project name (Strict Mode)')
  .option('-m, --message <summary>', 'Action summary (Strict Mode)')
  .option('-t, --tags <tags>', 'Comma separated tags (Strict Mode)')
  .action(async (rawString, options) => {
    await logCommand(rawString, options);
  });

program
  .command('graph')
  .description('Generate and open an interactive D3.js work graph')
  .action(async () => {
    await graphCommand();
  });

program
  .command('export')
  .description('Export all work logs for a specific project to Markdown')
  .option('-p, --project <name>', 'Project name to export')
  .action(async (options) => {
    await exportCommand(options.project);
  });

program
  .command('search <query>')
  .description('Instantly search past work logs using Full Text Search')
  .action(async (query) => {
    await searchCommand(query);
  });

program
  .command('hook install')
  .description('Install a Git post-commit hook in the current repo for auto-logging')
  .action(async () => {
    await hookCommand();
  });

program
  .command('schedule')
  .description('Start a background daemon that sends native desktop reminders')
  .option('-i, --interval <hours>', 'Hours between reminders', '2')
  .action(async (options) => {
    await scheduleCommand(options.interval);
  });

program
  .command('sync')
  .description('Import past Git commit history into REMI memory for the current repo')
  .option('-l, --limit <number>', 'Number of past commits to import', '50')
  .action(async (options) => {
    await syncCommand(options);
  });

program
  .command('standup')
  .description('Generate a formatted Daily/Weekly Standup report for team status')
  .option('-d, --days <number>', 'Number of days to include', '1')
  .option('-p, --project <name>', 'Filter report by specific project')
  .action(async (options) => {
    await standupCommand(options);
  });

program
  .command('stats')
  .description('Display developer activity dashboard, coding streak, and ASCII heatmap')
  .action(async () => {
    await statsCommand();
  });

program.parse(process.argv);
