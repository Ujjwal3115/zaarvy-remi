import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

let sqliteDb = null;
let supabaseClient = null;
let config = null;

async function loadConfig() {
  if (config) return config;
  const configPath = path.join(os.homedir(), '.remi', 'config.json');
  try {
    const data = await fsp.readFile(configPath, 'utf8');
    config = JSON.parse(data);
    return config;
  } catch (error) {
    throw new Error('Config file not found. Please run "zaarvy-remi setup" first.');
  }
}

export async function initDB() {
  const cfg = await loadConfig();
  
  if (cfg.dbType === 'supabase') {
    if (!cfg.supabaseUrl || !cfg.supabaseKey) {
      throw new Error('Supabase URL or Key is missing. Run "zaarvy-remi setup".');
    }
    supabaseClient = createClient(cfg.supabaseUrl, cfg.supabaseKey);
  } else {
    // Local SQLite
    const dbDir = path.join(os.homedir(), '.remi');
    const dbPath = path.join(dbDir, 'remi.db');
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    sqliteDb = new Database(dbPath);
    
    // Read and execute schema
    const schemaPath = path.join(process.cwd(), 'src', 'db', 'schema.sql');
    try {
      const schemaSql = await fsp.readFile(schemaPath, 'utf8');
      sqliteDb.exec(schemaSql);
    } catch (e) {
      // If run from a different CWD, fallback to __dirname logic but we are using ESM
      const currentFilePath = new URL(import.meta.url).pathname;
      const fallbackSchemaPath = path.join(path.dirname(currentFilePath), 'schema.sql');
      // Fix windows path issue with import.meta.url
      const finalPath = process.platform === 'win32' ? fallbackSchemaPath.substring(1) : fallbackSchemaPath;
      const schemaSql = await fsp.readFile(finalPath, 'utf8');
      sqliteDb.exec(schemaSql);
    }
  }
}

// Generates a UUID v4
function uuid() {
  return crypto.randomUUID();
}

export async function logWork({ project, action, tags, createdAt }) {
  await initDB();
  const cfg = await loadConfig();

  const projectId = uuid();
  const workLogId = uuid();
  const tagList = Array.isArray(tags) ? tags.join(', ') : (tags || '');
  const timestamp = createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (cfg.dbType === 'supabase') {
    // 1. Upsert Project
    let { data: projData } = await supabaseClient.from('projects').select('id').eq('name', project).single();
    let finalProjectId = projData?.id;
    if (!finalProjectId) {
      finalProjectId = projectId;
      await supabaseClient.from('projects').insert([{ id: finalProjectId, name: project }]);
    }

    // 2. Insert Work Log
    const { error } = await supabaseClient.from('work_logs').insert([{
      id: workLogId,
      project_id: finalProjectId,
      action_summary: action,
      tags: tagList,
      source: 'manual',
      created_at: timestamp
    }]);

    if (error) throw new Error(`Supabase Error: ${error.message}`);
  } else {
    // SQLite
    const insertProject = sqliteDb.prepare(`INSERT INTO projects (id, name) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`);
    const projResult = insertProject.get(projectId, project);
    const finalProjectId = projResult.id;

    const insertWork = sqliteDb.prepare(`INSERT INTO work_logs (id, project_id, action_summary, tags, source, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    insertWork.run(workLogId, finalProjectId, action, tagList, 'manual', timestamp);
  }
}
