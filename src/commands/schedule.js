import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';
import notifier from 'node-notifier';
import { fork } from 'child_process';

export async function scheduleCommand(intervalHours) {
  try {
    const hours = parseFloat(intervalHours) || 2;
    const msInterval = hours * 60 * 60 * 1000;

    // Check if we are the parent or the forked daemon
    if (!process.env.REMI_DAEMON) {
      console.log(chalk.green(`✔ Starting REMI background daemon...`));
      console.log(chalk.gray(`It will run silently in the background and remind you every ${hours} hours if you haven't logged any work.`));
      
      let scriptPath = new URL(import.meta.url).pathname;
      if (process.platform === 'win32') scriptPath = scriptPath.substring(1);

      const child = fork(scriptPath, [msInterval.toString()], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, REMI_DAEMON: 'true' }
      });
      child.unref(); // Detach completely so CLI exits immediately
      return;
    }

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}

// Daemon execution block
if (process.env.REMI_DAEMON === 'true') {
  const msInterval = parseInt(process.argv[2], 10) || 2 * 60 * 60 * 1000;
  
  // We don't want to notify immediately, we want to notify periodically
  setInterval(() => {
    try {
      const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
      const db = new Database(dbPath);
      
      const lastLog = db.prepare('SELECT created_at FROM work_logs ORDER BY created_at DESC LIMIT 1').get();
      
      let shouldRemind = true;
      if (lastLog) {
        // SQLite datetime is UTC, append Z so Date object parses it correctly
        const lastLogTime = new Date(lastLog.created_at + 'Z').getTime();
        const now = Date.now();
        if ((now - lastLogTime) < msInterval) {
          shouldRemind = false;
        }
      }

      if (shouldRemind) {
        notifier.notify({
          title: 'REMI: Project Memory',
          message: "You've been coding for a while! Don't forget to log your work.",
          sound: true,
          wait: false
        });
      }
      
      db.close();
    } catch (e) {
      // Fail silently in background
    }
  }, msInterval);
}
