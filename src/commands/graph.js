import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';
import { exec } from 'child_process';

export async function graphCommand() {
  try {
    const configPath = path.join(os.homedir(), '.remi', 'config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (config.dbType === 'supabase') {
      console.log(chalk.yellow('Graphing currently fetches from local SQLite cache. Syncing from Supabase coming soon!'));
      return;
    }

    const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
    const db = new Database(dbPath);
    
    // Auto-clean/merge 'jk' into 'JK_platform' if both exist
    try {
      const jkProj = db.prepare("SELECT id FROM projects WHERE name = 'jk'").get();
      const jkPlatformProj = db.prepare("SELECT id FROM projects WHERE name = 'JK_platform'").get();
      
      if (jkProj && jkPlatformProj) {
        db.prepare("UPDATE work_logs SET project_id = ? WHERE project_id = ?").run(jkPlatformProj.id, jkProj.id);
        db.prepare("DELETE FROM projects WHERE id = ?").run(jkProj.id);
      } else if (jkProj && !jkPlatformProj) {
        db.prepare("UPDATE projects SET name = 'JK_platform' WHERE id = ?").run(jkProj.id);
      }
    } catch (e) {
      // Ignore if merge fails
    }

    const nodes = [];
    const links = [];
    const addedNodes = new Map(); // id -> node

    // 1. Project Nodes
    const projects = db.prepare('SELECT * FROM projects').all();
    for (const p of projects) {
      const n = { id: p.name, label: p.name, group: 'project' };
      nodes.push(n);
      addedNodes.set(p.name, n);
    }

    // Fetch work logs
    const workLogs = db.prepare(`
      SELECT work_logs.id, projects.name as project_name, work_logs.action_summary, work_logs.tags, work_logs.created_at 
      FROM work_logs 
      JOIN projects ON work_logs.project_id = projects.id
      ORDER BY work_logs.created_at DESC
    `).all();

    // Ignore clutter single-word tags
    const clutterTags = new Set(['git', 'import', 'feat', 'fix', 'docs', 'style', 'test', 'chore', 'repository']);

    for (const log of workLogs) {
      if (!log.tags) continue;
      const rawTags = log.tags.split(',').map(t => t.trim()).filter(Boolean);

      for (const tag of rawTags) {
        if (clutterTags.has(tag.toLowerCase())) continue;

        let groupType = 'tech';
        let label = tag;

        if (tag.startsWith('@')) {
          groupType = 'author';
        }

        if (!addedNodes.has(label)) {
          const tagNode = { id: label, label: label, group: groupType };
          nodes.push(tagNode);
          addedNodes.set(label, tagNode);
        }

        // Connect directly to the project node
        links.push({ source: log.project_name, target: label, value: 1 });
      }
    }

    const graphData = { nodes, links, logs: workLogs };
    
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
