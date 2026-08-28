import chalk from 'chalk';

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
  thinking: `( ⚙️_⚙️ )`,
  success: `( 🟢_🟢 )`,
  searching: `( 🔍_🔍 )`,
  stats: `( 📊_📊 )`,
  standup: `( 🚀_🚀 )`,
};

// Render Box Banner for Header
export function printHeader(subTitle = 'Autonomous Project Memory & Work Graph') {
  const line = '━'.repeat(54);
  console.log(BRAND.yellowBold(`\n╭${line}╮`));
  console.log(
    BRAND.yellowBold(`│ `) +
    BRAND.badge('ZAARVY') +
    `  ${MASCOT.idle}  ` +
    chalk.bold.white('REMI CLI') +
    `  ` +
    BRAND.gray(`v1.0.0`) +
    ` `.repeat(13) +
    BRAND.yellowBold(`│`)
  );
  console.log(
    BRAND.yellowBold(`│ `) +
    BRAND.dim(subTitle.padEnd(52)) +
    BRAND.yellowBold(`│`)
  );
  console.log(BRAND.yellowBold(`╰${line}╯\n`));
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
