'use strict';

/**
 * Downloads one photo per menu item into public/img/menu/.
 * Primary source: Wikimedia Commons (license-clean, no API key).
 * Fallback: Openverse. Final fallback: a generated SVG placeholder.
 *
 * Run:  npm run images          (skips files that already exist)
 *       npm run images -- --force
 */

const fs = require('node:fs');
const path = require('node:path');
const seed = require('../src/seed-data');

const OUT_DIR = path.join(__dirname, '..', 'public', 'img', 'menu');
const USER_AGENT = 'McDoKioskDemo/1.0 (classroom project; contact: instructor)';
const FORCE = process.argv.includes('--force');
const THROTTLE_MS = 700;
const THUMB_WIDTH = 480;

const TERMS = {
  'Burger McDo': 'cheeseburger',
  'Cheeseburger McDo': 'cheeseburger',
  'Double Cheeseburger': 'double cheeseburger',
  'Big Mac': 'Big Mac hamburger',
  McChicken: 'McD-McChicken',
  'McCrispy Chicken Fillet': 'chicken sandwich',
  'Quarter Pounder with Cheese': 'quarter pounder burger',
  '1-pc Chicken McDo w/ Rice': 'fried chicken with rice',
  '2-pc Chicken McDo w/ Rice': 'fried chicken with rice',
  '1-pc Spicy Chicken McDo w/ Rice': 'spicy fried chicken rice',
  '6-pc Chicken McNuggets': 'chicken nuggets',
  '10-pc Chicken McNuggets': "McDonald's chicken McNuggets",
  '20-pc Chicken McNuggets': 'chicken nuggets',
  '6-pc Chicken McShare Box': 'fried chicken bucket',
  '8-pc Chicken McShare Box': 'fried chicken bucket',
  'McSpaghetti Solo': 'spaghetti with tomato sauce',
  'McSpaghetti Platter': 'spaghetti platter',
  '1-pc Chicken McDo w/ McSpaghetti': 'fried chicken and spaghetti',
  'Crispy Chicken Fillet Ala King w/ Rice': 'chicken ala king rice',
  'Cheesy Eggdesal': 'egg and cheese sandwich',
  'Sausage McMuffin w/ Egg': 'sausage egg muffin',
  'Egg McMuffin': 'McD-Egg-McMuffin',
  '2-pc Hotcakes': 'pancakes with syrup',
  'Big Breakfast': 'big breakfast plate',
  'McFries Regular': 'french fries',
  'McFries Medium': 'french fries',
  'McFries Large': 'french fries',
  'BFF Fries': 'sharing fries',
  'Twister Fries': 'curly fries',
  'Apple Pie': 'apple pie dessert',
  'Vanilla Cone': 'soft serve ice cream cone',
  'Hot Fudge Sundae': 'hot fudge sundae',
  'McFlurry with Oreo': 'McFlurry',
  'Coke McFloat': 'McFloat',
  'Chocolate Shake': 'chocolate milkshake',
  'Coke Regular': 'coca cola glass',
  'Coke Large': 'coca cola glass',
  'Sprite Regular': 'sprite soda glass',
  'Royal Regular': 'orange soda glass',
  'Coke Zero Regular': 'coca cola zero glass',
  'Iced Tea': 'iced tea glass',
  'Brewed Coffee': 'brewed coffee cup',
  'Orange Juice': 'orange juice glass',
  'Burger McDo Happy Meal': 'burger kids meal',
  'McSpaghetti Happy Meal': 'spaghetti kids meal',
  '4-pc McNuggets Happy Meal': 'chicken nuggets meal',
  '1-pc Chicken McDo Happy Meal': 'fried chicken meal',
  'McShare Bundle for 3': 'fast food meal set',
  'McShare Bundle for 4': 'family fast food meal'
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extFromContentType(type) {
  if (!type) return '.jpg';
  if (type.includes('png')) return '.png';
  if (type.includes('webp')) return '.webp';
  if (type.includes('gif')) return '.gif';
  return '.jpg';
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (response.status === 429) throw new Error('rate-limited');
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

async function searchWikimedia(term) {
  const url =
    'https://commons.wikimedia.org/w/api.php?action=query&format=json&generator=search' +
    `&gsrsearch=${encodeURIComponent(`filetype:bitmap ${term}`)}&gsrnamespace=6&gsrlimit=8` +
    '&prop=imageinfo&iiprop=url|mime|extmetadata&iiurlwidth=' + THUMB_WIDTH;
  const data = await fetchJson(url);
  const pages = data && data.query && data.query.pages ? Object.values(data.query.pages) : [];
  const candidates = pages
    .map((page) => {
      const info = (page.imageinfo || [])[0];
      if (!info) return null;
      const mime = info.mime || '';
      if (!mime.startsWith('image/') || mime.includes('svg') || mime.includes('tiff')) return null;
      const meta = info.extmetadata || {};
      return {
        url: info.thumburl || info.url,
        page: info.descriptionurl,
        title: page.title,
        mime,
        author: meta.Artist ? meta.Artist.value.replace(/<[^>]+>/g, '').trim() : 'Unknown',
        license: meta.LicenseShortName ? meta.LicenseShortName.value : '',
        source: 'Wikimedia Commons'
      };
    })
    .filter(Boolean);
  if (candidates.length === 0) throw new Error('no results');
  candidates.sort((a, b) => (a.mime.includes('jpeg') ? -1 : 0) - (b.mime.includes('jpeg') ? -1 : 0));
  return candidates[0];
}

async function searchOpenverse(term) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(term)}&page_size=5&license_type=commercial`;
  const data = await fetchJson(url);
  const results = (data && data.results) || [];
  const match = results.find((item) => /\.(jpe?g|png)$/i.test(item.url || ''));
  if (!match) throw new Error('no results');
  return {
    url: match.url,
    page: match.foreign_landing_url || match.url,
    title: match.title || term,
    mime: '',
    author: match.creator || 'Unknown',
    license: (match.license || '') + (match.license_version ? ` ${match.license_version}` : ''),
    source: 'Openverse'
  };
}

async function download(url, filePath) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!response.ok) throw new Error(`download HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`unexpected content-type ${type}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length < 1024) throw new Error('file too small');
  fs.writeFileSync(filePath, buffer);
  return { bytes: buffer.length, type };
}

function writePlaceholder(filePath, item) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
    <rect width="800" height="600" fill="#da291c"/>
    <path d="M120 470 L120 240 C120 120 160 60 240 60 C300 60 330 170 350 300 C370 170 400 60 460 60 C540 60 580 120 580 240 L580 470 L520 470 L520 250 C520 170 500 130 470 130 C440 130 420 210 410 470 L390 470 C380 210 360 130 330 130 C300 130 280 170 280 250 L280 470 Z" fill="#ffc72c"/>
    <text x="400" y="545" text-anchor="middle" font-family="Segoe UI, Arial" font-size="34" fill="#fff">${item.name.replace(/&/g, '&amp;')}</text>
  </svg>`;
  fs.writeFileSync(filePath, svg);
}

