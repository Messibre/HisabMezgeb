import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import ico from 'sharp-ico';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../public');
const brandDir = path.resolve(publicDir, 'brand');

if (!fs.existsSync(brandDir)) {
  fs.mkdirSync(brandDir, { recursive: true });
}

// 1. Generate Placeholder Logo SVG
const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <circle cx="256" cy="256" r="256" fill="#2e5a27"/>
  <g transform="translate(136, 136) scale(10)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
  </g>
</svg>
`;

fs.writeFileSync(path.join(brandDir, 'logo.svg'), logoSvg, 'utf8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), logoSvg, 'utf8');
console.log('Created brand/logo.svg and favicon.svg');

// 2. Generate Favicon ICO (16x16 and 32x32)
async function generateFaviconIco() {
  const svgBuf = Buffer.from(logoSvg);
  const sharp16 = sharp(svgBuf).resize(16, 16);
  const sharp32 = sharp(svgBuf).resize(32, 32);
  await ico.sharpsToIco([sharp16, sharp32], path.join(publicDir, 'favicon.ico'));
  console.log('Created favicon.ico (16x16, 32x32)');
}

// 3. Helper to generate solid-background icon with logo in central 80% safe zone
// Safe zone: logo diameter <= totalSize * 0.8.
async function generatePwaIcon(totalSize, logoDiameter, outPath) {
  const svgBuf = Buffer.from(logoSvg);
  const resizedLogo = await sharp(svgBuf).resize(logoDiameter, logoDiameter).toBuffer();

  const left = Math.round((totalSize - logoDiameter) / 2);
  const top = Math.round((totalSize - logoDiameter) / 2);

  await sharp({
    create: {
      width: totalSize,
      height: totalSize,
      channels: 4,
      background: { r: 249, g: 249, b: 248, alpha: 1 }, // #f9f9f8 solid
    },
  })
    .composite([
      {
        input: resizedLogo,
        top,
        left,
      },
    ])
    .flatten({ background: '#f9f9f8' })
    .removeAlpha()
    .png()
    .toFile(outPath);
  console.log(`Created ${path.basename(outPath)} (${totalSize}x${totalSize})`);
}

// 4. Generate og-image.png (1200x630)
async function generateOgImage() {
  const ogSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#fdfdfc" />
        <stop offset="100%" stop-color="#f2f4f2" />
      </linearGradient>
    </defs>
    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="8" fill="#2e5a27" />

    <!-- Container Card -->
    <rect x="80" y="70" width="1040" height="490" rx="24" fill="#ffffff" stroke="#c0c9c2" stroke-width="2" />

    <!-- Logo Circle -->
    <g transform="translate(140, 225)">
      <circle cx="90" cy="90" r="90" fill="#2e5a27" />
      <g transform="translate(45, 45) scale(3.75)" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </g>
    </g>

    <!-- App Name and Tagline -->
    <text x="360" y="240" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="64" font-weight="700" fill="#191c19">Hisab Mezgeb</text>
    
    <text x="360" y="310" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="28" font-weight="500" fill="#404943">Simple money and debt tracker for small businesses</text>

    <!-- Feature Pill Tags -->
    <g transform="translate(360, 360)">
      <rect x="0" y="0" width="180" height="44" rx="22" fill="#d2e8cc" />
      <text x="90" y="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#0b1f07" text-anchor="middle">Daily Income</text>

      <rect x="195" y="0" width="160" height="44" rx="22" fill="#d2e8cc" />
      <text x="275" y="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#0b1f07" text-anchor="middle">Expenses</text>

      <rect x="370" y="0" width="220" height="44" rx="22" fill="#d2e8cc" />
      <text x="480" y="28" font-family="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="18" font-weight="600" fill="#0b1f07" text-anchor="middle">Customer Debts</text>
    </g>
  </svg>`;

  await sharp(Buffer.from(ogSvg))
    .resize(1200, 630)
    .flatten({ background: '#f9f9f8' })
    .removeAlpha()
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('Created og-image.png (1200x630)');
}

async function main() {
  await generateFaviconIco();
  // apple-touch-icon: 180x180, solid background, diameter 130px (~72% safe zone)
  await generatePwaIcon(180, 130, path.join(publicDir, 'apple-touch-icon.png'));
  // icon-192: 192x192, solid background, diameter 140px (~73% safe zone)
  await generatePwaIcon(192, 140, path.join(publicDir, 'icon-192.png'));
  // icon-512: 512x512, solid background, diameter 370px (~72% safe zone)
  await generatePwaIcon(512, 370, path.join(publicDir, 'icon-512.png'));
  // icon-512-maskable: 512x512, solid background, diameter 370px (~72% safe zone)
  await generatePwaIcon(512, 370, path.join(publicDir, 'icon-512-maskable.png'));
  // og-image: 1200x630
  await generateOgImage();
  console.log('All icons generated successfully!');
}

main().catch((err) => {
  console.error('Error generating assets:', err);
  process.exit(1);
});
