import fs from 'fs';
import path from 'path';

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================
export const IGNORE_DIRS = new Set([
  'node_modules',
  '.git',
  '.remi',
  'dist',
  'build',
  '.next',
  '__pycache__',
  '.venv',
  'venv',
  'env',
  'coverage',
  '.idea',
  '.vscode',
  '.turbo',
  '.vercel',
  'out',
  'target',
  '.svelte-kit',
  '.nuxt'
]);

export const SUPPORTED_EXTS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.py'
]);

// ============================================================================
// 1. RECURSIVE DISCOVERY: MONOREPOS, SUBPROJECTS & FILES
// ============================================================================
export function discoverWorkspace(rootDir) {
  const packages = []; // { name, dir, relDir, type: 'npm' | 'python', main?: string }
  const pkgNameToDir = new Map();
  const files = [];

  function scanDir(dir) {
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    // 1. Identify package boundaries in current directory
    let isPackage = false;
    let pkgName = null;
    let pkgMain = null;

    for (const entry of entries) {
      if (entry.isFile()) {
        if (entry.name === 'package.json') {
          try {
            const raw = fs.readFileSync(path.join(dir, 'package.json'), 'utf8');
            const parsed = JSON.parse(raw);
            pkgName = parsed.name || path.basename(dir);
            pkgMain = parsed.main || parsed.module;
            isPackage = true;
            packages.push({
              name: pkgName,
              dir,
              relDir: path.relative(rootDir, dir).replace(/\\/g, '/') || '(root)',
              type: 'npm',
              main: pkgMain
            });
            pkgNameToDir.set(pkgName, dir);
          } catch (e) {}
        } else if (
          !isPackage &&
          (entry.name === 'pyproject.toml' || entry.name === 'setup.py' || entry.name === 'requirements.txt')
        ) {
          pkgName = path.basename(dir);
          isPackage = true;
          packages.push({
            name: pkgName,
            dir,
            relDir: path.relative(rootDir, dir).replace(/\\/g, '/') || '(root)',
            type: 'python'
          });
          pkgNameToDir.set(pkgName, dir);
        }
      }
    }

    // 2. Traverse files & subdirectories deeply
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry.name) || entry.name.startsWith('.')) continue;
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (SUPPORTED_EXTS.has(ext)) {
          files.push(fullPath);
        }
      }
    }
  }

  scanDir(rootDir);
  return { files, packages, pkgNameToDir };
}

// ============================================================================
// 2. ARCHITECTURAL TIER CLASSIFIER
// ============================================================================
export function classifyTier(relPath) {
  const norm = relPath.toLowerCase().replace(/\\/g, '/');
  const base = path.basename(norm);

  // 1. Entry points (Next.js root page, Streamlit, Python runners, CLI and desktop launchers)
  if (
    /(?:^|\/)(?:src\/)?app\/page\.(js|jsx|ts|tsx)$/.test(norm) ||
    /(?:^|\/)(?:src\/)?pages\/index\.(js|jsx|ts|tsx)$/.test(norm) ||
    (/^(index|main|app|server|cli|manage|wsgi|asgi|home|launcher|start|run|bootstrap|streamlit_app)\.(js|jsx|ts|tsx|mjs|cjs|py)$/.test(base) &&
      norm.split('/').length <= 3)
  ) {
    return 'entry';
  }
  if (
    norm === 'src/index.ts' ||
    norm === 'src/index.js' ||
    norm === 'src/main.py' ||
    norm === 'app.py' ||
    norm === 'main.py' ||
    norm === 'home.py' ||
    norm === 'launcher.py' ||
    norm === 'streamlit_app.py'
  ) {
    return 'entry';
  }

  // 2. Routes / Controllers / APIs / Framework Pages (Next.js subpages, Streamlit pages, API routes)
  if (
    /(?:^|\/)(?:src\/)?app\/.+\/page\.(js|jsx|ts|tsx)$/.test(norm) ||
    /(?:^|\/)(?:src\/)?app\/.+\/route\.(js|jsx|ts|tsx)$/.test(norm) ||
    /(?:^|\/)(pages|routes|api)\/.+\.(js|jsx|ts|tsx|py)$/.test(norm) ||
    /(route|routes|router|controller|controllers|api|endpoint|endpoints|urls|views\.py|handler|handlers)/.test(norm)
  ) {
    return 'routes';
  }

  // 3. UI / Components / Views / Templates / Layouts
  if (/(component|components|view|views|ui|layout|layouts|template|templates|widget|widgets|screen|screens)/.test(norm)) {
    return 'components';
  }

  // 4. Utils / Config / DB / Helpers / Types
  if (/(util|utils|helper|helpers|config|conf|db|database|model|models|schema|schemas|type|types|constant|constants|middleware|middlewares|hook|hooks)/.test(norm)) {
    return 'utils';
  }

  // 5. Default to Services / Core Business Logic
  return 'services';
}

