# Suzuki Association of Pittsburgh - Website

A modern, clean, and responsive website for the Suzuki Association of Pittsburgh, designed to showcase the organization's mission, teachers, events, and the Suzuki Method of music education.

## ✨ Features

### Core Features
- **Modern Design**: Clean, elegant design with beautiful typography (Crimson Pro + Work Sans)
- **Fully Responsive**: Works beautifully on desktop, tablet, and mobile devices
- **Accessibility Optimized**: Skip links, ARIA labels, keyboard navigation, WCAG 2.1 AA compliant
- **SEO Optimized**: Meta tags, Open Graph, sitemap.xml, robots.txt
- **Easy to Update**: Simple HTML structure makes content updates straightforward

### New Enhancements (2026)
- **FAQ Page**: Comprehensive accordion-style FAQ section
- **Resources Page**: Downloadable guides and helpful links for parents and students
- **Testimonials Section**: Parent and student testimonials on homepage
- **Newsletter Signup**: Email subscription form for updates
- **Back-to-Top Button**: Smooth scroll navigation enhancement
- **404 Error Page**: Friendly custom error page
- **Google Maps Integration**: Interactive map on contact page
- **Enhanced Forms**: User-friendly success messages and loading states
- **Print Styles**: Optimized layouts for printing
- **Touch-Friendly**: 44px+ touch targets for mobile users

## File Structure

```
suzuki-website/
├── index.html              # Homepage with testimonials
├── about.html              # About the Suzuki Method
├── teachers.html           # Teachers directory
├── events.html             # Events calendar
├── board.html              # Board members
├── faq.html                # FAQ page (NEW)
├── resources.html          # Resources & downloads (NEW)
├── contact.html            # Contact page with map
├── 404.html                # Custom error page (NEW)
├── sitemap.xml             # SEO sitemap (NEW)
├── robots.txt              # Search engine directives (NEW)
├── favicon.svg             # Site favicon (NEW)
├── css/
│   └── styles.css          # Enhanced stylesheet
├── js/
│   └── main.js             # Enhanced JavaScript
├── images/
│   ├── logo.jpg            # Organization logo
│   └── logo.svg            # SVG logo
└── README.md               # This file
```

## 🚀 How to Preview the Website

There are several ways to preview your website locally:

### Option 1: Live Server (Recommended for Development)

**Using VS Code:**
1. Install the "Live Server" extension by Ritwick Dey
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Your browser will open at `http://localhost:5500` (or similar)
5. Changes auto-reload as you edit files

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Then open browser to http://localhost:8000
```

**Using Node.js:**
```bash
# Install http-server globally
npm install -g http-server

# Run server
http-server -p 8000

# Open browser to http://localhost:8000
```

### Option 2: Direct File Opening
1. Simply double-click `index.html`
2. It will open in your default browser
3. Note: Some features (like fonts or certain scripts) may not work correctly with `file://` protocol

### Option 3: Using npx (No Installation)
```bash
npx serve

# Or specify a port
npx serve -p 3000
```

### Testing Checklist
- [ ] Test all navigation links
- [ ] Submit contact form to see success message
- [ ] Submit newsletter form
- [ ] Click FAQ items to expand/collapse
- [ ] Test mobile responsive design (resize browser)
- [ ] Test back-to-top button (scroll down)
- [ ] Test keyboard navigation (Tab key)
- [ ] Test skip-to-content link (Tab once on page load)

## Setup Instructions

### 1. Replace the Logo

The current logo is a placeholder. To use your actual logo:

1. Replace `images/logo.jpg` with your organization's logo
2. Recommended size: 200x200 pixels or larger
3. Supported formats: JPG, PNG, or SVG

### 2. Update Social Media Links

In all HTML files, update the social media links in the footer:
- Facebook: Currently set to `https://www.facebook.com/suzukipgh/`
- Instagram: Currently set to `https://instagram.com/suzukipgh`

### 3. Customize Content

