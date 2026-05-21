const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log("Navigating to http://localhost:5174/");
  await page.goto('http://localhost:5174/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Logging in as Admin...");
  const tabs = await page.$$('button');
  for (const t of tabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text.includes('Admin Login')) {
      await t.click(); break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  
  const btns = await page.$$('button');
  for (const t of btns) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text === 'Sign In' || text === 'Login') {
      await t.click(); break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Going to VerificationTab...");
  const adminTabs = await page.$$('div.cursor-pointer, nav > div');
  for (const t of adminTabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text && text.includes('Document Verification')) {
      await t.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Clicking Reject...");
  const rejectBtns = await page.$$('button');
  for (const b of rejectBtns) {
    const txt = await page.evaluate(el => el.textContent, b);
    if (txt && txt.includes('Reject')) {
      console.log("Clicked:", txt);
      await b.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 1000));
  
  console.log("Done.");
  await browser.close();
})();
