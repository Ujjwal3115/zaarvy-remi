import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { printHeader } from '../ui/brand.js';
import { startOrbitServer } from '../orbit/server.js';

export async function orbitCommand(directory = '.', options = {}) {
  try {
    const dirStr = Array.isArray(directory) && directory.length > 0 ? directory.join(' ') : (typeof directory === 'string' ? directory : '.');
    const rootPath = path.resolve(process.cwd(), dirStr || '.');

    if (!fs.existsSync(rootPath)) {
      console.error(chalk.red(`\n[Error] Target directory not found: ${rootPath}\n`));
      process.exit(1);
    }

    const port = options.port ? parseInt(options.port, 10) : 3333;
    const noOpen = options.open === false || options.noOpen === true;

    startOrbitServer({
      rootPath,
      port,
      noOpen
    });
  } catch (error) {
    console.error(chalk.red('\n[Error in Orbit Visualizer]'), error.message);
  }
}
