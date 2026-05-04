# Presentations Repository

This repository hosts a collection of slide presentations built with HTML, CSS, and JavaScript, published via GitHub Pages.

## 🌐 Live Site

Visit the presentations at: **https://marconsilva.github.io/presentations/**

## 📁 Structure

```
├── index.html                  # Homepage listing all presentations
├── presentations.json          # Registry of all presentations
├── assets/
│   ├── css/
│   │   ├── homepage.css        # Homepage styles
│   │   └── slides.css          # Slide engine styles & framework
│   └── js/
│       ├── homepage.js         # Homepage dynamic listing
│       └── slides.js           # Slide engine (navigation, fullscreen, etc.)
├── presentations/
│   ├── _template/              # Template for new presentations
│   └── {presentation-slug}/    # Individual presentations
│       ├── index.html          # Landing page (title, abstract, events)
│       ├── slides.html         # The slide deck
│       └── images/             # Presentation-specific images
└── .github/
    └── agents/
        └── presentation-creator.md  # Copilot agent for creating presentations
```

## 🎯 Creating a New Presentation

Use the **Presentation Creator** Copilot agent (`@presentation-creator`) with:
- A title
- An abstract
- Guidelines for style/content
- Optionally, a reference PDF

The agent will scaffold the landing page, slide deck, and registry entry.

## 🖥️ Slide Engine Features

- **Navigation**: Click, arrow keys, spacebar, or swipe to advance
- **Fragments**: Elements with `.fragment` class appear one-by-one
- **Layouts**: Center, top, split, grid
- **Animations**: Fade, scale, slide-up with stagger support
- **Fullscreen**: Press `F` to toggle fullscreen mode
- **Progress Bar**: Shows current position in the deck
- **Hash Navigation**: Direct link to any slide via URL hash
- **Responsive**: Works on desktop, tablet, and mobile
- **Themeable**: Override CSS variables per presentation

## 🚀 Publishing

This repository is configured for GitHub Pages. Push to `main` and the site deploys automatically.

## 📝 License

All presentation content © Marco Silva. The slide engine code is MIT licensed.
