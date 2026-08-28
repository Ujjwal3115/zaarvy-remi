import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import chalk from 'chalk';
import notifier from 'node-notifier';
import { fork } from 'child_process';
import { fileURLToPath } from 'url';
import { printSuccess, printInfo, MASCOT, BRAND } from '../ui/brand.js';

export async function scheduleCommand(rawMessage, options = {}) {
  try {
    // Instant Notification Test
    if (options.test || options.now) {
      console.log(chalk.gray(`${MASCOT.thinking} Triggering instant desktop notification...`));
      notifier.notify({
        title: '⚡ REMI: Project Memory',
        message: rawMessage || 'Test Notification: REMI desktop reminders are working perfectly!',
        sound: true,
        wait: false
      });
      printSuccess('Test notification sent! Check your Windows notification banner in the bottom-right corner.');
      return;
    }

    // Calculate Interval in milliseconds
    let msInterval;
    let timeLabel;

    if (options.minutes) {
      const mins = parseFloat(options.minutes) || 2;
      msInterval = mins * 60 * 1000;
      timeLabel = `${mins} minute(s)`;
    } else {
      const hours = parseFloat(options.interval) || 2;
      msInterval = hours * 60 * 60 * 1000;
      timeLabel = `${hours} hour(s)`;
    }

    // Check if we are the parent or the forked daemon
    if (!process.env.REMI_DAEMON) {
      console.log(chalk.gray(`${MASCOT.thinking} Starting background reminder daemon...`));
      
      const __filename = fileURLToPath(import.meta.url);

      const customMsg = rawMessage || options.message || '';

      const child = fork(__filename, [msInterval.toString(), customMsg], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, REMI_DAEMON: 'true' }
      });
      child.unref(); // Detach completely so CLI exits immediately

      printSuccess(`REMI background daemon started! (Runs every ${timeLabel})`);
      console.log(chalk.gray(`  • This background process runs independently in Windows.`));
      console.log(chalk.gray(`  • It will send native notifications even if your terminal or IDE is closed.`));
      console.log(chalk.gray(`  • Tip: To test notification immediately, run: `) + BRAND.yellow('remi schedule --test'));
      return;
    }

  } catch (error) {
    console.error(chalk.red('\n[Error]'), error.message);
  }
}

// Daemon execution block (Runs detached in background)
if (process.env.REMI_DAEMON === 'true') {
  const msInterval = parseInt(process.argv[2], 10) || 2 * 60 * 60 * 1000;
  const customMessage = process.argv[3] || "You've been coding for a while! Don't forget to log your work.";

  setInterval(() => {
    try {
      const dbPath = path.join(os.homedir(), '.remi', 'remi.db');
      const db = new Database(dbPath);
      
      const lastLog = db.prepare('SELECT created_at FROM work_logs ORDER BY created_at DESC LIMIT 1').get();
      
      let shouldRemind = true;
      if (lastLog && !process.argv[3]) {
        // If no custom message, only notify if user hasn't logged recently
        const lastLogTime = new Date(lastLog.created_at + 'Z').getTime();
        const now = Date.now();
        if ((now - lastLogTime) < msInterval) {
          shouldRemind = false;
        }
      }

      if (shouldRemind) {
        notifier.notify({
          title: '⚡ REMI: Project Memory',
          message: customMessage,
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
