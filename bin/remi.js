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

// setup
program
  .command('setup')
  .description('Run the interactive setup wizard for DB and AI preferences')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi setup
  $ remi setup
`)
  .action(async () => {
    try {
      await setupCommand();
    } catch (error) {
      console.error(chalk.red('\n[Error]'), error.message);
      process.exit(1);
    }
  });

// log
program
  .command('log [rawString]')
  .description('Log your work using natural language (AI parsed) or strict flags')
  .option('-p, --project <name>', 'Project name (required in Strict Mode)')
  .option('-m, --message <summary>', 'Action / accomplishment summary (required in Strict Mode)')
  .option('-t, --tags <tags>', 'Comma-separated tech/topic tags (e.g. "ui, react, api")')
  .addHelpText('after', `
Examples:
  # Natural Language Mode (AI automatically extracts project, action & tags):
  $ zaarvy-remi log "Integrated Stripe payments and webhooks in ShopApp"
  $ zaarvy-remi log "Refactored user authentication using JWT and Redis"
  $ remi log "Fixed responsive navbar layout bug in landing page"

  # Strict Flag Mode (Explicit values, no AI required):
  $ zaarvy-remi log -p "Zaarvy Engine" -m "Added SQLite FTS5 search index" -t "db, sqlite, fts5"
  $ zaarvy-remi log --project "MyWebApp" --message "Built dark mode theme toggle" --tags "ui, css"
  $ remi log -p "JK_platform" -m "Deployed v1.2 to production" -t "devops, docker"
`)
  .action(async (rawString, options) => {
    await logCommand(rawString, options);
  });

// graph
program
  .command('graph')
  .description('Generate and open the interactive D3.js glassmorphic knowledge graph in browser')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi graph
  $ remi graph
`)
  .action(async () => {
    await graphCommand();
  });

// export
program
  .command('export')
  .description('Export all work logs for a specific project to Markdown')
  .option('-p, --project <name>', 'Project name to export (leave empty to export all)')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi export
  $ zaarvy-remi export -p "Zaarvy Engine"
  $ remi export --project "JK_platform"
`)
  .action(async (options) => {
    await exportCommand(options.project);
  });

// search
program
  .command('search <query>')
  .description('Instantly search past work logs using Full Text Search (FTS5)')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi search "Stripe"
  $ zaarvy-remi search "authentication"
  $ remi search "database migration"
`)
  .action(async (query) => {
    await searchCommand(query);
  });

// hook
program
  .command('hook <action>')
  .description('Install or manage Git post-commit hook in the current repository')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi hook install
  $ remi hook install
`)
  .action(async () => {
    await hookCommand();
  });

// schedule
program
  .command('schedule [message]')
  .description('Start a background daemon that sends native desktop work-log reminders')
  .option('-m, --minutes <number>', 'Minutes between reminder notifications (e.g. 2)')
  .option('-i, --interval <hours>', 'Hours between reminder notifications (default: 2)', '2')
  .option('--test', 'Trigger an instant test desktop notification right now')
  .addHelpText('after', `
Examples:
  # Instantly test desktop notification:
  $ zaarvy-remi schedule --test
  $ remi schedule --test

  # Schedule reminders every 2 minutes (great for quick testing):
  $ zaarvy-remi schedule -m 2
  $ remi schedule --minutes 2

  # Schedule reminders every 2 hours with custom message:
  $ zaarvy-remi schedule "Remember to log your work in REMI!"
  $ remi schedule -i 1
`)
  .action(async (message, options) => {
    await scheduleCommand(message, options);
  });

// sync
program
  .command('sync')
  .description('Scan and import past Git commit history with smart tech-stack detection into REMI')
  .option('-l, --limit <number>', 'Number of past commits to import (default: 50)', '50')
  .addHelpText('after', `
Examples:
  # Import last 50 commits from current git repository:
  $ zaarvy-remi sync

  # Import custom number of commits:
  $ zaarvy-remi sync --limit 100
  $ remi sync -l 20
`)
  .action(async (options) => {
    await syncCommand(options);
  });

// standup
program
  .command('standup')
  .description('Generate a formatted Daily/Weekly Standup report for team status (Slack/Discord)')
  .option('-d, --days <number>', 'Number of days of history to include (default: 1)', '1')
  .option('-p, --project <name>', 'Filter report by a specific project name')
  .addHelpText('after', `
Examples:
  # Daily standup (last 24 hours) across all projects:
  $ zaarvy-remi standup

  # Weekly standup (last 7 days):
  $ zaarvy-remi standup --days 7
  $ remi standup -d 7

  # Project-specific standup report:
  $ zaarvy-remi standup -d 3 -p "JK_platform"
  $ remi standup --project "Zaarvy Engine"
`)
  .action(async (options) => {
    await standupCommand(options);
  });

// stats
program
  .command('stats')
  .description('Display developer activity dashboard, coding streak counter, and ASCII activity heatmap')
  .addHelpText('after', `
Examples:
  $ zaarvy-remi stats
  $ remi stats
`)
  .action(async () => {
    await statsCommand();
  });

// Root Help text (Examples & workflows)
program.addHelpText('after', `
${chalk.bold.yellow('Workflow Examples:')}

  ${chalk.bold('1. Initial Setup & Git Import:')}
    $ zaarvy-remi setup                                    ${chalk.gray('# Configure DB (SQLite/Supabase) & AI providers')}
    $ zaarvy-remi sync                                     ${chalk.gray('# Import past Git commit history')}

  ${chalk.bold('2. Logging Work:')}
    $ zaarvy-remi log "Built checkout page with Stripe"   ${chalk.gray('# AI NLP Mode')}
    $ zaarvy-remi log -p "MyApp" -m "Fixed bug" -t "ui"    ${chalk.gray('# Strict Flag Mode')}

  ${chalk.bold('3. Insights & Reporting:')}
    $ zaarvy-remi standup --days 1                         ${chalk.gray('# Daily standup report')}
    $ zaarvy-remi stats                                    ${chalk.gray('# View coding streak & 30-day heatmap')}
    $ zaarvy-remi graph                                    ${chalk.gray('# Open interactive D3 knowledge graph')}
    $ zaarvy-remi search "auth"                            ${chalk.gray('# Full-text search across all logs')}

${chalk.bold.yellow('Tips:')}
  • You can use the short alias ${chalk.cyan('remi')} interchangeably with ${chalk.cyan('zaarvy-remi')}.
  • For detailed options on any command, run: ${chalk.cyan('zaarvy-remi <command> --help')}
`);

program.parse(process.argv);
