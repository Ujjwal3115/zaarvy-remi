import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import chalk from 'chalk';
import { buildDependencyGraph } from './analyzer.js';
import { BRAND, MASCOT } from '../ui/brand.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function openBrowser(url, noOpen = false) {
  if (noOpen) return;
  const platform = process.platform;
  let cmd;
  if (platform === 'darwin') {
    cmd = `open "${url}"`;
  } else if (platform === 'win32') {
    cmd = `start "" "${url}"`;
  } else {
    cmd = `xdg-open "${url}"`;
  }
  exec(cmd, () => {});
}

export function printOrbitBanner(graph, url) {
  const lime = BRAND.yellowBold;
  const dim = chalk.dim;
  const white = chalk.white.bold;
  const gray = chalk.gray;

  const tierCounts = { entry: 0, routes: 0, components: 0, services: 0, utils: 0 };
  graph.nodes.forEach((n) => {
    tierCounts[n.tier] = (tierCounts[n.tier] || 0) + 1;
  });

  const width = 64;
  const border = '═'.repeat(width);

  console.log(lime(`\n  ╔${border}╗`));
  console.log(
    lime(`  ║   `) +
      BRAND.badge('REMI ORBIT') +
      ` ` +
      white('3D Architecture & Dependency Visualizer') +
      ' '.repeat(Math.max(0, width - 53)) +
      lime(`║`)
  );
  console.log(lime(`  ╠${border}╣`));
  console.log(
    lime(`  ║  `) +
      gray('Project      : ') +
      white(graph.projectName.padEnd(width - 19)) +
      lime(`║`)
  );
  console.log(
    lime(`  ║  `) +
      gray('Nodes (Files): ') +
      chalk.green(String(graph.metrics.totalFiles).padEnd(width - 19)) +
      lime(`║`)
  );
  console.log(
    lime(`  ║  `) +
      gray('Dependencies : ') +
      chalk.yellow(String(graph.metrics.totalDependencies).padEnd(width - 19)) +
      lime(`║`)
  );
  console.log(
    lime(`  ║  `) +
      gray('Clusters     : ') +
      chalk.cyan(`${graph.metrics.totalClusters} hierarchical hubs`.padEnd(width - 19)) +
      lime(`║`)
  );

  const cycleStr =
    graph.metrics.totalCycles > 0
      ? chalk.red.bold(`[!] ${graph.metrics.totalCycles} circular loops detected`)
      : dim('[OK] 0 circular loops');
  console.log(
    lime(`  ║  `) +
      gray('Cycles       : ') +
      cycleStr.padEnd(width - 10) +
      lime(`║`)
  );

  const orphanStr =
    graph.metrics.totalOrphans > 0
      ? chalk.yellow(`[--] ${graph.metrics.totalOrphans} unreferenced files`)
      : dim('[OK] 0 unreferenced files');
  console.log(
    lime(`  ║  `) +
      gray('Orphans      : ') +
      orphanStr.padEnd(width - 10) +
      lime(`║`)
  );

  console.log(
    lime(`  ║  `) +
      gray('Complexity   : ') +
      chalk.magenta(`${graph.metrics.complexityScore} / 100`.padEnd(width - 19)) +
      lime(`║`)
  );
  console.log(
    lime(`  ║  `) +
      gray('Scan Time    : ') +
      dim(`${graph.elapsedMs} ms`.padEnd(width - 19)) +
      lime(`║`)
  );
  console.log(lime(`  ╠${border}╣`));

  const tiersLine = `Tiers: Entry(${tierCounts.entry}) Routes(${tierCounts.routes}) UI(${tierCounts.components}) Svc(${tierCounts.services}) Utils(${tierCounts.utils})`;
  console.log(
    lime(`  ║  `) +
      dim(tiersLine.padEnd(width - 4)) +
      lime(`║`)
  );
  console.log(lime(`  ╠${border}╣`));
  console.log(
    lime(`  ║  `) +
      chalk.green('[>>] Orbital Viewer: ') +
      chalk.cyan.underline(url.padEnd(width - 25)) +
      lime(`║`)
  );
  console.log(lime(`  ╚${border}╝\n`));
  console.log(`  ${dim('Press Ctrl+C to stop the orbital telemetry server.')}\n`);
}

export function startOrbitServer({ rootPath, port = 3333, noOpen = false }) {
  const viewerTemplatePath = path.join(__dirname, '..', 'templates', 'orbit-viewer.html');

  if (!fs.existsSync(viewerTemplatePath)) {
    console.error(chalk.red(`\n[Error] Viewer HTML template missing at: ${viewerTemplatePath}\n`));
    process.exit(1);
  }

  let currentPort = parseInt(port, 10) || 3333;
  const initialGraph = buildDependencyGraph(rootPath);

  const server = http.createServer((req, res) => {
    let currentGraph;
    try {
      currentGraph = buildDependencyGraph(rootPath);
    } catch (err) {
      currentGraph = initialGraph;
    }

    if (req.url === '/api/graph') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      });
      res.end(JSON.stringify(currentGraph));
      return;
    }

    let rawHtml = '';
    try {
      rawHtml = fs.readFileSync(viewerTemplatePath, 'utf8');
    } catch (e) {
      rawHtml = '<h1>Orbit Viewer template not found</h1>';
    }

    const injectedHtml = rawHtml.replace(
      '/*__ZAARVY_GRAPH_DATA_PLACEHOLDER__*/',
      `window.__ZAARVY_GRAPH_DATA__ = ${JSON.stringify(currentGraph)};`
    );

    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end(injectedHtml);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(chalk.yellow(`[Port ${currentPort} busy, trying ${currentPort + 1}...]`));
      currentPort++;
      server.listen(currentPort);
    } else {
      console.error(err);
      process.exit(1);
    }
  });

  server.listen(currentPort, () => {
    const url = `http://localhost:${currentPort}`;
    printOrbitBanner(initialGraph, url);
    openBrowser(url, noOpen);
  });

  return server;
}
