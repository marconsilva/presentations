# Copilot Instructions for Presentations Repository

## Repository Purpose
This repository hosts HTML/CSS/JS slide presentations published via GitHub Pages.

## Key Conventions
- Each presentation lives in `presentations/{slug}/` with an `index.html` (landing page) and `slides.html` (deck)
- All presentations must be registered in `presentations.json` at the repo root
- The slide engine (`assets/js/slides.js` + `assets/css/slides.css`) is shared across all presentations
- Presentations reference shared assets via relative paths (`../../assets/`)
- Use inline SVG for diagrams rather than external image files when possible
- Theme customization is done via CSS variable overrides in each presentation's `<style>` block

## File Naming
- Presentation slugs: lowercase, hyphenated (e.g., `building-microservices`)
- Image files: descriptive, lowercase, hyphenated

## Design Standards
- Each slide should convey ONE main idea
- Use `.fragment` class for progressive disclosure
- Prefer visual content (diagrams, grids) over walls of text
- Maintain readable font sizes (minimum 1.2rem for body text)
- Use the grid system for comparisons and multi-item layouts