// ============================================================================
// 3. CLUSTER GROUPING & HIERARCHICAL FOLDER BREAKDOWN
// ============================================================================
export function computeClusterGroup(relPath, packages) {
  const norm = relPath.replace(/\\/g, '/');
  const parts = norm.split('/');

  // Check if path is inside a known subproject package
  for (const pkg of packages) {
    if (pkg.relDir !== '(root)' && norm.startsWith(pkg.relDir + '/')) {
      const sub = norm.slice(pkg.relDir.length + 1);
      const subParts = sub.split('/');
      if (subParts.length > 1) {
        return `${pkg.relDir}/${subParts[0]}`;
      }
      return pkg.relDir;
    }
  }

  // Standard folder grouping
  if (parts.length === 1) {
    return '(root)';
  } else if (parts.length === 2) {
    return parts[0];
  } else {
    // e.g. "src/components" or "packages/api"
    return `${parts[0]}/${parts[1]}`;
  }
}

// ============================================================================
// 4. IMPORT EXTRACTION & RESOLUTION (JS/TS, PYTHON & MONOREPO ALIASES)
// ============================================================================
export function extractRawImports(content, ext) {
  const imports = new Set();
  const cleaned = content.replace(/\/\*[\s\S]*?\*\//g, '');

  if (ext === '.py') {
    const fromRegex = /^\s*from\s+([.\w]+)\s+import\s+([^\n#]+)/gm;
    let match;
    while ((match = fromRegex.exec(cleaned)) !== null) {
      const mod = match[1].trim();
      const importedItems = match[2].split(',').map((s) => s.trim().split(/\s+as\s+/)[0].trim());
      imports.add(mod);
      for (const item of importedItems) {
        if (item && item !== '*') {
          imports.add(mod === '.' ? `.${item}` : `${mod}.${item}`);
        }
      }
    }

    const importRegex = /^\s*import\s+([^\n#]+)/gm;
    while ((match = importRegex.exec(cleaned)) !== null) {
      const parts = match[1].split(',');
      for (let part of parts) {
        const mod = part.trim().split(/\s+as\s+/)[0].trim();
        if (mod) imports.add(mod);
      }
    }

    // 1. Dynamic runpy: runpy.run_path("Home.py") or runpy.run_module("Home")
    const runpyRegex = /runpy\s*\.\s*run_(?:path|module)\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = runpyRegex.exec(cleaned)) !== null) {
      imports.add(match[1].trim());
    }

    // 2. Streamlit multi-page routing: st.switch_page("pages/1_Upload.py"), st.Page("pages/1_Upload.py")
    const stPageRegex = /st\s*\.\s*(?:switch_page|Page)\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = stPageRegex.exec(cleaned)) !== null) {
      imports.add(match[1].trim());
    }

    // 3. Dynamic importlib / __import__
    const dynImportRegex = /(?:importlib\s*\.\s*import_module|__import__)\s*\(\s*['"]([^'"]+)['"]/g;
    while ((match = dynImportRegex.exec(cleaned)) !== null) {
      imports.add(match[1].trim());
    }

    // 4. Subprocess / CLI script launches: ["streamlit", "run", "Home.py"] or streamlit run Home.py
    const subpRegex = /(?:streamlit\s+run\s+['"]?([^\s'"]+\.py)|['"](?:streamlit)['"]\s*,\s*['"]run['"]\s*,\s*['"]([^'"]+)['"])/g;
    while ((match = subpRegex.exec(cleaned)) !== null) {
      const target = match[1] || match[2];
      if (target) imports.add(target.trim());
    }
  } else {
    const esRegex = /(?:import|export)\s+(?:[\s\S]*?\s+from\s+)?['"]([^'"]+)['"]/g;
    let match;
    while ((match = esRegex.exec(cleaned)) !== null) {
      imports.add(match[1]);
    }

    const cjsRegex = /(?:require|import)\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = cjsRegex.exec(cleaned)) !== null) {
      imports.add(match[1]);
    }

    // HTTP API Calls to Backend (e.g. fetch("http://localhost:8000/chat") or axios.post("http://localhost:8000/..."))
    const httpFetchRegex = /(?:fetch|axios(?:\.(?:get|post|put|delete|patch))?)\s*\(\s*[`'"](https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/[^\s`'"]*)?|(?:\/api\/[^\s`'"]*))[`'"]/g;
    let apiMatch;
    while ((apiMatch = httpFetchRegex.exec(cleaned)) !== null) {
      imports.add(`__HTTP_API__:${apiMatch[1]}`);
    }

    // Next.js Link / router navigation (e.g. <Link href="/email"> or router.push('/email'))
    const linkRegex = /(?:<Link[^>]+href=["'](\/[^"']*)["']|router\.(?:push|replace)\s*\(\s*["'](\/[^"']*)["']\))/g;
    let linkMatch;
    while ((linkMatch = linkRegex.exec(cleaned)) !== null) {
      const routePath = linkMatch[1] || linkMatch[2];
      if (routePath && routePath !== '/') {
        imports.add(`__NEXT_ROUTE__:${routePath}`);
      }
    }
  }

  return Array.from(imports);
}

export function findEnclosingPkgDir(file, rootDir) {
  let cur = path.dirname(file);
  while (cur.length >= rootDir.length) {
    if (
      fs.existsSync(path.join(cur, 'package.json')) ||
      fs.existsSync(path.join(cur, 'tsconfig.json')) ||
      fs.existsSync(path.join(cur, 'next.config.js')) ||
      fs.existsSync(path.join(cur, 'next.config.ts')) ||
      fs.existsSync(path.join(cur, 'next.config.mjs'))
    ) {
      return cur;
    }
    const parent = path.dirname(cur);
    if (parent === cur) break;
    cur = parent;
  }
  return rootDir;
}

export function resolveImportPath(sourceFile, rawImport, allFilesSet, rootDir, pkgNameToDir, backendServers = []) {
  const ext = path.extname(sourceFile).toLowerCase();
  const sourceDir = path.dirname(sourceFile);

  // 1. Full-Stack API Call Bridge (e.g. fetch("http://localhost:8000/chat"))
  if (rawImport.startsWith('__HTTP_API__:')) {
    const url = rawImport.slice('__HTTP_API__:'.length);
    const portMatch = url.match(/:(\d+)/);
    const callPort = portMatch ? parseInt(portMatch[1], 10) : 8000;
    if (backendServers && backendServers.length > 0) {
      const matchServer = backendServers.find((s) => s.port === callPort) || backendServers[0];
      if (matchServer) return matchServer.absPath;
    }
    return null;
  }

  // 2. Next.js Route Navigation (e.g. <Link href="/email"> -> src/app/email/page.tsx)
  if (rawImport.startsWith('__NEXT_ROUTE__:')) {
    const route = rawImport.slice('__NEXT_ROUTE__:'.length).replace(/^\//, ''); // e.g. "email"
    const pkgRoot = findEnclosingPkgDir(sourceFile, rootDir);
    for (const cand of [
      path.join(pkgRoot, 'src', 'app', route, 'page.tsx'),
      path.join(pkgRoot, 'src', 'app', route, 'page.jsx'),
      path.join(pkgRoot, 'app', route, 'page.tsx'),
      path.join(pkgRoot, 'app', route, 'page.jsx'),
      path.join(pkgRoot, 'src', 'pages', `${route}.tsx`),
      path.join(pkgRoot, 'pages', `${route}.tsx`),
      path.join(rootDir, 'src', 'app', route, 'page.tsx'),
      path.join(rootDir, 'app', route, 'page.tsx')
    ]) {
      if (allFilesSet.has(cand)) return cand;
    }
    return null;
  }

  if (ext === '.py') {
    // Direct file path with .py extension (e.g. from runpy.run_path("Home.py") or st.Page("pages/1_Upload.py"))
    if (rawImport.endsWith('.py') || rawImport.includes('/') || rawImport.includes('\\')) {
      const directLocal = path.resolve(sourceDir, rawImport);
      const directRoot = path.resolve(rootDir, rawImport);
      if (allFilesSet.has(directLocal)) return directLocal;
      if (allFilesSet.has(directRoot)) return directRoot;
      if (allFilesSet.has(`${directLocal}.py`)) return `${directLocal}.py`;
      if (allFilesSet.has(`${directRoot}.py`)) return `${directRoot}.py`;
    }

    let targetBase;
    if (rawImport.startsWith('.')) {
      const leadingDots = rawImport.match(/^\.+/)[0].length;
      const remainder = rawImport.slice(leadingDots).replace(/\./g, '/');
      let upDir = sourceDir;
      for (let i = 1; i < leadingDots; i++) {
        upDir = path.dirname(upDir);
      }
      targetBase = path.resolve(upDir, remainder);
    } else {
      const relPath = rawImport.replace(/\./g, '/');
      const localCandidate = path.resolve(sourceDir, relPath);
      const rootCandidate = path.resolve(rootDir, relPath);
      const srcCandidate = path.resolve(rootDir, 'src', relPath);

      for (const cand of [localCandidate, rootCandidate, srcCandidate]) {
        if (allFilesSet.has(`${cand}.py`)) return `${cand}.py`;
        if (allFilesSet.has(path.join(cand, '__init__.py'))) return path.join(cand, '__init__.py');
        if (allFilesSet.has(cand)) return cand;
      }
      return null;
    }

    if (allFilesSet.has(`${targetBase}.py`)) return `${targetBase}.py`;
    if (allFilesSet.has(path.join(targetBase, '__init__.py'))) return path.join(targetBase, '__init__.py');
    if (allFilesSet.has(targetBase)) return targetBase;
    return null;
  } else {
    // Monorepo package alias resolution (e.g. `@acme/shared` or `client`)
    if (pkgNameToDir && pkgNameToDir.size > 0) {
      for (const [pkgName, pkgDir] of pkgNameToDir.entries()) {
        if (rawImport === pkgName) {
          const probed =
            probeJsExtensions(path.join(pkgDir, 'index'), allFilesSet) ||
            probeJsExtensions(path.join(pkgDir, 'src', 'index'), allFilesSet) ||
            probeJsExtensions(pkgDir, allFilesSet);
          if (probed) return probed;
        } else if (rawImport.startsWith(pkgName + '/')) {
          const subPath = rawImport.slice(pkgName.length + 1);
          const cand = path.resolve(pkgDir, subPath);
          const srcCand = path.resolve(pkgDir, 'src', subPath);
          const probed = probeJsExtensions(cand, allFilesSet) || probeJsExtensions(srcCand, allFilesSet);
          if (probed) return probed;
        }
      }
    }

    let candidateBase = null;

    if (rawImport.startsWith('.')) {
      candidateBase = path.resolve(sourceDir, rawImport);
    } else if (rawImport.startsWith('@/') || rawImport.startsWith('~/')) {
      const stripped = rawImport.slice(2);
      const pkgRoot = findEnclosingPkgDir(sourceFile, rootDir);
      const candidates = [
        path.resolve(pkgRoot, 'src', stripped),
        path.resolve(pkgRoot, stripped),
        path.resolve(rootDir, 'src', stripped),
        path.resolve(rootDir, stripped)
      ];
      for (const cand of candidates) {
        const probed = probeJsExtensions(cand, allFilesSet);
        if (probed) return probed;
      }
      return null;
    } else if (rawImport.startsWith('/')) {
      candidateBase = path.resolve(rootDir, rawImport.slice(1));
    } else {
      const rootCand = path.resolve(rootDir, rawImport);
      const srcCand = path.resolve(rootDir, 'src', rawImport);
      if (probeJsExtensions(rootCand, allFilesSet)) return probeJsExtensions(rootCand, allFilesSet);
      if (probeJsExtensions(srcCand, allFilesSet)) return probeJsExtensions(srcCand, allFilesSet);
      return null;
    }

    return probeJsExtensions(candidateBase, allFilesSet);
  }
}

export function probeJsExtensions(basePath, allFilesSet) {
  if (!basePath) return null;
  if (allFilesSet.has(basePath)) return basePath;

  const jsExts = ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'];
  if (basePath.endsWith('.js')) {
    const withoutJs = basePath.slice(0, -3);
    for (const e of ['.ts', '.tsx', '.jsx']) {
      if (allFilesSet.has(withoutJs + e)) return withoutJs + e;
    }
  }

  for (const e of jsExts) {
    if (allFilesSet.has(basePath + e)) return basePath + e;
  }
  for (const e of jsExts) {
    const idx = path.join(basePath, `index${e}`);
    if (allFilesSet.has(idx)) return idx;
  }
  return null;
}

// ============================================================================
// 5. CIRCULAR DEPENDENCY CYCLE DETECTION (DFS / TARJAN'S SCC)
// ============================================================================
export function detectCycles(nodes, edges) {
  const adj = new Map();
  nodes.forEach((n) => adj.set(n.id, []));
  edges.forEach((e) => {
    if (adj.has(e.source)) adj.get(e.source).push(e.target);
  });

  const cycles = [];
  const cycleEdgeKeys = new Set();
  const cycleNodeIds = new Set();
  const visited = new Map(); // id -> 0: unvisited, 1: visiting, 2: visited
  const stack = [];
  const MAX_CYCLES = 50;

  function dfs(u) {
    if (cycles.length >= MAX_CYCLES) return;
    visited.set(u, 1);
    stack.push(u);

    const neighbors = adj.get(u) || [];
    for (const v of neighbors) {
      if (cycles.length >= MAX_CYCLES) break;
      const state = visited.get(v) || 0;
      if (state === 1) {
        // Cycle detected
        const idx = stack.indexOf(v);
        if (idx !== -1) {
          const cyclePath = stack.slice(idx);
          cyclePath.push(v); // close the loop
          cycles.push(cyclePath);

          for (let i = 0; i < cyclePath.length - 1; i++) {
            const from = cyclePath[i];
            const to = cyclePath[i + 1];
            cycleNodeIds.add(from);
            cycleNodeIds.add(to);
            cycleEdgeKeys.add(`${from}-->${to}`);
          }
        }
      } else if (state === 0) {
        dfs(v);
      }
    }

    stack.pop();
    visited.set(u, 2);
  }

  for (const node of nodes) {
    if ((visited.get(node.id) || 0) === 0) {
      dfs(node.id);
    }
  }

  return {
    cycles: cycles.map((path, idx) => ({ id: idx + 1, path, length: path.length - 1 })),
    cycleNodeIds,
    cycleEdgeKeys
  };
}

// ============================================================================
// 6. GRAPH CONSTRUCTION & METRICS
// ============================================================================
export function buildDependencyGraph(rootDir) {
  const startTime = Date.now();
  const { files: absFiles, packages, pkgNameToDir } = discoverWorkspace(rootDir);
  const allFilesSet = new Set(absFiles);

  const nodesMap = new Map();
  const edges = [];

  // Initialize nodes
  for (const absPath of absFiles) {
    const relPath = path.relative(rootDir, absPath).replace(/\\/g, '/');
    let statSize = 0;
    let content = '';
    try {
      statSize = fs.statSync(absPath).size;
      content = fs.readFileSync(absPath, 'utf8');
    } catch (e) {
      continue;
    }

    const lines = content.split('\n').length;
    const ext = path.extname(absPath).toLowerCase();
    const tier = classifyTier(relPath);
    const folder = path.dirname(relPath).replace(/\\/g, '/');
    const depth = relPath.split('/').length - 1;
    const clusterGroup = computeClusterGroup(relPath, packages);

    // Check if node belongs to a sub-package
    let nodePkg = null;
    for (const pkg of packages) {
      if (pkg.relDir !== '(root)' && relPath.startsWith(pkg.relDir + '/')) {
        nodePkg = pkg.name;
        break;
      }
    }

    nodesMap.set(absPath, {
      id: relPath,
      name: path.basename(relPath),
      path: relPath,
      folder: folder === '.' ? '(root)' : folder,
      depth,
      clusterGroup,
      package: nodePkg,
      tier,
      ext: ext.replace('.', ''),
      size: statSize,
      lines,
      inDegree: 0,
      outDegree: 0,
      weight: 1,
      hasCycle: false,
      isOrphan: false,
      _content: content
    });
  }

  // Index backend server files (e.g. FastAPI / Express / Flask servers)
  const backendServers = [];
  for (const [absPath, node] of nodesMap.entries()) {
    const c = node._content;
    if (
      c &&
      (c.includes('FastAPI(') ||
        c.includes('Flask(') ||
        c.includes('express()') ||
        c.includes('uvicorn.run') ||
        c.includes('createServer('))
    ) {
      const portMatch = c.match(/(?:port\s*=\s*|listen\s*\(\s*)(\d+)/);
      const port = portMatch ? parseInt(portMatch[1], 10) : 8000;
      backendServers.push({ absPath, port, node });
    }
  }

  // Extract edges
  const edgeDedup = new Set();
  for (const [absPath, node] of nodesMap.entries()) {
    const ext = path.extname(absPath).toLowerCase();
    const rawImports = extractRawImports(node._content, ext);

    for (const rawImp of rawImports) {
      const resolvedAbs = resolveImportPath(absPath, rawImp, allFilesSet, rootDir, pkgNameToDir, backendServers);
      if (resolvedAbs && nodesMap.has(resolvedAbs) && resolvedAbs !== absPath) {
        const targetNode = nodesMap.get(resolvedAbs);
        const edgeKey = `${node.id}-->${targetNode.id}`;
        if (!edgeDedup.has(edgeKey)) {
          edgeDedup.add(edgeKey);
          edges.push({
            source: node.id,
            target: targetNode.id,
            isCycle: false
          });
          node.outDegree++;
          targetNode.inDegree++;
        }
      }
    }
    delete node._content; // Free memory
  }

  const nodes = Array.from(nodesMap.values());

  // Cycle detection
  const { cycles, cycleNodeIds, cycleEdgeKeys } = detectCycles(nodes, edges);
  for (const node of nodes) {
    if (cycleNodeIds.has(node.id)) {
      node.hasCycle = true;
    }
  }
  for (const edge of edges) {
    if (cycleEdgeKeys.has(`${edge.source}-->${edge.target}`)) {
      edge.isCycle = true;
    }
  }

  // Streamlit Multi-Page Framework Navigation Discovery
  const streamlitRootCandidate = nodes.find(
    (n) => n.tier === 'entry' && /^(home|app|streamlit_app)\.py$/i.test(path.basename(n.path))
  );
  if (streamlitRootCandidate) {
    for (const node of nodes) {
      if (node.id !== streamlitRootCandidate.id && /(?:^|\/)pages\/.+\.py$/i.test(node.path)) {
        const edgeKey = `${streamlitRootCandidate.id}-->${node.id}`;
        if (!edgeDedup.has(edgeKey)) {
          edgeDedup.add(edgeKey);
          edges.push({
            source: streamlitRootCandidate.id,
            target: node.id,
            isCycle: false
          });
          streamlitRootCandidate.outDegree++;
          node.inDegree++;
        }
      }
    }
  }

  // Next.js Root Layout -> Root Page automatic linkage
  for (const node of nodes) {
    if (/(?:^|\/)(?:src\/)?app\/layout\.(js|jsx|ts|tsx)$/i.test(node.path)) {
      const pageCandidate = node.path.replace(/layout\.(js|jsx|ts|tsx)$/i, 'page.$1');
      const pageNode = nodes.find((n) => n.path === pageCandidate);
      if (pageNode) {
        const edgeKey = `${node.id}-->${pageNode.id}`;
        if (!edgeDedup.has(edgeKey)) {
          edgeDedup.add(edgeKey);
          edges.push({
            source: node.id,
            target: pageNode.id,
            isCycle: false
          });
          node.outDegree++;
          pageNode.inDegree++;
        }
      }
    }
  }

  // Dead code / Orphan detection:
  // Entry points, framework route pages, and root layout shells are root web targets, not dead-code orphans
  for (const node of nodes) {
    const isRootTarget =
      node.tier === 'entry' ||
      node.tier === 'routes' ||
      /(?:^|\/)(?:src\/)?app\/layout\.(js|jsx|ts|tsx)$/i.test(node.path);
    node.isOrphan = node.inDegree === 0 && !isRootTarget;
  }
  const totalOrphans = nodes.filter((n) => n.isOrphan).length;

  // Relative weights & ensure entry star exists
  let hasEntry = nodes.some((n) => n.tier === 'entry');
  if (!hasEntry && nodes.length > 0) {
    const sorted = [...nodes].sort((a, b) => b.outDegree + b.inDegree - (a.outDegree + a.inDegree));
    sorted[0].tier = 'entry';
  }

  const maxDegree = Math.max(1, ...nodes.map((n) => n.inDegree + n.outDegree));
  for (const node of nodes) {
    const totalDeg = node.inDegree + node.outDegree;
    node.weight = Number((1 + (totalDeg / maxDegree) * 4).toFixed(2));
  }

  // Clusters Summary Generation for 3D Hierarchical Hubs
  const clustersMap = new Map();
  for (const node of nodes) {
    const cg = node.clusterGroup || '(root)';
    if (!clustersMap.has(cg)) {
      clustersMap.set(cg, {
        id: cg,
        name: path.basename(cg) || cg,
        path: cg,
        fileCount: 0,
        tierCounts: { entry: 0, routes: 0, components: 0, services: 0, utils: 0 },
        hasCycles: false,
        orphanCount: 0,
        nodeIds: []
      });
    }
    const c = clustersMap.get(cg);
    c.fileCount++;
    c.nodeIds.push(node.id);
    c.tierCounts[node.tier] = (c.tierCounts[node.tier] || 0) + 1;
    if (node.hasCycle) c.hasCycles = true;
    if (node.isOrphan) c.orphanCount++;
  }
  const clusters = Array.from(clustersMap.values());

  // Complexity score
  const nCount = Math.max(1, nodes.length);
  const eCount = edges.length;
  const density = eCount / nCount;
  const complexityScore = Math.min(100, Math.round(density * 18 + Math.log10(nCount + 1) * 15));

  const elapsedMs = Date.now() - startTime;

  return {
    projectName: path.basename(rootDir),
    rootDir,
    scannedAt: new Date().toISOString(),
    elapsedMs,
    packages,
    metrics: {
      totalFiles: nodes.length,
      totalDependencies: edges.length,
      totalClusters: clusters.length,
      totalCycles: cycles.length,
      totalOrphans,
      complexityScore,
      density: Number(density.toFixed(2))
    },
    clusters,
    cycles,
    nodes,
    edges
  };
}
