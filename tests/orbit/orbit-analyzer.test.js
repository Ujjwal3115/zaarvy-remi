import fs from 'fs';
import path from 'path';
import os from 'os';
import {
  classifyTier,
  extractRawImports,
  detectCycles,
  probeJsExtensions,
  buildDependencyGraph
} from '../../src/orbit/analyzer.js';

describe('REMI Orbit Architecture & Dependency Analyzer', () => {
  let tmpRoot;

  beforeAll(() => {
    tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'remi-orbit-fixtures-'));
  });

  afterAll(() => {
    try {
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    } catch (e) {}
  });

  // ==========================================================================
  // Unit Level: Tier Classifier
  // ==========================================================================
  describe('Architectural Tier Classifier', () => {
    test('classifies root web targets and standard entry points as entry', () => {
      expect(classifyTier('src/app/page.tsx')).toBe('entry');
      expect(classifyTier('pages/index.tsx')).toBe('entry');
      expect(classifyTier('app.py')).toBe('entry');
      expect(classifyTier('Home.py')).toBe('entry');
      expect(classifyTier('main.py')).toBe('entry');
      expect(classifyTier('server.js')).toBe('entry');
    });

    test('classifies subpages, API routes, and controllers as routes', () => {
      expect(classifyTier('src/app/dashboard/page.tsx')).toBe('routes');
      expect(classifyTier('app/api/auth/route.ts')).toBe('routes');
      expect(classifyTier('pages/1_Upload.py')).toBe('routes');
      expect(classifyTier('src/controllers/userController.js')).toBe('routes');
    });

    test('classifies components and UI views as components', () => {
      expect(classifyTier('src/components/Sidebar.tsx')).toBe('components');
      expect(classifyTier('src/ui/Button.jsx')).toBe('components');
      expect(classifyTier('src/templates/dashboard.html')).toBe('components');
    });

    test('classifies utils, models, schemas, and config as utils', () => {
      expect(classifyTier('src/utils/helpers.ts')).toBe('utils');
      expect(classifyTier('src/db/schema.sql')).toBe('utils');
      expect(classifyTier('src/models/User.py')).toBe('utils');
      expect(classifyTier('src/config/setup.js')).toBe('utils');
    });

    test('defaults business logic to services', () => {
      expect(classifyTier('src/services/paymentService.ts')).toBe('services');
      expect(classifyTier('src/processing/worker.js')).toBe('services');
    });
  });

  // ==========================================================================
  // Unit Level: Import Extractors (JS/TS, Python, HTTP Bridge, Next.js Link)
  // ==========================================================================
  describe('Import Extraction Engine', () => {
    test('extracts ES and CJS imports in JavaScript/TypeScript', () => {
      const code = `
        import React from 'react';
        import { Button } from '@/components/Button';
        export * from './helpers';
        const config = require('./config');
      `;
      const imports = extractRawImports(code, '.ts');
      expect(imports).toContain('react');
      expect(imports).toContain('@/components/Button');
      expect(imports).toContain('./helpers');
      expect(imports).toContain('./config');
    });

    test('extracts HTTP API Bridge calls to local backend', () => {
      const code = `
        async function fetchChat() {
          const res = await fetch("http://localhost:8000/api/chat");
          return axios.post("http://127.0.0.1:5000/predict", { data });
        }
      `;
      const imports = extractRawImports(code, '.tsx');
      expect(imports).toContain('__HTTP_API__:http://localhost:8000/api/chat');
      expect(imports).toContain('__HTTP_API__:http://127.0.0.1:5000/predict');
    });

    test('extracts Next.js Link and client navigation routes', () => {
      const code = `
        export default function Nav() {
          return (
            <div>
              <Link href="/dashboard">Dashboard</Link>
              <button onClick={() => router.push('/settings')}>Settings</button>
            </div>
          );
        }
      `;
      const imports = extractRawImports(code, '.tsx');
      expect(imports).toContain('__NEXT_ROUTE__:/dashboard');
      expect(imports).toContain('__NEXT_ROUTE__:/settings');
    });

    test('extracts Python static and dynamic imports (runpy, st.switch_page)', () => {
      const pyCode = `
        from services.auth import verify_token
        import numpy as np
        runpy.run_path("Home.py")
        st.switch_page("pages/1_Upload.py")
      `;
      const imports = extractRawImports(pyCode, '.py');
      expect(imports).toContain('services.auth');
      expect(imports).toContain('numpy');
      expect(imports).toContain('Home.py');
      expect(imports).toContain('pages/1_Upload.py');
    });
  });

  // ==========================================================================
  // Invariant 1: Next.js App Router & @/ Subproject Path Resolution
  // ==========================================================================
  test('Invariant 1: Next.js App Router connects layout -> page and resolves subproject @/* alias', () => {
    const fixtureDir = path.join(tmpRoot, '01-nextjs');
    fs.mkdirSync(path.join(fixtureDir, 'src', 'app', 'dashboard'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'src', 'components'), { recursive: true });

    fs.writeFileSync(
      path.join(fixtureDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { paths: { '@/*': ['./src/*'] } } })
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'src', 'components', 'Sidebar.tsx'),
      `export default function Sidebar() { return <aside>Sidebar</aside>; }`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'src', 'app', 'layout.tsx'),
      `export default function RootLayout({ children }) { return <html>{children}</html>; }`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'src', 'app', 'page.tsx'),
      `import Sidebar from '@/components/Sidebar';\nexport default function Home() { return <Sidebar />; }`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'src', 'app', 'dashboard', 'page.tsx'),
      `import Sidebar from '@/components/Sidebar';\nexport default function Dashboard() { return <Sidebar />; }`
    );

    const graph = buildDependencyGraph(fixtureDir);
    expect(graph.metrics.totalFiles).toBe(4);

    // Root page is entry
    const rootPage = graph.nodes.find((n) => n.path === 'src/app/page.tsx');
    expect(rootPage).toBeDefined();
    expect(rootPage.tier).toBe('entry');

    // Dashboard page is routes
    const dashPage = graph.nodes.find((n) => n.path === 'src/app/dashboard/page.tsx');
    expect(dashPage).toBeDefined();
    expect(dashPage.tier).toBe('routes');

    // Layout links to page
    const layoutNode = graph.nodes.find((n) => n.path === 'src/app/layout.tsx');
    expect(layoutNode).toBeDefined();
    const layoutEdge = graph.edges.find((e) => e.source === layoutNode.id && e.target === rootPage.id);
    expect(layoutEdge).toBeDefined();

    // Sidebar has inDegree > 0 (no false orphan)
    const sidebar = graph.nodes.find((n) => n.path === 'src/components/Sidebar.tsx');
    expect(sidebar).toBeDefined();
    expect(sidebar.inDegree).toBeGreaterThan(0);
    expect(sidebar.isOrphan).toBe(false);
  });

  // ==========================================================================
  // Invariant 2: Streamlit Multi-Page Suites & Dynamic Execution
  // ==========================================================================
  test('Invariant 2: Streamlit Home.py entry links to pages/*.py without false orphans', () => {
    const fixtureDir = path.join(tmpRoot, '02-streamlit');
    fs.mkdirSync(path.join(fixtureDir, 'pages'), { recursive: true });

    fs.writeFileSync(
      path.join(fixtureDir, 'app.py'),
      `import runpy\nrunpy.run_path("Home.py")`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'Home.py'),
      `import streamlit as st\nst.write("Home")\nst.switch_page("pages/1_Upload.py")`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'pages', '1_Upload.py'),
      `import streamlit as st\nst.write("Upload")`
    );

    const graph = buildDependencyGraph(fixtureDir);
    const homeNode = graph.nodes.find((n) => n.path === 'Home.py');
    expect(homeNode).toBeDefined();
    expect(homeNode.tier).toBe('entry');
    expect(homeNode.inDegree).toBeGreaterThan(0); // Called by app.py

    const uploadPage = graph.nodes.find((n) => n.path === 'pages/1_Upload.py');
    expect(uploadPage).toBeDefined();
    expect(uploadPage.tier).toBe('routes');
    expect(uploadPage.isOrphan).toBe(false);
  });

  // ==========================================================================
  // Invariant 3: Full-Stack HTTP API Bridge (Frontend ➔ Backend)
  // ==========================================================================
  test('Invariant 3: Frontend fetch() bridges across network boundaries to backend server', () => {
    const fixtureDir = path.join(tmpRoot, '03-fullstack');
    fs.mkdirSync(path.join(fixtureDir, 'frontend', 'src'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'backend'), { recursive: true });

    fs.writeFileSync(
      path.join(fixtureDir, 'backend', 'main.py'),
      `from fastapi import FastAPI\napp = FastAPI()\n# port = 8000\n@app.get("/chat")\ndef chat(): return {"msg": "ok"}`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'frontend', 'src', 'App.tsx'),
      `export default function App() {\n  fetch("http://localhost:8000/chat");\n  return <div>App</div>;\n}`
    );

    const graph = buildDependencyGraph(fixtureDir);
    const frontendNode = graph.nodes.find((n) => n.path.includes('App.tsx'));
    const backendNode = graph.nodes.find((n) => n.path.includes('main.py'));

    expect(frontendNode).toBeDefined();
    expect(backendNode).toBeDefined();

    const bridgeEdge = graph.edges.find((e) => e.source === frontendNode.id && e.target === backendNode.id);
    expect(bridgeEdge).toBeDefined();
  });

  // ==========================================================================
  // Invariant 4: Monorepo Package Linking (@acme/shared)
  // ==========================================================================
  test('Invariant 4: Monorepo workspace package aliases resolve across subprojects', () => {
    const fixtureDir = path.join(tmpRoot, '04-monorepo');
    fs.mkdirSync(path.join(fixtureDir, 'packages', 'shared', 'src'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'packages', 'client', 'src'), { recursive: true });

    fs.writeFileSync(
      path.join(fixtureDir, 'packages', 'shared', 'package.json'),
      JSON.stringify({ name: '@acme/shared', main: 'src/index.ts' })
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'packages', 'shared', 'src', 'index.ts'),
      `export const API_URL = "https://api.example.com";`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'packages', 'client', 'package.json'),
      JSON.stringify({ name: '@acme/client', main: 'src/index.ts' })
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'packages', 'client', 'src', 'index.ts'),
      `import { API_URL } from '@acme/shared';\nconsole.log(API_URL);`
    );

    const graph = buildDependencyGraph(fixtureDir);
    const clientNode = graph.nodes.find((n) => n.path === 'packages/client/src/index.ts');
    const sharedNode = graph.nodes.find((n) => n.path === 'packages/shared/src/index.ts');

    expect(clientNode).toBeDefined();
    expect(sharedNode).toBeDefined();

    const crossPkgEdge = graph.edges.find((e) => e.source === clientNode.id && e.target === sharedNode.id);
    expect(crossPkgEdge).toBeDefined();
  });

  // ==========================================================================
  // Invariant 5: Circular Dependency Cycle Detection (A ➔ B ➔ C ➔ A)
  // ==========================================================================
  test('Invariant 5: Detects 3-node circular dependency loop and tags nodes and edges', () => {
    const fixtureDir = path.join(tmpRoot, '05-circular');
    fs.mkdirSync(fixtureDir, { recursive: true });

    fs.writeFileSync(path.join(fixtureDir, 'modA.js'), `import './modB.js';`);
    fs.writeFileSync(path.join(fixtureDir, 'modB.js'), `import './modC.js';`);
    fs.writeFileSync(path.join(fixtureDir, 'modC.js'), `import './modA.js';`);

    const graph = buildDependencyGraph(fixtureDir);
    expect(graph.metrics.totalCycles).toBeGreaterThanOrEqual(1);

    const nodeA = graph.nodes.find((n) => n.path === 'modA.js');
    const nodeB = graph.nodes.find((n) => n.path === 'modB.js');
    const nodeC = graph.nodes.find((n) => n.path === 'modC.js');

    expect(nodeA.hasCycle).toBe(true);
    expect(nodeB.hasCycle).toBe(true);
    expect(nodeC.hasCycle).toBe(true);
  });

  // ==========================================================================
  // Invariant 6: Barrel Re-exports & Type-Only Imports
  // ==========================================================================
  test('Invariant 6: Resolves barrel re-exports and type-only imports cleanly', () => {
    const fixtureDir = path.join(tmpRoot, '06-barrels');
    fs.mkdirSync(path.join(fixtureDir, 'types'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'components'), { recursive: true });

    fs.writeFileSync(path.join(fixtureDir, 'types', 'user.ts'), `export interface User { id: string; }`);
    fs.writeFileSync(
      path.join(fixtureDir, 'components', 'Button.tsx'),
      `export function Button() { return <button />; }`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'components', 'index.ts'),
      `export * from './Button';`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'main.ts'),
      `import { Button } from './components';\nimport type { User } from './types/user';`
    );

    const graph = buildDependencyGraph(fixtureDir);
    expect(graph.metrics.totalFiles).toBe(4);

    const mainNode = graph.nodes.find((n) => n.path === 'main.ts');
    const barrelNode = graph.nodes.find((n) => n.path === 'components/index.ts');
    const typeNode = graph.nodes.find((n) => n.path === 'types/user.ts');

    expect(mainNode).toBeDefined();
    expect(barrelNode).toBeDefined();
    expect(typeNode).toBeDefined();

    const toBarrelEdge = graph.edges.find((e) => e.source === mainNode.id && e.target === barrelNode.id);
    const toTypeEdge = graph.edges.find((e) => e.source === mainNode.id && e.target === typeNode.id);

    expect(toBarrelEdge).toBeDefined();
    expect(toTypeEdge).toBeDefined();
  });

  // ==========================================================================
  // Invariant 7: Python Multi-Dot Relative Imports
  // ==========================================================================
  test('Invariant 7: Multi-dot Python relative imports resolve across ancestor packages', () => {
    const fixtureDir = path.join(tmpRoot, '07-python');
    fs.mkdirSync(path.join(fixtureDir, 'app', 'services'), { recursive: true });
    fs.mkdirSync(path.join(fixtureDir, 'app', 'api', 'v1'), { recursive: true });

    fs.writeFileSync(
      path.join(fixtureDir, 'app', 'services', 'auth.py'),
      `def authenticate(): return True`
    );
    fs.writeFileSync(
      path.join(fixtureDir, 'app', 'api', 'v1', 'endpoints.py'),
      `from ...services.auth import authenticate\ndef login(): return authenticate()`
    );

    const graph = buildDependencyGraph(fixtureDir);
    const endpointNode = graph.nodes.find((n) => n.path === 'app/api/v1/endpoints.py');
    const authNode = graph.nodes.find((n) => n.path === 'app/services/auth.py');

    expect(endpointNode).toBeDefined();
    expect(authNode).toBeDefined();

    const pyRelEdge = graph.edges.find((e) => e.source === endpointNode.id && e.target === authNode.id);
    expect(pyRelEdge).toBeDefined();
  });
});
