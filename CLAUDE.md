# Suzuki Association of Pittsburgh — Website

## What This Project Is

A static HTML/CSS/JS website for the Suzuki Association of Pittsburgh, a small nonprofit music education organization. The site is hosted on **GitHub Pages** with an **AI-powered admin interface** hosted on **Netlify** that lets non-technical admins update the site in plain English.

---

## Live URLs

| Purpose | URL |
|---|---|
| Live website | `https://mramachandran.github.io/suzukipgh/` |
| Admin interface | `https://<your-netlify-site>.netlify.app/admin` |
| GitHub repo | `https://github.com/mramachandran/suzukipgh` |

---

## How the System Works

```
Admin types a request  →  Netlify function (admin-ai.js)  →  Claude AI edits HTML
                                                                       ↓
        Site updates live  ←  GitHub Pages deploys  ←  Commit pushed to GitHub
```

1. Admin visits the `/admin` page on Netlify, enters the admin password
2. They type a plain-English request (e.g. "Add an event on June 5 at 2pm...")
3. The Netlify serverless function (`netlify/functions/admin-ai.js`) fetches the current HTML from GitHub, sends it to Claude with the request, and gets back a JSON response with the updated file content
4. The function commits the changes back to GitHub
5. GitHub Pages auto-deploys — site is live in ~2 minutes

---

## File Structure

```
suzukipgh/
├── index.html              # Homepage (testimonials, welcome, announcements)
├── about.html              # About the Suzuki Method
├── teachers.html           # Teachers directory with contact info
├── events.html             # Events calendar (most frequently updated)
├── board.html              # Board members
├── programs.html           # Programs offered
├── faq.html                # FAQ accordion
├── resources.html          # Downloadable guides and links for parents
├── contact.html            # Contact page with Google Maps
├── admin.html              # AI-powered admin interface (password protected)
├── 404.html                # Custom error page
├── styles.css              # Main stylesheet
├── css/styles.css          # Enhanced stylesheet
├── js/main.js              # Main JavaScript (nav, forms, back-to-top, etc.)
├── images/
│   ├── logo.jpg            # Organization logo
│   └── logo.svg            # SVG logo
├── favicon.svg             # Site favicon
├── sitemap.xml             # SEO sitemap
├── robots.txt              # Search engine directives
├── netlify.toml            # Netlify config (functions dir, redirects, headers)
├── netlify/
│   └── functions/
│       └── admin-ai.js     # Serverless function: AI + GitHub integration
└── docs/
    ├── README.md           # Overview and setup instructions
    ├── DEPLOYMENT.md       # GitHub Pages deployment steps
    ├── ADMIN-SETUP.md      # Admin interface one-time setup guide
    ├── UPDATING-EVENTS.md  # How to update events manually
    ├── GITHUB-PAGES-SETUP.md
    └── QUICK-START.md
```

---

## Tech Stack

- **Frontend**: Pure HTML5, CSS3, vanilla JavaScript — no frameworks, no build step
- **Fonts**: Crimson Pro (headings) + Work Sans (body) via Google Fonts
- **Hosting**: GitHub Pages (static site)
- **Admin backend**: Netlify Functions (Node.js serverless)
- **AI**: Claude API (`claude-sonnet-4-6`) via Anthropic
- **Version control**: Git / GitHub (`mramachandran/suzukipgh`)

---

## Environment Variables (Netlify)

Set these in Netlify → Site configuration → Environment variables:

| Variable | Description |
|---|---|
| `ADMIN_PASSWORD` | Password for the `/admin` login screen |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude |
| `GITHUB_TOKEN` | GitHub Personal Access Token with `repo` scope |
| `GITHUB_REPO` | Repo in `owner/name` format — e.g. `mramachandran/suzukipgh` |

---

## Design Tokens (CSS Variables)

Defined in `css/styles.css`:

```css
:root {
    --primary-color: #2C5F7C;     /* Main blue */
    --secondary-color: #8B4789;   /* Purple accent */
    --accent-color:  #D4A574;     /* Gold accent */
}
```

Admin UI uses its own color scheme: dark green `#1a3a2a` / `#2d5a3d`.

---

## Pages & What They Contain

**index.html** — Homepage: hero banner, welcome message, featured events preview, testimonials from parents/students, newsletter signup form.

**events.html** — Full events calendar. Each event uses `.event-item` cards with `data-category` attributes (`recital`, `workshop`, `masterclass`, etc.) for filtering. Events should be kept in chronological order.

**teachers.html** — Teacher directory. Each teacher uses a `.teacher-card` with name, instrument, bio, and contact info.

