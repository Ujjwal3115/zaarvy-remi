import chalk from 'chalk';
import { searchWorkLogs } from '../db/client.js';

export async function searchCommand(query) {
  try {
    if (!query) {
      console.error(chalk.red('[Error] Please provide a search query.'));
      process.exit(1);
    }

    const results = await searchWorkLogs(query);

    if (results.length === 0) {
      console.log(chalk.gray(`No results found for "${query}"`));
      return;
    }

    console.log(chalk.green(`\n[*] Found ${results.length} result(s) for "${query}":\n`));
    
    for (const res of results) {
      console.log(chalk.cyan(`[Project: ${res.project_name}] `) + chalk.white(res.action_summary));
      if (res.tags) {
        console.log(chalk.gray(`  Tags: ${res.tags}`));
      }
      console.log('');
    }

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
