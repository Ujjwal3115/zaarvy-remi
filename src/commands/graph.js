import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import chalk from 'chalk';
import { exec } from 'child_process';
import { fetchGraphData } from '../db/client.js';

export async function graphCommand() {
  try {
    const graphData = await fetchGraphData();

    if (graphData.nodes.length === 0) {
      console.log(chalk.yellow('\nNo work history or projects found in database to visualize yet.'));
      console.log(chalk.gray('Tip: Run "remi log" or "remi sync" to import project data first.'));
      return;
    }

    // Inject into HTML
    const currentFilePath = new URL(import.meta.url).pathname;
    let templateDir = path.join(path.dirname(currentFilePath), '..', 'templates');
    if (process.platform === 'win32') templateDir = templateDir.substring(1);
    
    const templatePath = path.join(templateDir, 'graph.html');
    let html = await fs.readFile(templatePath, 'utf8');
    
    const injectionString = `const graphData = ${JSON.stringify(graphData)};`;
    html = html.replace(/const graphData = \{ nodes: \[\], links: \[\], logs: \[\] \};/, injectionString);
    
    const outputPath = path.join(os.homedir(), '.remi', 'output_graph.html');
    await fs.writeFile(outputPath, html);

    console.log(chalk.green(`✔ Uncluttered Knowledge Graph generated at ${outputPath}`));
    
    let startCmd = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    exec(`${startCmd} "" "${outputPath}"`);

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}
