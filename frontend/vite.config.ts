import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function seoFilesPlugin(): Plugin {
  let siteUrl = '';
  return {
    name: 'seo-files-generator',
    configResolved(config) {
      siteUrl = (config.env.VITE_SITE_URL || '').replace(/\/$/, '');
    },
    generateBundle() {
      if (siteUrl) {
        const robotsContent = `User-agent: *\nAllow: /\nDisallow: /home\nDisallow: /entries\nDisallow: /debts\nDisallow: /reports\nDisallow: /settings\n\nSitemap: ${siteUrl}/sitemap.xml\n`;
        this.emitFile({
          type: 'asset',
          fileName: 'robots.txt',
          source: robotsContent,
        });

        const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${siteUrl}/</loc>\n    <changefreq>weekly</changefreq>\n    <priority>1.0</priority>\n  </url>\n  <url>\n    <loc>${siteUrl}/login</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n  <url>\n    <loc>${siteUrl}/register</loc>\n    <changefreq>monthly</changefreq>\n    <priority>0.8</priority>\n  </url>\n</urlset>\n`;
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: sitemapContent,
        });
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), tailwindcss(), seoFilesPlugin()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { port: 5173 },
});

