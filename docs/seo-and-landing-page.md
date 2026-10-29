# Landing Page & SEO Architecture

## Public Landing Page ("/")
The public landing page introduces Hisab Mezgeb to new visitors and small business owners in Ethiopia.
- Explains core features: Daily income & expense recording, Customer debt ledger, Simple reports, and Trilingual support (Amharic, Tigrigna, English).
- Explains 3 simple steps on how to use it.
- Honest, clear value proposition tailored for small family shops.
- Direct links to `/register` and `/login`.
- Zero stock photos; relies strictly on lightweight inline SVGs and Lucide icons.

## Auth Routing Behavior
- Anonymous visitors see `/` immediately without any loading spinner.
- No session check or `/auth/refresh` API request is made when no account exists on the device (saving rate limits).
- Authenticated users opening `/` are automatically redirected to `/home`.

## Honest SEO Architecture & Technical Limits

### 1. Client-Side Rendering (SPA) Limitations
Hisab Mezgeb is a client-rendered Single Page Application built with Vite and React.
- **Search Engine Crawlers without JavaScript**: Crawlers and social bots that do not execute JavaScript (such as WhatsApp, Telegram, Facebook link unfurlers, and basic crawlers) will only read the static HTML tags present in `index.html` (title, meta description, canonical URL, Open Graph, Twitter cards, and JSON-LD `WebApplication` structured data). They do not see dynamically rendered React DOM content.
- **Modern Search Engines (Googlebot)**: Googlebot executes JavaScript in a headless Chrome environment, indexing client-rendered content, though with potential rendering delays.

### 2. Multi-Language (i18n) Indexing Limits
- The landing page lives on a single URL (`/`).
- Because all three languages (English, አማርኛ, ትግርኛ) are toggled dynamically on the client via `react-i18next` without language-specific URLs (such as `/am`, `/ti`, `/en`), search engines typically index only the default language (English).
- A single URL cannot simultaneously serve distinct linguistic index targets to search engines, and `hreflang` tags should not be added without unique language URLs.

### 3. Recommended Future Enhancement: Static Pre-rendering (SSG)
If strong public SEO ranking across Amharic, Tigrigna, and English is required in the future, the recommended solution is:
- Pre-render the landing page at build time (e.g., using a build-time pre-renderer or Vite SSG plugin).
- Optionally generate localized static entrypoints (`/`, `/am`, `/ti`) with pre-baked HTML and appropriate `hreflang` tags.
