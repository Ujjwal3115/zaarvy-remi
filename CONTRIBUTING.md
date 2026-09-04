# Contributing to REMI

Thank you for your interest in contributing to **REMI: Autonomous Project Memory & Work Graph**!

REMI is an open-source project maintained by [Zaarvy](https://zaarvy.in). We welcome bug reports, feature proposals, documentation improvements, and code contributions from the community.

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free environment for everyone. Please treat all contributors and maintainers with respect.

---

## Development Setup

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v8.0.0 or higher
- **Git**: Installed and configured

### Step 1: Fork and Clone
```bash
git clone https://github.com/<your-username>/zaarvy-remi.git
cd zaarvy-remi
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Link Locally
Link the local package so you can test CLI commands directly in your terminal:
```bash
npm link
```
Now, running `remi` or `zaarvy-remi` anywhere on your machine will run your local development build.

### Step 4: Run the Test Suite
```bash
npm test
```

---

## Code Guidelines & Philosophy

1. **Zero-Emoji Terminal UI:**
   - In adherence to our clean engineering aesthetic, do **not** use emojis in terminal output, logs, banners, or help text.
   - Use clean ASCII tags instead:
     - `[OK]` for success states
     - `[--]` for idle or neutral states
     - `[..]` for active thinking or processing
     - `[>>]` for search or scan states
     - `[##]` for stats and metrics
     - `[^^]` for standup generation
2. **Brand Consistency:**
   - Use the official Zaarvy lime accent color `#D0D02D` for primary brand highlights.
   - Use `src/ui/brand.js` helpers (`BRAND.badge`, `printHeader`, `printSuccess`) instead of ad-hoc formatting.
3. **Cross-Platform Compatibility:**
   - Ensure all features and path operations work seamlessly across Windows, macOS, and Linux.
4. **Local-First Reliability:**
   - Local SQLite (`better-sqlite3`) must always remain the default, reliable offline backend. Remote services (Supabase, LLM APIs) should degrade gracefully when offline.

---

## Submitting a Pull Request (PR)

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
2. Make your changes and add tests where appropriate.
3. Ensure all tests pass:
   ```bash
   npm test
   ```
4. Commit your changes following conventional commit syntax:
   ```bash
   git commit -m "feat(graph): add node clustering filter"
   ```
5. Push to your fork and open a Pull Request against the `main` branch.
6. Provide a concise summary of what your PR introduces and how you verified it.

---

## Need Help?

- Documentation: [zaarvy.in/packages/remi](https://zaarvy.in/packages/remi)
- Issues: [GitHub Issues](https://github.com/Ujjwal3115/zaarvy-remi/issues)
