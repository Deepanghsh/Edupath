const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.toString()));
  
  console.log("Navigating to http://localhost:5174/");
  await page.goto('http://localhost:5174/');
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Typing admin credentials...");
  
  // click "Login as Admin" tab
  const tabs = await page.$$('button');
  for (const t of tabs) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text.includes('Admin Login')) {
      await t.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 500));
  
  // click login button
  const btns = await page.$$('button');
  for (const t of btns) {
    const text = await page.evaluate(el => el.textContent, t);
    if (text === 'Sign In' || text === 'Login' || text.includes('Login to Dashboard')) {
      await t.click();
      break;
    }
  }
  await new Promise(r => setTimeout(r, 2000));
  
  console.log("Looking around tabs...");
  const adminTabs = await page.$$('div.cursor-pointer');
  for (const t of adminTabs) {
    await t.click();
    await new Promise(r => setTimeout(r, 500));
  }
  
  await browser.close();
})();
