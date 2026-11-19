# BVM Papers

Lightweight, static previous-year paper catalogue for BVM Information Technology, Semester 5. Built with Vite, vanilla JavaScript, CSS, JSON, and Supabase Realtime Presence. PDFs are opened by the browser's native PDF viewer; the application does not render PDF pages.

## Run locally

1. Install Node.js (LTS).
2. Run `npm install`.
3. Run `npm run dev` and open the local address printed by Vite.
4. Run `npm run build` to create the production site in `dist/`.
5. Copy `.env.example` to `.env.local`, then set the Supabase Project URL and publishable (or legacy anon) key as described below. Without them, the catalogue and PDFs still work; the live count reports unavailable.
6. Run `npm run preview` to inspect the production build locally.

## Display names and live count

The first visit asks for a display name or offers Anonymous. The value is kept in `localStorage` under `bvm_papers_user` for seven days and can be changed from the header or footer. It is a display label only, not a verified identity or login. Each page load creates a distinct presence session; Supabase's Presence state determines the approximate online session count. The feature does not create a database table or store presence permanently.

Set these Vite environment variables in `.env.local` for local development and in Cloudflare Pages' environment settings for deployment:

```dotenv
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-project-publishable-key
```

Despite the variable name, Supabase's newer `sb_publishable_...` key may be used here; a legacy `anon` key also works. This public client key is visible in the built website. Never use a service-role or secret key in Vite environment variables or browser code.

### Supabase authorization setup

1. Create a Supabase project and copy its Project URL and publishable key.
2. In **Realtime → Settings**, turn off **Allow public access** so private-channel authorization is enforced.
3. Run [`supabase/realtime-presence.sql`](supabase/realtime-presence.sql) in the Supabase SQL Editor. It grants only anonymous Presence read and publish access for the exact `semester-5` topic. It creates no tables and does not allow Broadcast.
4. Set the environment variables above and restart Vite.

This is intentionally a public anonymous room. Anyone who obtains the public site and key can join it, choose any display name, or create additional sessions. RLS narrows access to the single Presence topic, but without authentication Supabase cannot verify student identity or prevent a determined person from spoofing/automating sessions. The count is approximate active browser sessions, not attendance or unique students. The expandable online list groups identical display names and is visible to everyone in the room. Do not add personal or sensitive data to presence payloads.

## Add a paper

The catalogue is prefilled with four Winter records (2025, 2024, 2023, and 2022) per subject. Add the corresponding PDFs at the paths already listed in `src/data/papers.json`; until those files are supplied, those paper links will lead to a missing-file response. The expected names are `winter-2025.pdf`, `winter-2024.pdf`, `winter-2023.pdf`, and `winter-2022.pdf` in each subject folder.

Example record:

```json
{
  "id": "301IT-W-2025",
  "year": 2025,
  "session": "Winter",
  "file": "/papers/301IT/301IT-winter-2025.pdf",
  "fileSize": null
}
```

For same-origin PDFs, the Download action suggests a useful filename. Browsers may ignore the `download` hint for cross-origin files; configure the file host to return an attachment with a meaningful filename if forced download is needed. Preview opens the URL directly in a new tab. The browser may show its native PDF reader or offer its own download/open action.

The two elective subject names and codes are configurable in the JSON catalogue.

## Cloudflare Pages

- Build command: `npm run build`
- Build output directory: `dist`
- Framework preset: Vite
- No server-side functions or application data tables are required. Supabase Realtime is used only for ephemeral Presence state.

`public/_headers` asks Cloudflare Pages to serve local PDFs as `application/pdf`. Check deployed response headers for actual PDF URLs. For external college URLs, confirm that they are public over HTTPS and permit inline viewing; inspect `Content-Type`, `Content-Disposition`, CORS/frame restrictions where relevant, and range request behavior. A direct new-tab PDF navigation is preferred over embedding, but the source host may force downloads or block access.

Before release, test representative files in desktop and mobile browsers (Chrome, Edge, Firefox, Safari/iOS where available), including direct preview, download, missing-file behavior, and the deployed site. Mobile browser PDF controls vary.

## Routes

The site uses hash navigation so subject links work on static hosting without server rewrites:

- `/#/` — catalogue and subject search
- `/#/subject/301IT` — a subject's paper list

No PDFs are requested until a student follows a paper action.
