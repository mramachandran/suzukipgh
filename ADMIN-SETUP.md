# Admin Interface Setup Guide

The admin interface lets anyone update the website by typing in plain English.
Changes go live automatically in ~2 minutes via GitHub.

---

## How It Works

```
Admin types a request  →  Netlify function  →  Claude AI edits the HTML
                                                        ↓
        Site updates live ←  GitHub Pages deploys  ←  Commit pushed to GitHub
```

---

## One-Time Setup (~15 minutes)

### Step 1 — Create a GitHub Personal Access Token

1. Go to https://github.com/settings/tokens/new
2. Give it a name like "Suzuki Admin Bot"
3. Set expiration (1 year is fine)
4. Under **Scopes**, check **repo** (full repo access)
5. Click **Generate token** and copy it — save it somewhere safe

---

### Step 2 — Get your Anthropic API Key

1. Go to https://console.anthropic.com/
2. Click **API Keys** → **Create Key**
3. Copy the key

---

### Step 3 — Deploy to Netlify

1. Go to https://app.netlify.com/ and sign up (free)
2. Click **Add new site → Import an existing project**
3. Connect to your GitHub account and select the `suzukipgh` repo
4. Leave build settings blank (it's a static site) and click **Deploy site**
5. Netlify will give you a URL like `https://suzukipgh.netlify.app`

---

### Step 4 — Set Environment Variables in Netlify

1. In Netlify, go to **Site configuration → Environment variables**
2. Add these four variables:

| Variable | Value |
|---|---|
| `ADMIN_PASSWORD` | A password only admins know (make it strong) |
| `ANTHROPIC_API_KEY` | Your Anthropic API key from Step 2 |
| `GITHUB_TOKEN` | Your GitHub token from Step 1 |
| `GITHUB_REPO` | Your repo name, e.g. `manoj/suzukipgh` |

3. Click **Save** after adding each one

---

### Step 5 — Test It

1. Visit `https://your-netlify-site.netlify.app/admin`
2. Enter your admin password
3. Try: *"Add a test event on December 25 at 3pm called Holiday Party at Unity Church"*
4. In ~2 minutes, check the live site — the event should appear!

---

## Using the Admin Interface

Just type naturally. Examples:

- *"Update the events page — remove the May 3 picnic and add a new event on June 14 at 2pm called Summer Recital at PYCO School of Music"*
- *"Change Pat Pavlack's phone number to (412) 555-1234"*
- *"The April 12 recital has been cancelled. Remove it."*
- *"Add a note to the events page that the May 16 event features patriotic music"*

The AI will confirm what it changed, and the site updates automatically.

---

## Sharing Access

Anyone who needs to update the site just needs:
- The Netlify admin URL (`https://your-site.netlify.app/admin`)
- The admin password

No GitHub account, no code knowledge required.

---

## Troubleshooting

**"Connection error"** — Check that the Netlify function deployed correctly (Netlify dashboard → Functions tab)

**Changes not appearing** — Check GitHub Actions tab to confirm the deploy ran

**"Missing environment variables"** — Double-check Step 4 above and re-deploy

---

*Built with Claude AI + Netlify Functions + GitHub Pages*
