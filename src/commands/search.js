import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';

export async function searchCommand(query) {
  try {
    if (!query) {
      console.error(chalk.red('[Error] Please provide a search query.'));
      process.exit(1);
    }

    const configPath = path.join(os.homedir(), '.remi', 'config.json');
    const configData = await fs.readFile(configPath, 'utf8');
    const config = JSON.parse(configData);

    if (config.dbType === 'supabase') {
      console.log(chalk.yellow('Search currently queries the local SQLite cache. Remote Supabase search coming soon!'));
    }

    const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
    const db = new Database(dbPath);

    // Using FTS5 match query
    const stmt = db.prepare(`
      SELECT log_id, action_summary, tags, project_name 
      FROM work_logs_fts 
      WHERE work_logs_fts MATCH ? 
      ORDER BY rank
      LIMIT 20
    `);
    
    // Replace spaces with AND for robust wildcard searching
    const ftsQuery = query.split(' ').filter(Boolean).map(t => `"${t}"*`).join(' AND ');
    
    const results = stmt.all(ftsQuery);

    if (results.length === 0) {
      console.log(chalk.gray(`No results found for "${query}"`));
      return;
    }

    console.log(chalk.green(`\n✔ Found ${results.length} result(s) for "${query}":\n`));
    
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
