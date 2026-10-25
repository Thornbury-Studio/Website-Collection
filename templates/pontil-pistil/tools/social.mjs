/* Renders the social card, logo mark and touch icon from tools/social.html.
 *
 * usage: node social.mjs <template-folder> <base-url>
 *   e.g. node social.mjs ../ http://localhost:8123/templates/pontil-pistil
 * needs: playwright-core and a Chromium to point it at (CHROMIUM env var); install
 * them next to a working copy of this file, templates carry no package.json.
 */
import { chromium } from 'playwright-core';

const [dir, base] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM, headless: true });

async function render(hash, w, h, file, type, scale = 1) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  const page = await ctx.newPage();
  await page.goto(`${base}/tools/social.html#${hash}`);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.screenshot({ path: dir + file, type, ...(type === 'jpeg' ? { quality: 88 } : {}) });
  await ctx.close();
}

await render('og', 1200, 630, 'img/og.jpg', 'jpeg');
await render('mark', 512, 512, 'img/logo-512.png', 'png');
await render('mark', 512, 512, 'img/apple-touch-icon.png', 'png', 180 / 512);
await browser.close();