#### Events
Edit `events.html` to add/remove events:
```html
<div class="event-item" data-category="recital">
    <!-- Event details here -->
</div>
```

#### Teachers
Edit `teachers.html` to add/remove teachers or update contact information.

#### Board Members
Edit `board.html` to add actual board member information.

### 4. Form Integration

The contact forms currently show alerts. To integrate with a backend:

1. **Option A: Use a form service** (Formspree, Google Forms, etc.)
   ```html
   <form action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

2. **Option B: Create a backend endpoint**
   - Modify `js/main.js` to send form data to your server
   - Replace the `alert()` calls with actual form submission code

3. **Option C: Email integration**
   - Use mailto links or a PHP mailer script

## Deployment

### Option 1: Static Hosting (Recommended)

Deploy to any static hosting service:

**Netlify:**
1. Create account at netlify.com
2. Drag and drop the entire folder
3. Site goes live immediately
4. Free SSL certificate included

**GitHub Pages:**
1. Create a GitHub repository
2. Upload all files
3. Enable GitHub Pages in repository settings
4. Access at `username.github.io/repository-name`

**Vercel:**
1. Install Vercel CLI: `npm install -g vercel`
2. Run `vercel` in the project directory
3. Follow the prompts

### Option 2: Traditional Web Hosting

Upload via FTP/SFTP to any web hosting provider:
1. Connect to your hosting via FTP client (FileZilla, Cyberduck, etc.)
2. Upload all files to your public_html or www directory
3. Ensure proper permissions (644 for files, 755 for directories)

### Option 3: Cowork Integration

Since you mentioned Cowork, you can expose this folder:
1. Ensure all files are in the `/home/claude/suzuki-website` directory
2. The folder structure is ready for deployment
3. Point Cowork to serve this directory

## Customization Guide

### Colors

Edit CSS variables in `css/styles.css`:

```css
:root {
    --primary-color: #2C5F7C;      /* Main blue */
    --secondary-color: #8B4789;     /* Purple accent */
    --accent-color: #D4A574;        /* Gold accent */
}
```

### Fonts

Current fonts:
- **Display**: Crimson Pro (headings)
- **Body**: Work Sans (text)

To change fonts, update the Google Fonts import in HTML files and CSS variables.

### Adding New Pages

1. Copy an existing HTML file
2. Update the content
3. Add navigation link in the navbar of all pages
4. Update footer links

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Accessibility

- Semantic HTML5 structure
- Proper heading hierarchy
- Alt text for images (add to your actual images)
- ARIA labels for interactive elements
- Keyboard navigation support
- Color contrast meets WCAG 2.1 AA standards

## Maintenance

### Regular Updates Needed

1. **Events**: Update `events.html` with upcoming recitals and workshops
2. **Teachers**: Keep teacher contact information current
3. **Board**: Update board member information annually
4. **Footer**: Ensure copyright year is current (auto-updates via JS)

### Content Management

For easier content updates, consider:
- Converting to a CMS (WordPress, Netlify CMS)
- Using a static site generator (11ty, Hugo)
- Implementing a headless CMS (Contentful, Sanity)

## Technical Details

- **No dependencies**: Pure HTML, CSS, and vanilla JavaScript
- **No build process**: Ready to deploy as-is
- **Performance**: Optimized with minimal external resources
- **SEO**: Meta tags included, sitemap recommended for production

## Support

For questions about the website structure or customization, refer to:
- HTML/CSS basics: MDN Web Docs
- JavaScript: javascript.info
- Web hosting: Documentation from your hosting provider

## License

This website template is created for the Suzuki Association of Pittsburgh.
All content and branding belong to the Suzuki Association of Pittsburgh.

## Credits

- Design & Development: Custom built for Suzuki Association of Pittsburgh
- Fonts: Google Fonts (Crimson Pro, Work Sans)
- Icons: Inline SVG icons
- Emojis: Unicode standard

---

**Last Updated:** January 2026

For technical assistance or questions, contact your web administrator.