async function withRetry(fn, attempts = 3) {
  let lastError;
  for (let i = 0; i < attempts; i += 1) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err.message !== 'rate-limited') throw err;
      await sleep(2500 * (i + 1));
    }
  }
  throw lastError;
}

async function main() {
  if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });
  const credits = [];
  const resolved = [];
  let ok = 0;
  let placeholder = 0;

  for (const item of seed.MENU) {
    const slug = slugify(item.name);
    const term = TERMS[item.name] || item.name;
    const existing = fs.existsSync(OUT_DIR)
      ? fs.readdirSync(OUT_DIR).find((file) => file.startsWith(`${slug}.`))
      : null;

    if (existing && !FORCE) {
      console.log(`skip  ${item.name} (${existing})`);
      resolved.push({ item: item.name, file: existing });
      ok += 1;
      continue;
    }

    let result = null;
    try {
      result = await withRetry(() => searchWikimedia(term));
    } catch (err) {
      try {
        result = await withRetry(() => searchOpenverse(term));
      } catch (err2) {
        result = null;
      }
    }

    if (result) {
      const ext = extFromContentType(result.mime);
      const filePath = path.join(OUT_DIR, `${slug}${ext}`);
      try {
        const info = await download(result.url, filePath);
        console.log(`ok    ${item.name} -> ${slug}${ext} (${Math.round(info.bytes / 1024)} KB, ${result.source})`);
        credits.push({
          slug,
          item: item.name,
          title: result.title,
          author: result.author,
          license: result.license,
          source: result.source,
          sourceUrl: result.page
        });
        resolved.push({ item: item.name, file: `${slug}${ext}` });
        ok += 1;
        await sleep(THROTTLE_MS);
        continue;
      } catch (err) {
        /* fall through to placeholder */
      }
    }

    const filePath = path.join(OUT_DIR, `${slug}.svg`);
    writePlaceholder(filePath, item);
    console.log(`place ${item.name} -> ${slug}.svg`);
    credits.push({ slug, item: item.name, title: 'Generated placeholder', author: 'McDo Kiosk', license: 'CC0', source: 'placeholder', sourceUrl: '' });
    resolved.push({ item: item.name, file: `${slug}.svg` });
    placeholder += 1;
    await sleep(THROTTLE_MS);
  }

  fs.writeFileSync(
    path.join(OUT_DIR, 'credits.json'),
    JSON.stringify({ generatedAt: new Date().toISOString(), items: credits }, null, 2)
  );

  try {
    const { db } = require('../src/db');
    const update = db.prepare('UPDATE menu_items SET image = ? WHERE name = ?');
    resolved.forEach((entry) => update.run(`/img/menu/${entry.file}`, entry.item));
    console.log(`Updated ${resolved.length} image paths in the database.`);
  } catch (err) {
    console.log(`(Database not updated: ${err.message})`);
  }

  console.log(`\nDone. ${ok} downloaded, ${placeholder} placeholders. Credits -> public/img/menu/credits.json`);
}

main().catch((err) => {
  console.error('Image fetch failed:', err.message);
  process.exit(1);
});
