# How to Update Events

This guide shows you how to easily add, edit, or remove events from the website.

## Quick Start

Events are stored in `events.html` - you only need to edit this one file!

## Adding a New Event

1. Open `events.html` in any text editor
2. Find the `<!-- Upcoming Events -->` section
3. Copy an existing event block (everything between `<div class="event-item">` and its closing `</div>`)
4. Paste it where you want the new event to appear
5. Update the details:

```html
<div class="event-item" data-category="recital">
    <div class="event-date-badge">
        <span class="month">Mar</span>        <!-- Change month -->
        <span class="day">15</span>            <!-- Change day -->
        <span class="year">2026</span>         <!-- Change year -->
    </div>
    <div class="event-content">
        <h3>Spring Piano Recital</h3>          <!-- Change title -->
        <div class="event-meta">
            <span class="event-time">🕐 2:00 PM - 4:00 PM</span>  <!-- Change time -->
            <span class="event-location">📍 Unity Presbyterian Church</span>  <!-- Change location -->
        </div>
        <p>Description of your event goes here.</p>  <!-- Change description -->
        <div class="event-address">
            <strong>Location:</strong> Full address here
        </div>
    </div>
</div>
```

## Event Categories

Events can be filtered by category. Set the `data-category` attribute to one of:
- `recital` - For recitals and performances
- `workshop` - For workshops and training
- `camp` - For day camps and intensive programs

## Editing an Existing Event

1. Open `events.html`
2. Find the event you want to edit (search for the event title)
3. Update the text between the tags
4. Save the file

## Removing an Event

1. Open `events.html`
2. Find the entire event block (from `<div class="event-item">` to its closing `</div>`)
3. Delete the entire block
4. Save the file

## Publishing Updates to GitHub Pages

After making changes:

### Option 1: Using Git Command Line
```bash
cd "C:\Users\Manoj Ramachandran\OneDrive\Documents\suzuki-website"
git add events.html
git commit -m "Update events for [month/season]"
git push origin main
```

### Option 2: Using GitHub Website
1. Go to https://github.com/mramachandran/suzukipgh
2. Click on `events.html`
3. Click the pencil icon (Edit this file)
4. Make your changes
5. Scroll down and click "Commit changes"

### Your changes will appear on the website within 1-2 minutes!

## Tips

- **Keep events in chronological order** - Newest dates first
- **Remove past events** regularly to keep the page current
- **Use consistent formatting** for dates and times
- **Test locally first** if making major changes (use Python server or open file in browser)

## Example: Adding a Summer Workshop

```html
<div class="event-item" data-category="workshop">
    <div class="event-date-badge">
        <span class="month">Jul</span>
        <span class="day">12</span>
        <span class="year">2026</span>
    </div>
    <div class="event-content">
        <h3>Summer Piano Workshop</h3>
        <div class="event-meta">
            <span class="event-time">🕐 9:00 AM - 3:00 PM</span>
            <span class="event-location">📍 PYCO School of Music</span>
        </div>
        <p>Intensive one-day workshop focusing on advanced technique and repertoire preparation.</p>
        <div class="event-address">
            <strong>Location:</strong> Pittsburgh Youth Concert Orchestra, 333 Penn Avenue, Pittsburgh, PA 15222
        </div>
    </div>
</div>
```

## Need Help?

- Check the existing events for formatting examples
- Make sure all opening tags (`<div>`) have closing tags (`</div>`)
- If something breaks, you can always revert changes in GitHub
- Preview locally before pushing to see how it looks

---

**Pro Tip:** Bookmark the `events.html` file location in your editor for quick access!
