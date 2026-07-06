// Loads a page in a real browser and hands the shadow-piercing collector to it.
import { chromium } from 'playwright';
import { collectNodes } from './browser/collect.js';

/**
 * @param {string} url
 * @param {{ timeout?: number }} [opts]
 * @returns {Promise<Array>} node descriptors (light + shadow DOM)
 */
export async function crawl(url, { timeout = 15000 } = {}) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle', timeout });
    // collectNodes is serialized into the page context, so it must be self-contained.
    return await page.evaluate(collectNodes);
  } finally {
    await browser.close();
  }
}
