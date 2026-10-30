# Progressive Web App (PWA) Architecture & Deployment Guide

This document specifies the offline and caching behavior, hosting headers, domain architecture, and testing procedures for the **Hisab Mezgeb** frontend PWA.

---

## 1. Security & Correctness Rules

1. **Static-Only Service Worker Caching**:
   - The service worker caches **only** static assets: HTML, CSS, JavaScript, icons, favicons, brand graphics, and local webfonts.
   - **NEVER CACHE API DATA**: All requests matching `/api/` are strictly configured with Workbox `NetworkOnly` and are excluded from navigation fallbacks. Money figures, customer debts, and personally identifiable information must **never** sit in browser Cache Storage where they could survive a logout or be exposed on a shared mobile phone.
   - Dynamic and offline mutations are queued in the app's isolated IndexedDB storage (`HisabMezgebOffline`), which the client code controls, synchronizes, and clears on account switch.

2. **Single Page Application (SPA) Fallback**:
   - Navigation fallback is bound to `/index.html`.
   - `navigateFallbackDenylist` blocks:
     - `/^\/api\//` (API endpoints)
     - `/\.[a-zA-Z0-9]+$/` (direct static files with extensions).

3. **Safe Updates**:
   - Registration type is `registerType: 'prompt'`.
   - The app **never** reloads automatically on finding an update, which would cause data loss in the middle of typing an entry or debt transaction.
   - A global `useDirtyStore` flag tracks unsaved form input. While `isDirty === true`, the update notification is deferred.
   - Tapping "Update" triggers `messageSkipWaiting()` and activates the new worker with a clean reload.

4. **Periodic Update Checks**:
   - The registration checks for updates proactive on foreground return (`visibilitychange`) and every 60 minutes while active.

5. **Platform Constraints**:
   - The service worker is disabled in Capacitor environments (`'Capacitor' in window`) and during Vite dev server sessions (`import.meta.env.PROD === false`).

---

## 2. Server Cache-Control Headers

Static file hosting must differentiate between unhashed shell documents and immutable content-hashed assets.

| Resource Type | Paths / Patterns | Recommended `Cache-Control` Header |
|---|---|---|
| **Service Worker** | `/sw.js` | `Cache-Control: no-cache, no-store, must-revalidate` |
| **App Manifest** | `/manifest.webmanifest`, `*.webmanifest` | `Cache-Control: no-cache, no-store, must-revalidate` |
| **HTML Shell** | `/index.html`, `/` | `Cache-Control: no-cache, must-revalidate` |
| **Hashed Assets** | `/assets/*` (JS, CSS, fonts) | `Cache-Control: public, max-age=31536000, immutable` |
| **Static Icons/Images** | `/favicon.*`, `/icon-*.png`, `/apple-touch-icon.png` | `Cache-Control: public, max-age=86400, stale-while-revalidate=604800` |

### Static Host Header Configurations

#### Nginx
```nginx
server {
    listen 443 ssl http2;
    server_name hisabmezgeb.example.com;
    root /var/www/hisabmezgeb/dist;

    # Service worker & Manifest: NEVER cache
    location ~* (sw\.js|manifest\.webmanifest)$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        expires 0;
    }

    # SPA Entrypoint: Revalidate every time
    location = /index.html {
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Hashed build assets: Cache forever
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Apache (`.htaccess`)
```apache
<IfModule mod_headers.c>
  # Service Worker & Manifest
  <FilesMatch "(sw\.js|manifest\.webmanifest)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
  </FilesMatch>

  # HTML Shell
  <FilesMatch "index\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>

  # Hashed Assets
  <FilesMatch "\.(js|css|woff2|woff)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```

#### Vercel (`vercel.json`)
```json
{
  "headers": [
    {
      "source": "/(sw.js|manifest.webmanifest)",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, no-store, must-revalidate" }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache, must-revalidate" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

#### Cloudflare Pages (`_headers`)
```http
/sw.js
  Cache-Control: no-cache, no-store, must-revalidate
/manifest.webmanifest
  Cache-Control: no-cache, no-store, must-revalidate
/index.html
  Cache-Control: no-cache, must-revalidate
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

---

## 3. Production Architecture: Cross-Domain API

In production environments, the frontend web app and backend API are hosted on separate domains/subdomains (e.g. `app.hisabmezgeb.com` vs `api.hisabmezgeb.com`).

- **Cross-Origin Credentials**: Requests use `withCredentials: true` with strict CORS `Access-Control-Allow-Origin` set to the exact frontend origin.
- **Development Warning**: A dev-time check in `src/main.tsx` inspects `VITE_API_URL` against `window.location.origin` and emits a console warning if origins differ, alerting developers to verify CORS headers and secure cookie credentials during local multi-service testing.

---

## 4. Local Testing & Verification Checklist

To test PWA behaviors locally, avoid `npm run dev` (since service worker registration is disabled in dev). Build and preview the production bundle:

```bash
npm run build
npm run preview
```

### Manual Verification Checklist (Chrome DevTools)
1. **Application > Manifest**:
   - Verify name ("Hisab Mezgeb"), short_name, and `start_url` (`/home`).
   - Check icon resolutions: 192x192, 512x512, and 512x512 maskable preview.
   - Confirm theme_color (`#2e5a27`) and background_color (`#f9f9f8`).
2. **Application > Service Workers**:
   - Verify `sw.js` activates and controls the page.
   - Toggle "Offline" checkbox in DevTools Network tab.
   - Refresh the page: the UI shell loads instantly without network connectivity.
3. **Application > Cache Storage**:
   - Verify caches contain solely static JS, CSS, HTML, fonts (noto-sans-ethiopic, quicksand), and icons.
   - Confirm **zero** `/api/` entries exist in Cache Storage.
4. **Update Flow**:
   - Make a minor visual change in `HomePage.tsx`.
   - Run `npm run build` again and refresh the preview tab.
   - Verify the update banner appears ("New version available — Update").
   - Open an entry form and simulate `isDirty === true`: verify the banner is deferred until the form is dismissed.
   - Tap "Update": verify the page updates and reloads.
