# Quick Start Guide - Suzuki Pittsburgh Website

## 🎉 Your Website is Live!

**Repository:** https://github.com/mramachandran/suzukipgh
**Live Site:** https://mramachandran.github.io/suzukipgh/ (after enabling GitHub Pages)

---

## 🚀 Step 1: Enable GitHub Pages (One-Time Setup)

1. Go to https://github.com/mramachandran/suzukipgh/settings/pages
2. Under "Source", select **main** branch
3. Click **Save**
4. Wait 2-3 minutes
5. Your site will be live at: **https://mramachandran.github.io/suzukipgh/**

---

## 📅 Step 2: Update Events (Most Common Task)

### Method A: Edit Directly on GitHub (Easiest!)

1. Go to https://github.com/mramachandran/suzukipgh/blob/main/events.html
2. Click the **pencil icon** (✏️) in the top right
3. Find where it says `<!-- Upcoming Events 2026 -->`
4. Copy an existing event block and paste it
5. Update the details (month, day, title, time, location)
6. Scroll down, add a commit message like "Add Spring Recital"
7. Click **Commit changes**
8. Your site updates automatically in 1-2 minutes! ✨

### Method B: Edit Locally (For Bigger Changes)

```bash
cd "C:\Users\Manoj Ramachandran\OneDrive\Documents\suzuki-website"
# Edit events.html in your favorite editor
git add events.html
git commit -m "Update events"
git push origin main
```

### Event Block Template

Copy this and paste into `events.html`:

```html
<div class="event-item" data-category="recital">
    <div class="event-date-badge">
        <span class="month">Jun</span>
        <span class="day">15</span>
        <span class="year">2026</span>
    </div>
    <div class="event-content">
        <h3>Your Event Title Here</h3>
        <div class="event-meta">
            <span class="event-time">🕐 2:00 PM - 4:00 PM</span>
            <span class="event-location">📍 Location Name</span>
        </div>
        <p>Brief description of the event.</p>
        <div class="event-address">
            <strong>Location:</strong> Full address here
        </div>
    </div>
</div>
```

**Event Categories:**
- `data-category="recital"` - For recitals
- `data-category="workshop"` - For workshops
- `data-category="camp"` - For day camps

---

## 📝 Other Common Updates

### Update Teacher Information
**File:** `teachers.html`
**Edit:** Phone, email, or bio sections

### Add Announcements to Homepage
**File:** `index.html`
**Edit:** Any section, add news between existing sections

### Update Contact Info
**File:** `contact.html`
**Edit:** Email, social media links

### Update FAQ
**File:** `faq.html`
**Edit:** Add/remove questions and answers

---

## 🎨 Preview Changes Locally (Before Publishing)

Want to see changes before they go live?

### Option 1: Python Server (Recommended)
```bash
cd "C:\Users\Manoj Ramachandran\OneDrive\Documents\suzuki-website"
python -m http.server 8000
```
Then open: http://localhost:8000

### Option 2: Just Open the File
Double-click `index.html` to open in your browser

---

## 📂 Important Files

| File | Purpose | How Often to Update |
|------|---------|-------------------|
| `events.html` | All events and recitals | **Weekly/Monthly** |
| `teachers.html` | Teacher directory | When teachers change |
| `index.html` | Homepage | For announcements |
| `faq.html` | Frequently asked questions | As needed |
| `contact.html` | Contact information | When info changes |

---

## ✨ Features You Have

✅ Mobile-responsive design
✅ SEO optimized with meta tags
✅ Newsletter signup form
✅ Interactive FAQ page
✅ Google Maps on contact page
✅ Testimonials section
✅ Resources page with downloads
✅ Custom 404 error page
✅ Back-to-top button
✅ Accessibility features (keyboard navigation, screen readers)
✅ Print-friendly pages

---

## 🆘 Need Help?

### Quick Fixes

**Website not updating?**
- Wait 2-3 minutes after pushing
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

**Made a mistake?**
- On GitHub, click the file → "History" → Find last good version → Revert

**Something broke?**
- Check for typos in HTML tags
- Make sure all `<div>` tags have closing `</div>` tags

### Documentation Files

- `DEPLOYMENT.md` - Full deployment guide
- `UPDATING-EVENTS.md` - Detailed event update instructions
- `README.md` - Complete technical documentation

---

## 🎯 Your Workflow (Super Simple!)

```
1. Edit files (on GitHub or locally)
   ↓
2. Commit changes
   ↓
3. Wait 1-2 minutes
   ↓
4. Check live site!
```

---

## 🌟 Pro Tips

- **Bookmark** the events.html edit page for quick access
- **Test locally** before pushing major changes
- **Commit often** with clear messages
- **Remove old events** regularly to keep the site fresh
- **Use the GitHub web editor** for quick text updates

---

**You're all set! Your website is modern, professional, and easy to maintain.** 🎉

For detailed instructions, see the other .md files in this directory.
