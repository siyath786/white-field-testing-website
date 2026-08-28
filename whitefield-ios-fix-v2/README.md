# White Field Bakery — Our Special Cake Menu

A professional, fully responsive static bakery showcase website built from the supplied White Field Bakery project.

## Latest menu update

- Replaced the category/filter menu with a single **OUR SPECIAL** section.
- Added **two rows of cakes** with a horizontal **flex** layout — no CSS grid for the cake rows.
- Added 10 different cake cards, with 5 cards in each row.
- Increased cake image/card size to closely match the supplied Greatest Bakery reference screenshot.
- The same two-row flex structure is used on mobile; each row remains swipe/trackpad friendly.
- Horizontal scrollbars are hidden on desktop, tablet and mobile.
- Added subtle GSAP entrance/stagger animations for the cake cards.
- Preserved the existing product-detail modal and WhatsApp enquiry behavior.
- Preserved the rest of the website sections and responsive navigation.

## Files

- `index.html` — complete website
- `style.css` — responsive layout and menu styling
- `script.js` — GSAP animations, modal, navigation and remaining interactions
- `README.md` — project notes

## Notes

The cake photos currently use remote Unsplash image URLs, matching the existing project's image approach. Replace them with the bakery's own optimized WebP/JPG images before production if you have them.

GSAP, ScrollTrigger and ScrollToPlugin continue to load from the CDN used by the original project. If GSAP is unavailable, the website remains usable with the existing native behavior.

## Run

Open `index.html` directly in a browser, or use VS Code + Live Server.
