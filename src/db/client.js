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

export async function loadConfig() {
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
    if (!supabaseClient) {
      supabaseClient = createClient(cfg.supabaseUrl, cfg.supabaseKey);
    }
  } else {
    // Local SQLite
    if (!sqliteDb) {
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
        const currentFilePath = new URL(import.meta.url).pathname;
        const fallbackSchemaPath = path.join(path.dirname(currentFilePath), 'schema.sql');
        const finalPath = process.platform === 'win32' ? fallbackSchemaPath.substring(1) : fallbackSchemaPath;
        const schemaSql = await fsp.readFile(finalPath, 'utf8');
        sqliteDb.exec(schemaSql);
      }
    }
  }
}

function uuid() {
  return crypto.randomUUID();
}

// 1. Log Work (Supports SQLite and Supabase)
export async function logWork({ project, action, tags, createdAt }) {
  await initDB();
  const cfg = await loadConfig();

  const projectId = uuid();
  const workLogId = uuid();
  const tagList = Array.isArray(tags) ? tags.join(', ') : (tags || '');
  const timestamp = createdAt || new Date().toISOString().replace('T', ' ').slice(0, 19);

  if (cfg.dbType === 'supabase') {
    let { data: projData } = await supabaseClient.from('projects').select('id').eq('name', project).maybeSingle();
    let finalProjectId = projData?.id;
    if (!finalProjectId) {
      finalProjectId = projectId;
      const { error: pErr } = await supabaseClient.from('projects').insert([{ id: finalProjectId, name: project }]);
      if (pErr && pErr.code !== '23505') throw new Error(`Supabase Project Error: ${pErr.message}`);
      // If conflict on name, re-fetch
      if (pErr && pErr.code === '23505') {
        const { data: retryData } = await supabaseClient.from('projects').select('id').eq('name', project).single();
        finalProjectId = retryData.id;
      }
    }

    const { error } = await supabaseClient.from('work_logs').insert([{
      id: workLogId,
      project_id: finalProjectId,
      action_summary: action,
      tags: tagList,
      source: 'manual',
      created_at: timestamp
    }]);

    if (error) throw new Error(`Supabase Work Log Error: ${error.message}`);
  } else {
    const insertProject = sqliteDb.prepare(`INSERT INTO projects (id, name) VALUES (?, ?) ON CONFLICT(name) DO UPDATE SET name=excluded.name RETURNING id`);
    const projResult = insertProject.get(projectId, project);
    const finalProjectId = projResult.id;

    const insertWork = sqliteDb.prepare(`INSERT INTO work_logs (id, project_id, action_summary, tags, source, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
    insertWork.run(workLogId, finalProjectId, action, tagList, 'manual', timestamp);
  }
}

// 2. Fetch Graph Data (Supports SQLite and Supabase)
export async function fetchGraphData() {
  await initDB();
  const cfg = await loadConfig();

  const nodes = [];
  const links = [];
  const addedNodes = new Map();
  let workLogs = [];

  const clutterTags = new Set(['git', 'import', 'feat', 'fix', 'docs', 'style', 'test', 'chore', 'repository']);

  if (cfg.dbType === 'supabase') {
    // Supabase
    const { data: projects, error: pErr } = await supabaseClient.from('projects').select('id, name');
    if (pErr) throw new Error(`Supabase Error: ${pErr.message}`);

    for (const p of (projects || [])) {
      const n = { id: p.name, label: p.name, group: 'project' };
      nodes.push(n);
      addedNodes.set(p.name, n);
    }

    const { data: logs, error: lErr } = await supabaseClient
      .from('work_logs')
      .select('id, action_summary, tags, created_at, projects ( name )')
      .order('created_at', { ascending: false });

    if (lErr) throw new Error(`Supabase Error: ${lErr.message}`);

    workLogs = (logs || []).map(l => ({
      id: l.id,
      project_name: l.projects?.name || 'General',
      action_summary: l.action_summary,
      tags: l.tags,
      created_at: l.created_at
    }));
  } else {
    // SQLite
    const projects = sqliteDb.prepare('SELECT * FROM projects').all();
    for (const p of projects) {
      const n = { id: p.name, label: p.name, group: 'project' };
      nodes.push(n);
      addedNodes.set(p.name, n);
    }

    workLogs = sqliteDb.prepare(`
      SELECT work_logs.id, projects.name as project_name, work_logs.action_summary, work_logs.tags, work_logs.created_at 
      FROM work_logs 
      JOIN projects ON work_logs.project_id = projects.id
      ORDER BY work_logs.created_at DESC
    `).all();
  }

  // Build tech & author nodes and links
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

      links.push({ source: log.project_name, target: label, value: 1 });
    }
  }

  return { nodes, links, logs: workLogs };
}

// 3. Fetch Standup Logs (Supports SQLite and Supabase)
export async function fetchStandupLogs(days = 1, targetProject = null) {
  await initDB();
  const cfg = await loadConfig();

  const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (cfg.dbType === 'supabase') {
    let query = supabaseClient
      .from('work_logs')
      .select('id, action_summary, tags, created_at, projects!inner ( name )')
      .gte('created_at', cutoffDate)
      .order('created_at', { ascending: false });

    if (targetProject) {
      query = query.eq('projects.name', targetProject);
    }

    const { data, error } = await query;
    if (error) throw new Error(`Supabase Standup Error: ${error.message}`);

    return (data || []).map(l => ({
      id: l.id,
      project_name: l.projects?.name || 'General',
      action_summary: l.action_summary,
      tags: l.tags,
      created_at: l.created_at
    }));
  } else {
    const formattedCutoff = cutoffDate.replace('T', ' ').slice(0, 19);
    let query = `
      SELECT work_logs.id, projects.name as project_name, work_logs.action_summary, work_logs.tags, work_logs.created_at 
      FROM work_logs 
      JOIN projects ON work_logs.project_id = projects.id
      WHERE work_logs.created_at >= ?
    `;
    const params = [formattedCutoff];

    if (targetProject) {
      query += ` AND projects.name = ?`;
      params.push(targetProject);
    }

    query += ` ORDER BY work_logs.created_at DESC`;
    return sqliteDb.prepare(query).all(...params);
  }
}

// 4. Fetch Stats Data (Supports SQLite and Supabase)
export async function fetchStatsData() {
  await initDB();
  const cfg = await loadConfig();

  if (cfg.dbType === 'supabase') {
    const { count: totalProjects, error: pErr } = await supabaseClient.from('projects').select('*', { count: 'exact', head: true });
    if (pErr) throw new Error(`Supabase Stats Error: ${pErr.message}`);

    const { data: logs, count: totalLogs, error: lErr } = await supabaseClient
      .from('work_logs')
      .select('created_at, tags, projects ( name )', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (lErr) throw new Error(`Supabase Stats Error: ${lErr.message}`);

    return {
      totalLogs: totalLogs || 0,
      totalProjects: totalProjects || 0,
      logs: (logs || []).map(l => ({
        created_at: l.created_at,
        tags: l.tags,
        project_name: l.projects?.name || 'General'
      }))
    };
  } else {
    const totalLogs = sqliteDb.prepare('SELECT COUNT(*) as count FROM work_logs').get().count;
    const totalProjects = sqliteDb.prepare('SELECT COUNT(*) as count FROM projects').get().count;
    const logs = sqliteDb.prepare(`
      SELECT w.created_at, w.tags, p.name as project_name 
      FROM work_logs w 
      LEFT JOIN projects p ON w.project_id = p.id 
      ORDER BY w.created_at DESC
    `).all();

    return { totalLogs, totalProjects, logs };
  }
}

// 5. Search Work Logs (Supports SQLite and Supabase)
export async function searchWorkLogs(queryStr) {
  await initDB();
  const cfg = await loadConfig();

  if (cfg.dbType === 'supabase') {
    const { data, error } = await supabaseClient
      .from('work_logs')
      .select('id, action_summary, tags, projects ( name )')
      .or(`action_summary.ilike.%${queryStr}%,tags.ilike.%${queryStr}%`)
      .limit(20);

    if (error) throw new Error(`Supabase Search Error: ${error.message}`);

    return (data || []).map(l => ({
      log_id: l.id,
      project_name: l.projects?.name || 'General',
      action_summary: l.action_summary,
      tags: l.tags
    }));
  } else {
    const stmt = sqliteDb.prepare(`
      SELECT log_id, action_summary, tags, project_name 
      FROM work_logs_fts 
      WHERE work_logs_fts MATCH ? 
      ORDER BY rank
      LIMIT 20
    `);
    
    const ftsQuery = queryStr.split(' ').filter(Boolean).map(t => `"${t}"*`).join(' AND ');
    return stmt.all(ftsQuery);
  }
}

// 6. Fetch Logs for Export (Supports SQLite and Supabase)
export async function fetchExportLogs(projectName) {
  await initDB();
  const cfg = await loadConfig();

  if (cfg.dbType === 'supabase') {
    const { data: proj, error: pErr } = await supabaseClient
      .from('projects')
      .select('id, name')
      .eq('name', projectName)
      .maybeSingle();

    if (pErr) throw new Error(`Supabase Error: ${pErr.message}`);
    if (!proj) return null;

    const { data: logs, error: lErr } = await supabaseClient
      .from('work_logs')
      .select('id, action_summary, tags, created_at')
      .eq('project_id', proj.id)
      .order('created_at', { ascending: false });

    if (lErr) throw new Error(`Supabase Error: ${lErr.message}`);
    return { project: proj, logs: logs || [] };
  } else {
    const project = sqliteDb.prepare('SELECT id, name FROM projects WHERE name = ?').get(projectName);
    if (!project) return null;

    const logs = sqliteDb.prepare('SELECT id, action_summary, tags, created_at FROM work_logs WHERE project_id = ? ORDER BY created_at DESC').all(project.id);
    return { project, logs };
  }
}
