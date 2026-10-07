// Post-processes `dist` for the GitHub Pages review build (never for production):
//  1. rewrites root-relative URLs (/styles.css, /assets/…, /fonts/…) in every page to relative ones, so
//     the build works from the Pages sub-path (https://<user>.github.io/BeeRollWeb/, …/light/);
//  2. marks the page noindex/nofollow and adds a robots.txt that disallows crawling, so the
//     review site never shows up in search engines. The production build keeps indexing on.
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { join, relative, sep } from 'node:path';

const dist = process.argv[2] ?? 'dist';
const files = (await readdir(dist, { recursive: true })).map((f) => join(dist, f));

// Every page, each relative to its own depth (/light/index.html needs "../").
let refs = 0;
for (const html of files.filter((f) => f.endsWith('.html'))) {
  const depth = relative(dist, html).split(sep).length - 1;
  const up = '../'.repeat(depth);
  let h = await readFile(html, 'utf8');
  refs += (h.match(/(?:href|src)="\/(?!\/)/g) ?? []).length;
  h = h.replace(/(href|src)="\/(?!\/)/g, `$1="${up}`);
  if (!/name="robots"/.test(h)) {
    h = h.replace('</head>', '<meta name="robots" content="noindex, nofollow" />\n</head>');
  }
  await writeFile(html, h);
}

// Stylesheets at the root of dist (styles.css, light.css).
let urls = 0;
for (const css of files.filter((f) => f.endsWith('.css') && relative(dist, f).split(sep).length === 1)) {
  let c = await readFile(css, 'utf8');
  urls += (c.match(/url\('\/(?!\/)/g) ?? []).length;
  c = c.replace(/url\('\/(?!\/)/g, "url('");
  await writeFile(css, c);
}

await writeFile(join(dist, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

console.log(`review-build: ${refs} html refs and ${urls} css urls relativized; noindex meta and robots.txt added`);
