import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.resolve(rootDir, 'public');
const htmlPath = path.resolve(rootDir, 'index.html');

describe('HTML metadata and local asset integrity', () => {
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  it('reads index.html and verifies title and description lengths', () => {
    const titleMatch = htmlContent.match(/<title>([^<]+)<\/title>/);
    expect(titleMatch).not.toBeNull();
    const title = titleMatch![1].trim();
    expect(title.length).toBeLessThan(60);
    expect(title).toBe('Hisab Mezgeb - Simple Money & Debt Tracker');

    const descMatch = htmlContent.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    expect(descMatch).not.toBeNull();
    const desc = descMatch![1].trim();
    expect(desc.length).toBeLessThan(160);
  });

  it('verifies viewport-fit=cover, color-scheme and light/dark theme-color tags', () => {
    expect(htmlContent).toContain('viewport-fit=cover');
    expect(htmlContent).toMatch(
      /<meta[^>]*name=["']color-scheme["'][^>]*content=["']light dark["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*name=["']theme-color["'][^>]*media=["']\(prefers-color-scheme:\s*light\)["'][^>]*content=["']#f9f9f8["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*name=["']theme-color["'][^>]*media=["']\(prefers-color-scheme:\s*dark\)["'][^>]*content=["']#111411["']/i
    );
  });

  it('verifies canonical, Open Graph, and Twitter card tags', () => {
    expect(htmlContent).toMatch(
      /<link[^>]*rel=["']canonical["'][^>]*href=["']%VITE_SITE_URL%\/["']/i
    );
    expect(htmlContent).toMatch(/<meta[^>]*property=["']og:type["'][^>]*content=["']website["']/i);
    expect(htmlContent).toMatch(
      /<meta[^>]*property=["']og:site_name["'][^>]*content=["']Hisab Mezgeb["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*property=["']og:image["'][^>]*content=["']%VITE_SITE_URL%\/og-image\.png["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*property=["']og:image:width["'][^>]*content=["']1200["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*property=["']og:image:height["'][^>]*content=["']630["']/i
    );
    expect(htmlContent).toMatch(/<meta[^>]*property=["']og:locale["'][^>]*content=["']en_US["']/i);
    expect(htmlContent).toMatch(
      /<meta[^>]*name=["']twitter:card["'][^>]*content=["']summary_large_image["']/i
    );
    expect(htmlContent).toMatch(
      /<meta[^>]*name=["']twitter:image["'][^>]*content=["']%VITE_SITE_URL%\/og-image\.png["']/i
    );
  });

  it('verifies every referenced local asset in index.html exists in public/', () => {
    // Links with href starting with / or %VITE_SITE_URL%/
    const hrefMatches = Array.from(
      htmlContent.matchAll(/href=["'](\/[^"']+|%VITE_SITE_URL%\/([^"']+))["']/g)
    );
    for (const match of hrefMatches) {
      const relativePath = match[2] || match[1];
      const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
      if (!cleanPath || cleanPath === '/') continue;

      const fullPath = path.join(publicDir, cleanPath);
      expect(fs.existsSync(fullPath), `Referenced local asset does not exist: ${cleanPath}`).toBe(
        true
      );
    }

    // Metas with content pointing to image assets
    const metaMatches = Array.from(
      htmlContent.matchAll(/content=["'](%VITE_SITE_URL%\/([^"']+))["']/g)
    );
    for (const match of metaMatches) {
      const assetFile = match[2];
      const fullPath = path.join(publicDir, assetFile);
      expect(fs.existsSync(fullPath), `Referenced meta image does not exist: ${assetFile}`).toBe(
        true
      );
    }
  });

  it('verifies brand/logo.svg and favicon.svg exist and are valid SVGs', () => {
    const logoPath = path.join(publicDir, 'brand', 'logo.svg');
    const faviconSvgPath = path.join(publicDir, 'favicon.svg');
    expect(fs.existsSync(logoPath)).toBe(true);
    expect(fs.existsSync(faviconSvgPath)).toBe(true);

    const logoContent = fs.readFileSync(logoPath, 'utf8');
    expect(logoContent).toContain('<svg');
    expect(logoContent).toContain('#2e5a27'); // primary-green
  });

  it('verifies favicon.ico exists and is non-empty', () => {
    const icoPath = path.join(publicDir, 'favicon.ico');
    expect(fs.existsSync(icoPath)).toBe(true);
    const stats = fs.statSync(icoPath);
    expect(stats.size).toBeGreaterThan(0);
  });

  it('verifies apple-touch-icon.png is 180x180 and has NO transparency (hasAlpha: false)', async () => {
    const appleIconPath = path.join(publicDir, 'apple-touch-icon.png');
    expect(fs.existsSync(appleIconPath)).toBe(true);

    const meta = await sharp(appleIconPath).metadata();
    expect(meta.width).toBe(180);
    expect(meta.height).toBe(180);
    expect(meta.format).toBe('png');
    expect(meta.hasAlpha).toBe(false);
  });

  it('verifies icon-192.png, icon-512.png, and icon-512-maskable.png have correct dimensions and no transparency', async () => {
    const icon192 = await sharp(path.join(publicDir, 'icon-192.png')).metadata();
    expect(icon192.width).toBe(192);
    expect(icon192.height).toBe(192);
    expect(icon192.hasAlpha).toBe(false);

    const icon512 = await sharp(path.join(publicDir, 'icon-512.png')).metadata();
    expect(icon512.width).toBe(512);
    expect(icon512.height).toBe(512);
    expect(icon512.hasAlpha).toBe(false);

    const icon512Maskable = await sharp(path.join(publicDir, 'icon-512-maskable.png')).metadata();
    expect(icon512Maskable.width).toBe(512);
    expect(icon512Maskable.height).toBe(512);
    expect(icon512Maskable.hasAlpha).toBe(false);
  });

  it('verifies og-image.png is a real PNG of 1200x630 and has NO transparency', async () => {
    const ogPath = path.join(publicDir, 'og-image.png');
    expect(fs.existsSync(ogPath)).toBe(true);

    const meta = await sharp(ogPath).metadata();
    expect(meta.format).toBe('png');
    expect(meta.width).toBe(1200);
    expect(meta.height).toBe(630);
    expect(meta.hasAlpha).toBe(false);
  });

  it('verifies site.webmanifest is valid JSON with required fields and existent icons', () => {
    const manifestPath = path.join(publicDir, 'site.webmanifest');
    expect(fs.existsSync(manifestPath)).toBe(true);

    const raw = fs.readFileSync(manifestPath, 'utf8');
    const manifest = JSON.parse(raw);

    expect(manifest.name).toBe('Hisab Mezgeb');
    expect(manifest.short_name).toBe('Hisab Mezgeb');
    expect(manifest.start_url).toBe('/home');
    expect(manifest.scope).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.theme_color).toBe('#2e5a27');
    expect(manifest.background_color).toBe('#f9f9f8');

    expect(Array.isArray(manifest.icons)).toBe(true);
    expect(manifest.icons.length).toBeGreaterThanOrEqual(3);

    const hasMaskable = manifest.icons.some(
      (icon: { purpose?: string }) => icon.purpose === 'maskable'
    );
    expect(hasMaskable).toBe(true);

    for (const icon of manifest.icons) {
      const iconFile = icon.src.replace(/^\//, '');
      expect(
        fs.existsSync(path.join(publicDir, iconFile)),
        `Manifest icon file missing: ${icon.src}`
      ).toBe(true);
    }
  });
});
