# BVM Papers — Project Blueprint

## Project goal

Build a lightweight, mobile-first static site for finding, previewing, and downloading previous-year examination papers for BVM Information Technology, Semester 5. Students should be able to find a paper quickly, with the browser handling PDF display.

Phase 1 has no application backend, application data tables, authentication, or permanent user profiles. The approved lightweight extension uses local display names and Supabase Realtime Presence for one shared `semester-5` room; presence remains ephemeral and the count represents active browser sessions.

## Architecture decision: browser-native PDF viewing

Do not include PDF.js or any other PDF rendering library. Preview actions open the source PDF directly, preferably in a new browser tab, so the browser's native PDF viewer handles display and controls. Keep a separate Download action for the original file.

An integrated preview route is optional and should only be added if it improves navigation. If used, it must use a basic `<iframe>` or `<object>` with a visible fallback message and direct PDF link. It must not render or process PDF pages itself.

### Explicitly out of scope

- PDF.js, its worker, or any PDF rendering dependency
- Canvas-based PDF rendering, custom zoom or page controls, thumbnails, or page navigation
- IntersectionObserver-based page rendering or PDF rendering memory management
- PDF preloading or PDF requests on the homepage
- Application backend services, application data tables, authentication, uploads, and real-time analytics
- Unnecessary frameworks, UI kits, or third-party dependencies

## Technology

- Vite
- Vanilla JavaScript
- HTML5 and CSS3
- Static JSON metadata
- Browser-native PDF viewer
- Cloudflare Pages static hosting
- Git/GitHub for version control

## Phase 1 content

Department: Information Technology  
Semester: 5

Initial subjects:

1. Open Elective – I
2. 301IT — Design and Analysis of Algorithms
3. 302IT — Artificial Intelligence
4. 303IT — Java Programming
5. Program Elective – I
6. 301ES — Design Thinking
7. 301HS — Ethics and Constitution of India

Open Elective – I and Program Elective – I need configurable names and codes in the central JSON data so students can set their selected electives. Only show paper entries that have been supplied; never fabricate available papers.

## User experience requirements

### Home page

- BVM Papers identity and Information Technology / Semester 5 context
- Prominent client-side search by subject name or code, with partial and case-insensitive matches
- Seven subject cards generated from JSON, showing name, code when available, paper count, and a clear navigation cue
- Empty search state and minimal footer
- No large hero, heavy imagery, decorative animation, or PDF requests

### Subject page

- Subject name and code, back navigation, and only available paper records
- Each paper shows examination year and Summer/Winter session
- Separate Preview and Download actions
- Friendly empty and invalid-subject states

### Preview and download

- Preview opens the actual PDF URL, preferably in a new tab, and lets the browser provide its native controls.
- Use descriptive filenames for local PDFs and download hints where supported. Do not rely on the HTML `download` attribute for cross-origin URLs; use an appropriate same-origin asset or server-provided attachment response when a forced download is required.
- Keep a direct PDF link visible as a fallback if inline preview is unsupported or blocked.
- Missing or unavailable files must produce a friendly message and must not be presented as working papers. Where possible, check availability when the user requests the document rather than fetching PDFs during page initialization.
- Never download a rendered image or screenshot in place of the original PDF.

## Hosting and compatibility requirements

Documents may be stored under `public/papers/` or referenced by public college-hosted URLs. Reuse external URLs only after checking their behavior; avoid unnecessary copies.

Before deployment, test each real PDF source and inspect its response headers and hosting behavior:

- `Content-Type` is `application/pdf`.
- Preview responses permit inline display (`Content-Disposition` is not forcing attachment).
- The URL is public, uses HTTPS, and does not require authentication.
- Cross-origin policy and framing restrictions do not block the selected preview approach. Direct navigation to a PDF in a new tab is preferred; embedding may have additional restrictions.
- Range requests work where the host supports them.
- Download behavior returns the original PDF.
- A missing document produces a clear error or fallback.

If a college host forces downloads, blocks access, or otherwise prevents reliable preview, document the observed headers and restriction before recommending a different hosting approach. Do not silently replace the source or claim compatibility without testing.

Check a representative set of supported browsers and devices before release: Chrome desktop, Chrome Android, Edge, Firefox where available, and Safari/iOS where available. Mobile PDF behavior varies, so provide a usable direct-link fallback and do not promise identical controls everywhere.

## Data model

Keep the canonical metadata in `src/data/papers.json`. The interface is generated from it; subject and paper entries should not be duplicated in UI code. Adding a paper should require adding its PDF asset or URL and its JSON record only.

Example:

```json
{
  "department": "Information Technology",
  "semester": 5,
  "subjects": [
    {
      "id": "301IT",
      "code": "301IT",
      "name": "Design and Analysis of Algorithms",
      "papers": [
        {
          "id": "301IT-W-2025",
          "year": 2025,
          "session": "Winter",
          "file": "/papers/301IT/301IT-winter-2025.pdf",
          "fileSize": null
        }
      ]
    }
  ]
}
```

Keep the schema extensible to other departments and semesters without adding unnecessary abstractions in Phase 1. Empty `papers` arrays are valid when files have not yet been supplied.

