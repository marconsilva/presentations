const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  const errors = [];
  const warnings = [];

  // Collect console errors and warnings
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
    if (msg.type() === 'warning') warnings.push(`[CONSOLE WARN] ${msg.text()}`);
  });

  // Collect page errors (uncaught exceptions)
  page.on('pageerror', err => {
    errors.push(`[PAGE ERROR] ${err.message}`);
  });

  // Collect failed requests
  page.on('requestfailed', request => {
    errors.push(`[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`);
  });

  const slidesPath = path.resolve(__dirname, 'presentations/autonomy-unleashed-agent-framework/slides.html');
  const indexPath = path.resolve(__dirname, 'presentations/autonomy-unleashed-agent-framework/index.html');
  const slidesPath2 = path.resolve(__dirname, 'presentations/age-of-coding-agents/slides.html');
  const indexPath2 = path.resolve(__dirname, 'presentations/age-of-coding-agents/index.html');
  const homePath = path.resolve(__dirname, 'index.html');

  const pages = [
    { name: 'Homepage', path: homePath },
    { name: 'Landing Page', path: indexPath },
    { name: 'Slides', path: slidesPath },
    { name: 'Landing Page (Age of Coding Agents)', path: indexPath2 },
    { name: 'Slides', path: slidesPath2 },
  ];

  for (const p of pages) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`TESTING: ${p.name}`);
    console.log(`${'='.repeat(60)}`);
    
    errors.length = 0;
    warnings.length = 0;

    const fileUrl = `file:///${p.path.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle' });

    // Check for basic rendering
    const title = await page.title();
    console.log(`  Title: ${title}`);

    // For slides, test navigation
    if (p.name === 'Slides') {
      const slideCount = await page.locator('.slide').count();
      console.log(`  Slides found: ${slideCount}`);

      // Check active slide
      const activeSlides = await page.locator('.slide.active').count();
      console.log(`  Active slides: ${activeSlides}`);

      if (activeSlides !== 1) {
        errors.push(`[LOGIC ERROR] Expected 1 active slide, found ${activeSlides}`);
      }

      // Test click navigation (advance a few slides)
      for (let i = 0; i < 5; i++) {
        await page.keyboard.press('ArrowRight');
        await page.waitForTimeout(700);
      }

      const currentActive = await page.locator('.slide.active').count();
      if (currentActive !== 1) {
        errors.push(`[LOGIC ERROR] After navigation, expected 1 active slide, found ${currentActive}`);
      }

      // Check for fragments
      const fragmentCount = await page.locator('.fragment').count();
      console.log(`  Fragments found: ${fragmentCount}`);

      // Check progress bar exists
      const progressBar = await page.locator('.slide-progress').count();
      console.log(`  Progress bar: ${progressBar > 0 ? 'yes' : 'MISSING'}`);

      // Check slide number exists
      const slideNumber = await page.locator('.slide-number').count();
      console.log(`  Slide number: ${slideNumber > 0 ? 'yes' : 'MISSING'}`);

      // Check all slides have content
      const emptySlides = [];
      for (let i = 0; i < slideCount; i++) {
        const slide = page.locator('.slide').nth(i);
        const html = await slide.innerHTML();
        if (html.trim().length === 0) {
          emptySlides.push(i + 1);
        }
      }
      if (emptySlides.length > 0) {
        errors.push(`[CONTENT ERROR] Empty slides: ${emptySlides.join(', ')}`);
      }

      // Check SVG diagrams render
      const svgCount = await page.locator('svg').count();
      console.log(`  SVG diagrams: ${svgCount}`);

      // Check for broken CSS (elements with 0 dimensions that shouldn't be)
      const slides = await page.locator('.slide').all();
      let zeroSizeSlides = [];
      for (let i = 0; i < slides.length; i++) {
        const box = await slides[i].boundingBox();
        if (box && (box.width === 0 || box.height === 0)) {
          zeroSizeSlides.push(i + 1);
        }
      }
      if (zeroSizeSlides.length > 0) {
        errors.push(`[LAYOUT ERROR] Slides with zero dimensions: ${zeroSizeSlides.join(', ')}`);
      }

      // Validate HTML structure - check no unclosed tags cause issues
      const htmlContent = fs.readFileSync(p.path, 'utf-8');
      
      // Check matching slide sections
      const openTags = (htmlContent.match(/<section/g) || []).length;
      const closeTags = (htmlContent.match(/<\/section>/g) || []).length;
      if (openTags !== closeTags) {
        errors.push(`[HTML ERROR] Mismatched section tags: ${openTags} opening vs ${closeTags} closing`);
      }

      // Check for unclosed divs in slides
      const openDivs = (htmlContent.match(/<div/g) || []).length;
      const closeDivs = (htmlContent.match(/<\/div>/g) || []).length;
      if (openDivs !== closeDivs) {
        errors.push(`[HTML ERROR] Mismatched div tags: ${openDivs} opening vs ${closeDivs} closing`);
      }
    }

    // Report
    if (errors.length > 0) {
      console.log(`\n  ❌ ERRORS (${errors.length}):`);
      errors.forEach(e => console.log(`    ${e}`));
    } else {
      console.log(`\n  ✅ No errors found`);
    }

    if (warnings.length > 0) {
      console.log(`\n  ⚠️  WARNINGS (${warnings.length}):`);
      warnings.forEach(w => console.log(`    ${w}`));
    }
  }

  await browser.close();
  
  console.log(`\n${'='.repeat(60)}`);
  console.log('VALIDATION COMPLETE');
  console.log(`${'='.repeat(60)}`);
})();
