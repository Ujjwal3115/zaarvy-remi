import fs from 'fs';
import chalk from 'chalk';
import readline from 'readline';

// Zaarvy Official Brand Palette
export const BRAND = {
  yellow: chalk.hex('#D0D02D'),
  yellowBold: chalk.hex('#D0D02D').bold,
  cyan: chalk.cyan,
  gray: chalk.gray,
  white: chalk.white.bold,
  dim: chalk.dim,
  badge: (text) => chalk.bgHex('#D0D02D').black.bold(` ${text} `),
  successBadge: (text) => chalk.bgGreen.black.bold(` ${text} `),
  infoBadge: (text) => chalk.bgCyan.black.bold(` ${text} `),
};

// 2D ASCII Mascot - "Zaarvy Bot"
export const MASCOT = {
  idle: `(⚡_⚡)`,
  thinking: `(⚙️_⚙️)`,
  success: `(🟢_🟢)`,
  searching: `(🔍_🔍)`,
  stats: `(📊_📊)`,
  standup: `(🚀_🚀)`,
};

// Animated Mascot Frames for real-time motion
export const ANIMATED_MASCOT_FRAMES = [
  '(⚡_⚡)',
  '(o_o )',
  '( ⚡_⚡)',
  '( -_-)',
  '( ✨_✨)',
  '( ⚙️_⚙️)',
];

export function startMascotSpinner(text = 'Processing...') {
  let frameIdx = 0;

  if (process.stdout.isTTY) {
    process.stdout.write('\x1B[?25l'); // Hide cursor
  }

  const timer = setInterval(() => {
    const frame = ANIMATED_MASCOT_FRAMES[frameIdx % ANIMATED_MASCOT_FRAMES.length];
    frameIdx++;

    if (process.stdout.isTTY) {
      readline.clearLine(process.stdout, 0);
      readline.cursorTo(process.stdout, 0);
      process.stdout.write(`${BRAND.yellowBold(frame)}  ${BRAND.badge('ZAARVY')}  ${chalk.white(text)}`);
    } else if (frameIdx === 1) {
      console.log(`${MASCOT.thinking} ${text}`);
    }
  }, 130);

  return {
    stop: (finalMessage, success = true) => {
      clearInterval(timer);
      if (process.stdout.isTTY) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write('\x1B[?25h'); // Restore cursor
      }
      if (finalMessage) {
        if (success) {
          printSuccess(finalMessage);
        } else {
          console.error(`\n${MASCOT.idle} ${chalk.red(finalMessage)}`);
        }
      }
    }
  };
}

// Render 3D Block-Art Logo Header with Retro Pixel Mascot on the Right
export function printHeader(subTitle = 'Autonomous Project Memory & Work Graph') {
  const lime = BRAND.yellowBold;
  const dim = BRAND.dim;

  const remi = [
    '██████╗ ███████╗███╗   ███╗██╗',
    '██╔══██╗██╔════╝████╗ ████║██║',
    '██████╔╝█████╗  ██╔████╔██║██║',
    '██╔══██╗██╔══╝  ██║╚██╔╝██║██║',
    '██║  ██║███████╗██║ ╚═╝ ██║██║',
    '╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝╚═╝',
    '                              ',
    '                              '
  ];

  const mascot = [
    '  ██              ██',
    '  ██    ██████    ██',
    '  ██████████████████',
    '  ████  ██████  ████',
    '  ██████████████████',
    '    ██████████████  ',
    '    ██          ██  ',
    '    ██          ██  '
  ];

  console.log('');
  for (let i = 0; i < 8; i++) {
    console.log(lime(remi[i] + '    ' + mascot[i]));
  }

  let version = '1.0.1';
  try {
    const pkgPath = new URL('../../package.json', import.meta.url);
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    version = pkg.version;
  } catch (e) {}

  console.log(`\n  ` + BRAND.badge(`v${version}`) + ` ` + chalk.bold.white('REMI CLI') + dim(` • ${subTitle}`));
  console.log(dim(`  A Zaarvy Ecosystem Package\n`));
}

// Banner for specific command titles
export function printCommandBanner(title, mascotState = MASCOT.idle) {
  const titleStr = `${mascotState}  ${title.toUpperCase()}`;
  const width = Math.max(50, titleStr.length + 8);
  const border = '═'.repeat(width);

  console.log(BRAND.yellowBold(`\n╔${border}╗`));
  console.log(BRAND.yellowBold(`║   ${titleStr.padEnd(width - 3)}║`));
  console.log(BRAND.yellowBold(`╚${border}╝\n`));
}

// Styled Success message
export function printSuccess(message) {
  console.log(`${MASCOT.success} ${BRAND.successBadge('SUCCESS')} ${chalk.green(message)}`);
}

// Styled Info message
export function printInfo(label, message) {
  console.log(`${MASCOT.idle} ${BRAND.infoBadge(label)} ${chalk.white(message)}`);
}
