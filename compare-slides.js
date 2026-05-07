// Compare original image slides with their HTML duplicate versions
// Slides: 5/6 (azure-stats), 6/7 (migrate-modernize), 14/15 (custom-agents), 24/25 (spec-shift), 26/27 (spec2cloud)

const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

  const slidesPath = path.resolve(__dirname, 'presentations/autonomy-unleashed-agent-framework/slides.html');
  const fileUrl = `file:///${slidesPath.replace(/\\/g, '/')}`;

  // We need to figure out the slide indices of originals and duplicates
  // Load the page and count slides
  const page = await context.newPage();
  await page.goto(fileUrl);
  await page.waitForTimeout(2000);

  const totalSlides = await page.locator('section.slide').count();
  console.log(`Total slides: ${totalSlides}`);

  // Get all slides info for identification
  const slideInfo = await page.evaluate(() => {
    const slides = document.querySelectorAll('section.slide');
    return Array.from(slides).map((s, i) => {
      const img = s.querySelector('img');
      const comment = s.previousElementSibling ? '' : '';
      // Check if it's an image slide
      const isImage = s.classList.contains('slide-image');
      // Check for specific identifiers
      const text = s.innerText.substring(0, 100);
      const hasImg = img ? img.alt.substring(0, 50) : null;
      return { index: i + 1, isImage, text: text.trim(), imgAlt: hasImg };
    });
  });

  // Find the pairs - image slides followed by their HTML duplicates
  const pairs = [];
  for (let i = 0; i < slideInfo.length - 1; i++) {
    const current = slideInfo[i];
    const next = slideInfo[i + 1];
    
    // Match: azure-stats image followed by HTML duplicate
    if (current.imgAlt && current.imgAlt.includes('Develop intelligent apps faster')) {
      pairs.push({ name: 'Azure Stats (Slide 5)', original: i + 1, duplicate: i + 2 });
    }
    // Match: migrate-modernize image followed by HTML duplicate
    if (current.imgAlt && current.imgAlt.includes('Migrate and modernize')) {
      pairs.push({ name: 'Migrate & Modernize (Slide 6)', original: i + 1, duplicate: i + 2 });
    }
    // Match: custom-agents image followed by HTML duplicate
    if (current.imgAlt && current.imgAlt.includes('Custom Agents')) {
      pairs.push({ name: 'Custom Agents Overview (Slide 14)', original: i + 1, duplicate: i + 2 });
    }
    // Match: spec-driven-shift image followed by HTML duplicate
    if (current.imgAlt && current.imgAlt.includes('Spec-Driven Development - The shift')) {
      pairs.push({ name: 'Spec-Driven Shift (Slide 24)', original: i + 1, duplicate: i + 2 });
    }
    // Match: spec2cloud-overview image followed by HTML duplicate
    if (current.imgAlt && current.imgAlt.includes('Spec to Cloud')) {
      pairs.push({ name: 'Spec2Cloud Overview (Slide 26)', original: i + 1, duplicate: i + 2 });
    }
  }

  console.log(`\nFound ${pairs.length} slide pairs to compare:\n`);

  for (const pair of pairs) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📊 ${pair.name}`);
    console.log(`   Original: Slide #${pair.original} | Duplicate: Slide #${pair.duplicate}`);
    console.log(`${'='.repeat(60)}`);

    // Navigate to original
    await page.goto(`${fileUrl}#${pair.original}`);
    await page.waitForTimeout(1000);
    
    // Get original content
    const originalContent = await page.evaluate((idx) => {
      const slides = document.querySelectorAll('section.slide');
      const slide = slides[idx - 1];
      if (!slide) return { text: '', hasImg: false };
      const img = slide.querySelector('img');
      return {
        text: slide.innerText.trim(),
        hasImg: !!img,
        imgAlt: img ? img.alt : '',
        visible: slide.classList.contains('active')
      };
    }, pair.original);

    // Navigate to duplicate
    await page.goto(`${fileUrl}#${pair.duplicate}`);
    await page.waitForTimeout(1000);

    // Get duplicate content
    const duplicateContent = await page.evaluate((idx) => {
      const slides = document.querySelectorAll('section.slide');
      const slide = slides[idx - 1];
      if (!slide) return { text: '', elements: [] };
      
      // Get all text content
      const text = slide.innerText.trim();
      
      // Check specific elements
      const headings = Array.from(slide.querySelectorAll('h2, h3, h4')).map(h => h.textContent.trim());
      const paragraphs = Array.from(slide.querySelectorAll('p')).map(p => p.textContent.trim()).filter(t => t.length > 0);
      const hasImg = !!slide.querySelector('img');
      const hasSvg = !!slide.querySelector('svg');
      const visible = slide.classList.contains('active');

      return { text, headings, paragraphs, hasImg, hasSvg, visible };
    }, pair.duplicate);

    console.log(`\n   ORIGINAL (image slide):`);
    console.log(`   - Has image: ${originalContent.hasImg}`);
    console.log(`   - Alt text: "${originalContent.imgAlt}"`);
    console.log(`   - Is active: ${originalContent.visible}`);

    console.log(`\n   DUPLICATE (HTML slide):`);
    console.log(`   - Has image: ${duplicateContent.hasImg} (should be false)`);
    console.log(`   - Has SVG: ${duplicateContent.hasSvg}`);
    console.log(`   - Is active: ${duplicateContent.visible}`);
    console.log(`   - Headings: ${duplicateContent.headings ? duplicateContent.headings.join(' | ') : 'none'}`);
    console.log(`   - Text content (first 200 chars): "${duplicateContent.text.substring(0, 200)}"`);

    // Content validation
    console.log(`\n   ✅ VALIDATION:`);
    
    if (duplicateContent.hasImg) {
      console.log(`   ❌ FAIL: Duplicate still contains an <img> tag - should be pure HTML`);
    } else {
      console.log(`   ✔️  No image tag in duplicate (pure HTML)`);
    }

    if (!duplicateContent.text || duplicateContent.text.length < 10) {
      console.log(`   ❌ FAIL: Duplicate has no/very little text content`);
    } else {
      console.log(`   ✔️  Has text content (${duplicateContent.text.length} chars)`);
    }

    // Check key content elements based on the pair name
    if (pair.name.includes('Azure Stats')) {
      const has50 = duplicateContent.text.includes('50%');
      const has15 = duplicateContent.text.includes('1.5');
      const has150 = duplicateContent.text.includes('150%');
      const hasTitle = duplicateContent.text.includes('Develop intelligent apps faster');
      console.log(`   ${hasTitle ? '✔️ ' : '❌'} Title "Develop intelligent apps faster on Azure"`);
      console.log(`   ${has50 ? '✔️ ' : '❌'} Stat: 50%`);
      console.log(`   ${has15 ? '✔️ ' : '❌'} Stat: 1.5`);
      console.log(`   ${has150 ? '✔️ ' : '❌'} Stat: 150%`);
    }

    if (pair.name.includes('Migrate')) {
      const hasTitle = duplicateContent.text.includes('Migrate and modernize');
      const hasStreamline = duplicateContent.text.includes('Streamline data');
      const hasModernize = duplicateContent.text.includes('Modernize apps');
      const hasSimplify = duplicateContent.text.includes('Simplify operations');
      const hasQuote1 = duplicateContent.text.includes('transportation services');
      const hasQuote2 = duplicateContent.text.includes('Andrew Haigh');
      const hasQuote3 = duplicateContent.text.includes('Daniel Engberg');
      console.log(`   ${hasTitle ? '✔️ ' : '❌'} Title "Migrate and modernize to innovate with AI"`);
      console.log(`   ${hasStreamline ? '✔️ ' : '❌'} Column: Streamline data`);
      console.log(`   ${hasModernize ? '✔️ ' : '❌'} Column: Modernize apps`);
      console.log(`   ${hasSimplify ? '✔️ ' : '❌'} Column: Simplify operations`);
      console.log(`   ${hasQuote1 ? '✔️ ' : '❌'} Quote 1: transportation services org`);
      console.log(`   ${hasQuote2 ? '✔️ ' : '❌'} Quote 2: Andrew Haigh, Asda`);
      console.log(`   ${hasQuote3 ? '✔️ ' : '❌'} Quote 3: Daniel Engberg, SAS`);
    }

    if (pair.name.includes('Custom Agents')) {
      const hasInstructions = duplicateContent.text.includes('Copilot Instructions');
      const hasPrompts = duplicateContent.text.includes('Prompts');
      const hasMCP = duplicateContent.text.includes('Model Context Protocol');
      const hasSkills = duplicateContent.text.includes('Skills');
      const hasCustomAgents = duplicateContent.text.includes('Custom Agents');
      const hasGithub = duplicateContent.text.includes('GitHub');
      const hasPlaywright = duplicateContent.text.includes('Playwright');
      console.log(`   ${hasInstructions ? '✔️ ' : '❌'} Card: Copilot Instructions`);
      console.log(`   ${hasPrompts ? '✔️ ' : '❌'} Card: Prompts`);
      console.log(`   ${hasMCP ? '✔️ ' : '❌'} Card: Model Context Protocol (MCP)`);
      console.log(`   ${hasSkills ? '✔️ ' : '❌'} Card: Skills`);
      console.log(`   ${hasCustomAgents ? '✔️ ' : '❌'} Card: Custom Agents`);
      console.log(`   ${hasGithub ? '✔️ ' : '❌'} MCP item: GitHub`);
      console.log(`   ${hasPlaywright ? '✔️ ' : '❌'} MCP item: Playwright`);
    }

    if (pair.name.includes('Spec-Driven Shift')) {
      const hasTitle = duplicateContent.text.includes('Spec-Driven Development');
      const hasFrom = duplicateContent.text.includes('From');
      const hasTo = duplicateContent.text.includes('To');
      const hasCodeCentric = duplicateContent.text.includes('Code-Centric Delivery');
      const hasSpecCentric = duplicateContent.text.includes('Spec-Centric Delivery');
      const hasHumanHeavy = duplicateContent.text.includes('Human-Heavy Development');
      const hasAIAugmented = duplicateContent.text.includes('AI-Augmented Development');
      const hasDocAfter = duplicateContent.text.includes('Documentation as an Afterthought');
      const hasDocComm = duplicateContent.text.includes('Documentation as Communication');
      const hasValueExec = duplicateContent.text.includes('Value in Execution');
      const hasValueDesign = duplicateContent.text.includes('Value in Design');
      console.log(`   ${hasTitle ? '✔️ ' : '❌'} Title: "What is Spec-Driven Development?"`);
      console.log(`   ${hasFrom ? '✔️ ' : '❌'} "From" label`);
      console.log(`   ${hasTo ? '✔️ ' : '❌'} "To" label`);
      console.log(`   ${hasCodeCentric ? '✔️ ' : '❌'} From: Code-Centric Delivery`);
      console.log(`   ${hasSpecCentric ? '✔️ ' : '❌'} To: Spec-Centric Delivery`);
      console.log(`   ${hasHumanHeavy ? '✔️ ' : '❌'} From: Human-Heavy Development`);
      console.log(`   ${hasAIAugmented ? '✔️ ' : '❌'} To: AI-Augmented Development`);
      console.log(`   ${hasDocAfter ? '✔️ ' : '❌'} From: Documentation as an Afterthought`);
      console.log(`   ${hasDocComm ? '✔️ ' : '❌'} To: Documentation as Communication`);
      console.log(`   ${hasValueExec ? '✔️ ' : '❌'} From: Value in Execution`);
      console.log(`   ${hasValueDesign ? '✔️ ' : '❌'} To: Value in Design`);
    }

    if (pair.name.includes('Spec2Cloud Overview')) {
      const hasTitle = duplicateContent.text.includes('Building Agents at Scale');
      const hasSpec = duplicateContent.text.includes('Spec');
      const hasPlan = duplicateContent.text.includes('Plan');
      const hasCode = duplicateContent.text.includes('Code');
      const hasTest = duplicateContent.text.includes('Test');
      const hasDeploy = duplicateContent.text.includes('Deploy');
      const hasDesigner = duplicateContent.text.includes('Designer');
      const hasPlanner = duplicateContent.text.includes('Planner');
      const hasCoder = duplicateContent.text.includes('Coder');
      const hasTester = duplicateContent.text.includes('Tester');
      const hasDeployer = duplicateContent.text.includes('Deployer');
      const hasFoundry = duplicateContent.text.includes('Microsoft Foundry');
      const hasAIApps = duplicateContent.text.includes('AI Apps & Agents');
      const hasLink = duplicateContent.text.includes('aka.ms/spec2cloud');
      console.log(`   ${hasTitle ? '✔️ ' : '❌'} Title: "Building Agents at Scale"`);
      console.log(`   ${hasSpec ? '✔️ ' : '❌'} Pipeline step: Spec`);
      console.log(`   ${hasPlan ? '✔️ ' : '❌'} Pipeline step: Plan`);
      console.log(`   ${hasCode ? '✔️ ' : '❌'} Pipeline step: Code`);
      console.log(`   ${hasTest ? '✔️ ' : '❌'} Pipeline step: Test`);
      console.log(`   ${hasDeploy ? '✔️ ' : '❌'} Pipeline step: Deploy`);
      console.log(`   ${hasDesigner ? '✔️ ' : '❌'} Agent role: Designer`);
      console.log(`   ${hasPlanner ? '✔️ ' : '❌'} Agent role: Planner`);
      console.log(`   ${hasCoder ? '✔️ ' : '❌'} Agent role: Coder`);
      console.log(`   ${hasTester ? '✔️ ' : '❌'} Agent role: Tester`);
      console.log(`   ${hasDeployer ? '✔️ ' : '❌'} Agent role: Deployer`);
      console.log(`   ${hasFoundry ? '✔️ ' : '❌'} Microsoft Foundry section`);
      console.log(`   ${hasAIApps ? '✔️ ' : '❌'} AI Apps & Agents section`);
      console.log(`   ${hasLink ? '✔️ ' : '❌'} Link: aka.ms/spec2cloud`);
    }
  }

  console.log(`\n\n${'='.repeat(60)}`);
  console.log(`SUMMARY: Compared ${pairs.length} slide pairs`);
  console.log(`${'='.repeat(60)}`);

  await browser.close();
})();
