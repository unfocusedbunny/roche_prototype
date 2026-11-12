/* Drives the page in headless Chrome (software graphics) and saves pictures.
   node scripts/check.mjs <outDir> [--w=1440] [--h=900] [--reduced] [--url=http://localhost:5199/] [--nogl] */
import puppeteer from 'puppeteer-core';
const arg = n => { const a = process.argv.find(x => x.startsWith('--' + n)); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const out = process.argv[2] || '/tmp/shots', url = arg('url') || 'http://localhost:5199/', W = +(arg('w') || 1440), H = +(arg('h') || 900);
const gl = arg('nogl') ? ['--disable-gpu', '--disable-3d-apis'] : ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', '--no-proxy-server', ...gl] });
const page = await browser.newPage(); await page.setViewport({ width: W, height: H });
if (arg('reduced')) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
const problems = [], external = new Set();
page.on('console', m => { if (['error', 'warning'].includes(m.type())) problems.push(m.type() + ': ' + m.text()); });
page.on('pageerror', e => problems.push('pageerror: ' + e.message));
page.on('request', r => { const h = new URL(r.url()).host; if (h && !h.startsWith('localhost')) external.add(h); });
await page.goto(url, { waitUntil: 'load' });
const wait = ms => new Promise(r => setTimeout(r, ms));
const until = async (fn, ms = 60000) => { const t = Date.now(); while (Date.now() - t < ms) { if (await page.evaluate(fn)) return true; await wait(200); } return false; };
const shot = n => page.screenshot({ path: `${out}/${n}.png` });
const log = (...a) => console.log(...a);
await page.evaluate(() => document.fonts.ready); await wait(900);
if (arg('nogl')) { await shot('plain'); log('plain page text length:', await page.evaluate(() => document.body.innerText.length)); log('problems:', problems.length ? problems : 'none'); await browser.close(); process.exit(0); }
const scrollTo = async s => { await page.evaluate(s => window.scrollTo(0, s * document.querySelector('.stage').clientHeight), s); await wait(1300); };
for (const s of (arg('stops') ? arg('stops').split(',').map(Number) : [0, .2, .35, .5, 1, 1.5, 2, 3, 4, 5, 6])) { await scrollTo(s); await shot('p-' + String(s).replace('.', '_')); }
await scrollTo(6); await wait(1500);
/* each tube: open by its caption button, look, scroll the results, go back */
for (let i = 0; i < 3; i++) {
  const opened = await page.evaluate(i => { const b = document.querySelectorAll('.sg-tube')[i]; b.click(); return b.textContent; }, i);
  await until(() => document.querySelector('.results').classList.contains('on') && [...document.querySelectorAll('.controls button')].some(b => b.textContent.startsWith('Back'))); await wait(2500); await shot('tube-' + i);
  const info = await page.evaluate(() => ({ locked: document.documentElement.classList.contains('locked'), focus: document.activeElement?.textContent, h2: document.querySelector('.results h2')?.textContent,
    resultsOn: document.querySelector('.results').classList.contains('on'), canScroll: (r => r.scrollHeight > r.clientHeight)(document.querySelector('.results')), picture: document.querySelector('.scene canvas').getAttribute('aria-label') }));
  if (i === 1) { await page.evaluate(() => document.querySelector('.results').scrollTo(0, 9999)); await wait(300); await shot('tube-1-scrolled');
    await page.evaluate(() => { document.querySelector('.results').scrollTo(0, 0); document.querySelectorAll('.switch button')[1].click(); }); await wait(1500); await shot('tube-1-hba1c'); }
  if (i === 2) await page.keyboard.press('Escape'); else await page.evaluate(() => [...document.querySelectorAll('.controls button')].find(b => b.textContent.startsWith('Back')).click());
  await until(() => !document.documentElement.classList.contains('locked')); await wait(500);
  const after = await page.evaluate(() => ({ locked: document.documentElement.classList.contains('locked'), focus: document.activeElement?.textContent }));
  log('tube', i, opened, JSON.stringify(info), 'after back:', JSON.stringify(after));
}
await shot('after-back');
/* tab order from the top of the page */
await scrollTo(0); await page.evaluate(() => document.activeElement.blur());
const order = []; for (let i = 0; i < 6; i++) { await page.keyboard.press('Tab'); order.push(await page.evaluate(() => { const a = document.activeElement; return a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30) || a.className; })); }
log('tab order from the top:', order.join(' > '));
await page.keyboard.press('Tab'); /* skip via keyboard */
await page.evaluate(() => [...document.querySelectorAll('.controls button')].find(b => b.textContent.startsWith('Skip')).click()); await wait(600);
log('after skip: scrollY/stage =', await page.evaluate(() => (window.scrollY / document.querySelector('.stage').clientHeight).toFixed(2)), '| focus:', await page.evaluate(() => document.activeElement.textContent));
await shot('after-skip');
log('external hosts contacted:', [...external]); log('problems:', problems.length ? problems : 'none');
await browser.close();
