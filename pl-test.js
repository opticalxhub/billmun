const { chromium } = require('@playwright/test');
const fs = require('fs');


const ROLES = [
  { role: 'DELEGATE', email: 'testdel7@billmun.test', pass: 'Pookie123!' },
  { role: 'CHAIR', email: 'testchair7@billmun.test', pass: 'Pookie123!' },
  { role: 'ADMIN', email: 'testadmin7@billmun.test', pass: 'Pookie123!' },
  { role: 'MEDIA', email: 'testmedia7@billmun.test', pass: 'Pookie123!' },
  { role: 'PRESS', email: 'testpress7@billmun.test', pass: 'Pookie123!' },
  { role: 'SECURITY', email: 'testsecurity7@billmun.test', pass: 'Pookie123!' },
  { role: 'EXECUTIVE_BOARD', email: 'testeb7@billmun.test', pass: 'Pookie123!' }
];

async function runTests() {
  const browser = await chromium.launch({ headless: true });
  const ALL_ERRORS = [];
  
  for (let u of ROLES) {
    console.log(`\n================================`);
    console.log(`🧪 TESTING FRONTEND ROLE: ${u.role} => ${u.email}`);
    
    const context = await browser.newContext();
    const page = await context.newPage();
    let consoleErrors = [];
    page.on('console', msg => { if (msg.type() === 'error') consoleErrors.push(msg.text() || 'Uncaught Exception'); });
    page.on('pageerror', error => consoleErrors.push(error.message));
    page.on('requestfailed', request => consoleErrors.push(`Request failed: ${request.url()} - ${request.failure()?.errorText}`));

    try {
      // 1. LOGIN
      await page.goto('http://localhost:3000/login');
      // Supabase is taking about 1s to fully hydrate state, wait for form.
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.fill('input[type="email"]', u.email);
      await page.fill('input[type="password"]', u.pass);
      await page.click('button[type="submit"]');

      // 2. WAIT FOR REDIRECT
      await page.waitForNavigation({ timeout: 15000 });
      
      const currentUrl = page.url();
      if (currentUrl.includes('/login') || currentUrl.includes('/register') || currentUrl.includes('error')) {
         console.log(`❌ ${u.role} failed to login or hit unapproved state! URL: ${currentUrl}`);
         ALL_ERRORS.push(`[${u.role}] Login Failed. Stopped at ${currentUrl}`);
         await context.close();
         continue;
      }
      
      console.log(`✅ Logged in successfully. Current URL: ${currentUrl}`);

      // 3. SCAN DASHBOARD FOR TABS (Using semantic buttons/tabs)
      // Different dashboards have different styles (some use <a>, some use <button> with border-primary)
      // I will find all clickable navigation items inside the dashboard container.
      // Usually, tabs are inside a flex container or have 'Tab' in aria-label, wait, mostly buttons with uppercase or icon
      // Let's just find all large buttons that look like tabs. Let's look for uppercase buttons inside `border-b` / sidebar.

      const tabSelectors = [
         'button:has(svg)', 
         'a[href^="/dashboard"]',
         'a[href^="/eb/dash"]',
         '.border-b button',
         'nav button',
         'aside button',
         'div[role="tab"]',
         'button.min-h-\\[44px\\]' 
      ];

      // Wait 3 seconds for the hydration data to fully fetch
      await page.waitForTimeout(3000);
      
      const tabHandles = await page.$$(tabSelectors.join(', '));
      let clickedNames = new Set();
      
      console.log(`🕵️‍♂️ Found approx ${tabHandles.length} interactive elements to test...`);
      
      for (let btn of tabHandles) {
          try {
             const isVisible = await btn.isVisible();
             if (!isVisible) continue;
             
             let text = await btn.innerText();
             text = text.trim();
             if (!text || text === '') continue; // skip pure icon buttons usually
             
             // Ignore basic controls like Log Out or generic labels
             if (text.includes('LOG OUT') || text.includes('Report an issue') || text.toLowerCase().includes('welcome')) continue;
             if (clickedNames.has(text)) continue;
             
             clickedNames.add(text);
             console.log(`   👉 Clicking Tab: [${text}]`);
             await btn.click({ force: true, timeout: 2000 });
             await page.waitForTimeout(1500); // 1.5s for React component switch and DB fetch
             
          } catch(e) {
             // Just a skipped element.
          }
      }

      console.log(`✅ Tested Tabs: ${Array.from(clickedNames).join(', ')}`);
      
      if (consoleErrors.length > 0) {
         console.log(`❌ ${consoleErrors.length} Console/React errors caught!`);
         ALL_ERRORS.push(`[${u.role}] -> ${consoleErrors.join(', ')}`);
      } else {
         console.log(`✅ No frontend crashes detected.`);
      }

    } catch (e) {
      console.log(`❌ [FATAL] ${e.message}`);
      ALL_ERRORS.push(`[${u.role}] Fatal Execution Error: ${e.message}`);
    }
    await context.close();
  }
  
  await browser.close();
  
  let finalLog = "\n================================\n";
  if (ALL_ERRORS.length > 0) {
      finalLog += `🚨 BUG REPORT - FRONTEND:\n` + ALL_ERRORS.join('\n');
  } else {
      finalLog += `🎉 ALL FRONTEND DASHBOARDS PERFECT!`;
  }
  
  console.log(finalLog);
  fs.writeFileSync('playwright_results.json', JSON.stringify(ALL_ERRORS, null, 2));
}
runTests();
