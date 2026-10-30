import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('Theme design tokens and fonts', () => {
  const cssPath = path.resolve(__dirname, '../src/styles/globals.css');
  const cssContent = fs.readFileSync(cssPath, 'utf-8');

  it('defines light mode tokens matching Google Stitch tokens', () => {
    expect(cssContent).toContain('--primary: #2e5a27');
    expect(cssContent).toContain('--primary-container: #d2e8cc');
    expect(cssContent).toContain('--secondary: #52dc90');
    expect(cssContent).toContain('--secondary-container: #a3f7bf');
    expect(cssContent).toContain('--money-in: #167a3c');
    expect(cssContent).toContain('--money-out: #c8441b');
    expect(cssContent).toContain('--money-neutral: #965612');
    expect(cssContent).toContain('--money-in-strong: #146934');
    expect(cssContent).toContain('--money-out-strong: #9e3210');
    expect(cssContent).toContain('--money-neutral-strong: #8a5014');
    expect(cssContent).toContain('--nav-active-bg: #a3f7bf');
    expect(cssContent).toContain('--nav-active-fg: #00210c');
  });

  it('defines dark mode tokens in .dark class', () => {
    const darkSection = cssContent.slice(cssContent.indexOf('.dark'));
    expect(darkSection).toContain('--money-in: #52dc90');
    expect(darkSection).toContain('--money-out: #ff8c73');
    expect(darkSection).toContain('--money-neutral: #ffba73');
    expect(darkSection).toContain('--nav-active-bg: #1a3517');
    expect(darkSection).toContain('--nav-active-fg: #d2e8cc');
  });

  it('configures Quicksand and Noto Sans Ethiopic fonts offline without Google Fonts CDN', () => {
    expect(cssContent).toContain('@fontsource-variable/quicksand');
    expect(cssContent).toContain('@fontsource-variable/noto-sans-ethiopic');
    expect(cssContent).not.toContain('@fontsource-variable/geist');

    const indexPath = path.resolve(__dirname, '../index.html');
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).not.toContain('fonts.googleapis.com');
  });

  it('defines layout size utilities for header, bottom-nav and touch target', () => {
    expect(cssContent).toContain('--header-height: 64px');
    expect(cssContent).toContain('--bottom-nav-height: calc(76px + env(safe-area-inset-bottom, 0px))');
    expect(cssContent).toContain('--touch-target: 48px');
  });
});
