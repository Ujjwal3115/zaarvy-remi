import chalk from 'chalk';
import { logWork } from '../db/client.js';
import { parseWithAI } from '../ai/router.js';

export async function logCommand(rawString, options) {
  try {
    // Strict Mode Check
    if (options.project || options.message || options.tags) {
      if (!options.project || !options.message) {
        console.error(chalk.red('[Error] Strict mode requires at least -p (project) and -m (message) flags.'));
        process.exit(1);
      }
      
      console.log(chalk.gray('Logging via Strict Mode...'));
      await logWork({
        project: options.project,
        action: options.message,
        tags: options.tags
      });
      console.log(chalk.green('✔ Work logged successfully!'));
      return;
    }

    // NLP Mode Check
    if (!rawString) {
      console.error(chalk.red('[Error] Please provide a log message string or use strict flags (-p, -m, -t).'));
      process.exit(1);
    }

    console.log(chalk.gray('Processing via AI Router...'));
    const parsedData = await parseWithAI(rawString);
    
    if (!parsedData || parsedData.intent !== 'LOG_WORK') {
      console.error(chalk.red('[Error] AI could not understand the intent. Please try rephrasing or use strict mode.'));
      process.exit(1);
    }

    const tagsDisplay = Array.isArray(parsedData.tags) ? parsedData.tags.join(', ') : (parsedData.tags || 'none');
    console.log(chalk.cyan(`Project: ${parsedData.project} | Tags: ${tagsDisplay}`));
    console.log(chalk.white(`Action: ${parsedData.action}`));

    await logWork({
      project: parsedData.project,
      action: parsedData.action,
      tags: parsedData.tags
    });
    console.log(chalk.green('✔ Work logged successfully!'));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
    process.exit(1);
  }
}