## Display names and live Semester 5 presence

- On first visit, require a display name or an explicit Anonymous choice before entering the catalogue.
- Store only the display label and its expiration timestamp in local storage for seven days; allow the visitor to change the label.
- Use one Supabase Realtime Presence room named `semester-5` for the whole Semester 5 area. Track a unique browser-session ID and display name; derive the online session count from Presence state.
- Presence is ephemeral, not an attendance record or verified student identity. Show only the approximate session count. Keep display names in each visitor's local browser; do not send them through Presence or expose them to other visitors. Do not collect or expose sensitive personal information or store Presence in an application table.
- Configure the client only with `VITE_SUPABASE_URL` and a public publishable/anon key. Never expose a service-role/secret key.
- Use a private Realtime channel and narrowly scoped policies for anonymous Presence read/publish on the exact `semester-5` topic. If no credentials or project authorization are configured, the catalogue and PDF actions still work and the live count shows unavailable.
- See `supabase/realtime-presence.sql` and `README.md` for Supabase setup, public-room limitations, and required environment variables.

## Suggested project layout

```text
public/
  papers/
    301IT/
    302IT/
    303IT/
    open-elective/
    program-elective/
    301ES/
    301HS/
  favicon.svg
src/
  data/
    papers.json
  css/
    variables.css
    base.css
    layout.css
    components.css
    responsive.css
  js/
    app.js
    router.js
    data.js
    search.js
    subjects.js
    papers.js
    utils.js
  main.js
index.html
package.json
vite.config.js
README.md
```

Keep this structure lean: combine small modules if separate files add needless complexity.

## Navigation and accessibility

Use simple client-side navigation or ordinary links, whichever keeps the implementation smallest and most reliable. If client-side routes are used, browser back, direct links, refreshes on nested URLs, and unknown IDs must work. A preview route is optional; direct PDF links are the default.

Use semantic HTML, visible keyboard focus, accessible button/link names, and touch-friendly actions. Ensure the layout has no horizontal overflow and remains readable on mobile, tablet, and desktop.

## Visual direction

Use a polished, restrained academic utility style. Suggested tokens:

- Background: `#FFF9F3`
- Surface: `#FFFFFF`
- Primary: `#E88B50`
- Text: `#35302D`
- Secondary text: `#827970`
- Border: `#EEE6DE`
- Secondary surface: `#F3EEE8`

Prefer system fonts, reusable CSS variables, subtle borders, 10–14px corner radii, comfortable spacing, minimal shadows, and no heavy animations or gradients.

## Performance targets

- Initial JavaScript and CSS below 100 KB compressed, as a target
- Initial home-page transfer below 150 KB excluding external fonts, as a target
- Zero PDF requests on the home page
- No PDF parsing or rendering in application code
- No unnecessary external scripts or requests
- Load a PDF only after the student requests preview or download
- Lighthouse Performance 95+, LCP below 2.5 seconds, and CLS below 0.1 as optimization targets, not guarantees

## Cloudflare Pages deployment

- Build command: `npm run build`
- Output directory: `dist`
- Add SPA fallback configuration only if client-side routes require it.
- Verify PDFs are served with appropriate MIME and inline/attachment behavior.
- Test deployed deep links and external PDF URLs from the production site.
- Document setup and deployment steps in `README.md`.

## Release checklist

### Discovery and navigation

- All seven configured subjects appear with correct names and codes.
- Elective labels and codes can be changed through JSON.
- Search matches names and codes and shows an empty state.
- Subject navigation, back behavior, and invalid IDs work.
- Paper year/session values are correct; unavailable papers are not listed as working links.

### PDF behavior

- Preview opens the actual PDF in the browser's native viewer where supported.
- Separate download action returns the original PDF with a meaningful filename where supported.
- Source headers, access restrictions, cross-origin behavior, and mobile reading behavior have been checked.
- Direct link and friendly fallback are available when inline preview fails.
- Missing documents show a helpful error.

### Quality and deployment

- Responsive layouts work on mobile, tablet, and desktop without horizontal overflow.
- No PDF is requested on the home page; no PDF rendering library or worker is shipped.
- Production build succeeds and production output is checked.
- Cloudflare Pages deep links refresh correctly when applicable.
- No broken links or console errors; actual production PDF URLs are verified.

## Development sequence

1. Set up Vite, the lean folder structure, CSS tokens, and base layout.
2. Build the responsive home page and seven JSON-driven subject cards.
3. Add JSON loading, client-side subject search, and subject paper listings.
4. Add direct native-preview and separate download links with meaningful filenames and fallbacks.
5. Check real PDF host headers and behavior, then validate supported desktop and mobile browsers.
6. Review bundle size and network activity; confirm there is no PDF processing in the app.
7. Build and verify the production output and Cloudflare Pages deployment configuration.

## Product priorities

1. Fast paper discovery
2. Simple navigation
3. Reliable browser-native PDF preview
4. Usable downloads and mobile fallbacks
5. Low application weight and easy maintenance
6. Visual simplicity
