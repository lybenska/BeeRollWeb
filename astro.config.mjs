import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://beeroll.ai',
  output: 'static',
  build: { assets: '_assets' },
  // `astro preview` behind a temporary tunnel (review links for colleagues): Cloudflare quick tunnel or localhost.run.
  vite: { preview: { allowedHosts: ['.trycloudflare.com', '.lhr.life'] } },
});
