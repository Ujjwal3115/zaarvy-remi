import chalk from 'chalk';
import { logWork } from '../db/client.js';
import { parseWithAI } from '../ai/router.js';
import { printSuccess, startMascotSpinner, MASCOT, BRAND } from '../ui/brand.js';

export async function logCommand(rawString, options) {
  try {
    // Strict Mode Check
    if (options.project || options.message || options.tags) {
      if (!options.project || !options.message) {
        console.error(chalk.red('[Error] Strict mode requires at least -p (project) and -m (message) flags.'));
        process.exit(1);
      }
      
      const spinner = startMascotSpinner('Logging via Strict Mode...');
      await logWork({
        project: options.project,
        action: options.message,
        tags: options.tags
      });
      spinner.stop('Work logged successfully!');
      return;
    }

    // NLP Mode Check
    if (!rawString) {
      console.error(chalk.red('[Error] Please provide a log message string or use strict flags (-p, -m, -t).'));
      process.exit(1);
    }

    const spinner = startMascotSpinner('Processing with AI Router...');
    const parsedData = await parseWithAI(rawString);
    
    if (!parsedData || parsedData.intent !== 'LOG_WORK') {
      spinner.stop('AI could not understand intent. Try strict mode.', false);
      process.exit(1);
    }

    const tagsDisplay = Array.isArray(parsedData.tags) ? parsedData.tags.join(', ') : (parsedData.tags || 'none');

    await logWork({
      project: parsedData.project,
      action: parsedData.action,
      tags: parsedData.tags
    });
    
    spinner.stop('Work logged successfully!');
    console.log(BRAND.yellow(`  Project: ${parsedData.project}`) + chalk.gray(` | Tags: ${tagsDisplay}`));
    console.log(chalk.white(`  Action: ${parsedData.action}`));

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
    process.exit(1);
  }
}