**about.html** — Background on the Suzuki Method philosophy.

**programs.html** — Programs and instruments offered.

**board.html** — Board member listing (update annually).

**faq.html** — Accordion-style FAQ for prospective families.

**resources.html** — Links and downloadable guides for enrolled families.

**contact.html** — Contact form + Google Maps embed.

**admin.html** — Password-protected AI chat interface. Talks to `/.netlify/functions/admin-ai`. The `FUNCTION_URL` constant in the script is set to `/.netlify/functions/admin-ai` (relative — works because both the page and the function are on Netlify).

---

## Admin Interface — How the AI Function Works

File: `netlify/functions/admin-ai.js`

1. **Auth**: Checks `password` in request body against `ADMIN_PASSWORD` env var
2. **Ping**: A `__ping__` message is used at login just to validate the password
3. **Fetch files**: Pulls current HTML of `events.html`, `teachers.html`, `index.html`, `about.html`, `contact.html`, `programs.html` from GitHub API
4. **Call Claude**: Sends all file contents + admin's request to Claude. System prompt instructs Claude to return strict JSON: `{ "message": "...", "changes": [{ "file": "...", "content": "..." }] }`
5. **Commit**: Uses GitHub Git Data API to create a new commit on `main` with the changed files (blob → tree → commit → ref update)
6. **Return**: Sends commit URL and deploy URL back to the admin UI

The admin UI (`admin.html`) stores the session password in `sessionStorage` and maintains a chat history (last 10 messages) sent with each request for context.

---

## Most Common Update Tasks

### Adding or Changing Events
Edit `events.html` — use existing `.event-item` structure:
```html
<div class="event-item" data-category="recital">
    <div class="event-date">...</div>
    <div class="event-details">
        <h3>Event Title</h3>
        <p>Description</p>
    </div>
</div>
```
Or just use the admin interface at `/admin`.

### Updating Teacher Info
Edit `teachers.html` — find the teacher's `.teacher-card` div and update name, bio, phone, email.

### Adding a New Page
1. Copy an existing HTML file
2. Update the `<title>` and content
3. Add the nav link in **all** HTML files (navbar section)
4. Add to footer links in all HTML files
5. Add to `sitemap.xml`

### Updating Social Media Links
Search all HTML files for `facebook.com/suzukipgh` and `instagram.com/suzukipgh` — update as needed.

---

## Deployment Flow

**Making changes via GitHub web UI:**
1. Go to `https://github.com/mramachandran/suzukipgh`
2. Click a file → pencil icon → edit → "Commit changes"
3. GitHub Pages rebuilds in ~2 minutes

**Making changes locally:**
```bash
cd "C:\Users\Manoj Ramachandran\OneDrive\Documents\suzuki-website"
git add <files>
git commit -m "Description of changes"
git push origin main
```

**Checking deploy status:** https://github.com/mramachandran/suzukipgh/actions

---

## Maintenance Checklist

- **Events**: Update `events.html` before/after each event — remove past events, add upcoming
- **Teachers**: Keep contact info and bios current
- **Board**: Refresh `board.html` annually
- **Footer copyright**: Auto-updates via JS (no action needed)
- **GitHub token**: Expires per the expiration set at creation — renew before it expires and update the Netlify env var

---

## Things Still Pending / To Do

- [ ] Enable GitHub Pages (Settings → Pages → Source: main branch)
- [ ] Replace placeholder/sample events with real upcoming events
- [ ] Replace placeholder teacher info with real teacher details
- [ ] Replace sample board member info with real board members
- [ ] Add real organization logo (replace `images/logo.jpg`)
- [ ] Update social media links if handles differ
- [ ] (Optional) Set up a custom domain (e.g. `suzukipgh.org`) in GitHub Pages settings
- [ ] (Optional) Add Google Analytics or similar tracking
- [ ] (Optional) Hook up the contact form to a real email service (Formspree, etc.)

---

## Troubleshooting

**Changes not showing up on live site** → Wait 2–3 min, hard-refresh (`Ctrl+F5` / `Cmd+Shift+R`), check https://github.com/mramachandran/suzukipgh/actions for deploy status.

**Admin login fails** → Check that all 4 Netlify env vars are set and the Netlify function deployed (Netlify dashboard → Functions tab).

**"Missing environment variables" error** → One or more of `ADMIN_PASSWORD`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `GITHUB_REPO` is not set in Netlify.

**GitHub commit fails** → GitHub token may have expired or lacks `repo` scope — generate a new one and update the Netlify env var.
