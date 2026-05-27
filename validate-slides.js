const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const repoRoot = __dirname;
const presentations = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'presentations.json'), 'utf-8')
).presentations;

function getContentType(filePath) {
  const contentTypes = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4'
  };

  return contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

function startServer(rootDir) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const resolvedPath = path.normalize(
        path.join(rootDir, requestPath === '/' ? 'index.html' : requestPath)
      );

      if (!resolvedPath.startsWith(rootDir)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
      }

      let filePath = resolvedPath;
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }

      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': getContentType(filePath) });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, baseUrl: `http://127.0.0.1:${server.address().port}` });
    });
  });
}

function buildPages() {
  return [
    { name: 'Homepage', url: '/', path: path.join(repoRoot, 'index.html'), isSlides: false },
    ...presentations.flatMap((presentation) => {
      const basePath = path.join(repoRoot, 'presentations', presentation.slug);
      const indexPath = path.join(basePath, 'index.html');
      const slidesPath = path.join(basePath, 'slides.html');

      if (!fs.existsSync(indexPath) || !fs.existsSync(slidesPath)) {
        console.log(`Skipping ${presentation.slug}: missing index.html or slides.html`);
        return [];
      }

      return [
        {
          name: `Landing Page (${presentation.slug})`,
          url: `/presentations/${presentation.slug}/`,
          path: indexPath,
          isSlides: false
        },
        {
          name: `Slides (${presentation.slug})`,
          url: `/presentations/${presentation.slug}/slides.html`,
          path: slidesPath,
          isSlides: true
        }
      ];
    })
  ];
}

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  const { server, baseUrl } = await startServer(repoRoot);
  let hasErrors = false;

  try {
    for (const currentPage of buildPages()) {
      const errors = [];
      const warnings = [];

      const onConsole = (msg) => {
        if (msg.type() === 'error') errors.push(`[CONSOLE ERROR] ${msg.text()}`);
        if (msg.type() === 'warning') warnings.push(`[CONSOLE WARN] ${msg.text()}`);
      };

      const onPageError = (err) => {
        errors.push(`[PAGE ERROR] ${err.message}`);
      };

      const onRequestFailed = (request) => {
        const message = `[NETWORK ERROR] ${request.url()} - ${request.failure().errorText}`;
        if (request.url().startsWith(baseUrl)) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      };

      page.on('console', onConsole);
      page.on('pageerror', onPageError);
      page.on('requestfailed', onRequestFailed);

      console.log(`\n${'='.repeat(60)}`);
      console.log(`TESTING: ${currentPage.name}`);
      console.log(`${'='.repeat(60)}`);

      await page.goto(`${baseUrl}${currentPage.url}`, { waitUntil: 'networkidle' });

      const title = await page.title();
      console.log(`  Title: ${title}`);

      if (currentPage.isSlides) {
        const slideCount = await page.locator('.slide').count();
        console.log(`  Slides found: ${slideCount}`);

        const activeSlides = await page.locator('.slide.active').count();
        console.log(`  Active slides: ${activeSlides}`);
        if (activeSlides !== 1) {
          errors.push(`[LOGIC ERROR] Expected 1 active slide, found ${activeSlides}`);
        }

        for (let i = 0; i < 5; i++) {
          await page.keyboard.press('ArrowRight');
          await page.waitForTimeout(250);
        }

        const activeAfterNavigation = await page.locator('.slide.active').count();
        if (activeAfterNavigation !== 1) {
          errors.push(`[LOGIC ERROR] After navigation, expected 1 active slide, found ${activeAfterNavigation}`);
        }

        const fragmentCount = await page.locator('.fragment').count();
        console.log(`  Fragments found: ${fragmentCount}`);

        const progressBar = await page.locator('.slide-progress').count();
        console.log(`  Progress bar: ${progressBar > 0 ? 'yes' : 'MISSING'}`);
        if (progressBar === 0) {
          errors.push('[LOGIC ERROR] Missing progress bar');
        }

        const slideNumber = await page.locator('.slide-number').count();
        console.log(`  Slide number: ${slideNumber > 0 ? 'yes' : 'MISSING'}`);
        if (slideNumber === 0) {
          errors.push('[LOGIC ERROR] Missing slide number');
        }

        const emptySlides = [];
        for (let i = 0; i < slideCount; i++) {
          const html = await page.locator('.slide').nth(i).innerHTML();
          if (html.trim().length === 0) {
            emptySlides.push(i + 1);
          }
        }
        if (emptySlides.length > 0) {
          errors.push(`[CONTENT ERROR] Empty slides: ${emptySlides.join(', ')}`);
        }

        const svgCount = await page.locator('svg').count();
        console.log(`  SVG diagrams: ${svgCount}`);

        const zeroSizeSlides = [];
        for (let i = 0; i < slideCount; i++) {
          const box = await page.locator('.slide').nth(i).boundingBox();
          if (box && (box.width === 0 || box.height === 0)) {
            zeroSizeSlides.push(i + 1);
          }
        }
        if (zeroSizeSlides.length > 0) {
          errors.push(`[LAYOUT ERROR] Slides with zero dimensions: ${zeroSizeSlides.join(', ')}`);
        }

        const htmlContent = fs.readFileSync(currentPage.path, 'utf-8');
        const openSections = (htmlContent.match(/<section\b/g) || []).length;
        const closeSections = (htmlContent.match(/<\/section>/g) || []).length;
        if (openSections !== closeSections) {
          errors.push(`[HTML ERROR] Mismatched section tags: ${openSections} opening vs ${closeSections} closing`);
        }

        const openDivs = (htmlContent.match(/<div\b/g) || []).length;
        const closeDivs = (htmlContent.match(/<\/div>/g) || []).length;
        if (openDivs !== closeDivs) {
          errors.push(`[HTML ERROR] Mismatched div tags: ${openDivs} opening vs ${closeDivs} closing`);
        }
      }

      if (errors.length > 0) {
        hasErrors = true;
        console.log(`\n  ❌ ERRORS (${errors.length}):`);
        errors.forEach((error) => console.log(`    ${error}`));
      } else {
        console.log('\n  ✅ No errors found');
      }

      if (warnings.length > 0) {
        console.log(`\n  ⚠️  WARNINGS (${warnings.length}):`);
        warnings.forEach((warning) => console.log(`    ${warning}`));
      }

      page.off('console', onConsole);
      page.off('pageerror', onPageError);
      page.off('requestfailed', onRequestFailed);
    }
  } finally {
    server.close();
    await browser.close();
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log(hasErrors ? 'VALIDATION FAILED' : 'VALIDATION COMPLETE');
  console.log(`${'='.repeat(60)}`);

  if (hasErrors) {
    process.exitCode = 1;
  }
})();
