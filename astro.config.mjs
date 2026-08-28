// @ts-check
import { defineConfig, fontProviders } from 'astro/config';
import sitemap from '@astrojs/sitemap';

import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://floodreliefnepal.com',
  integrations: [sitemap()],

  fonts: [
      {
          provider: fontProviders.google(),
          name: 'Outfit',
          cssVariable: '--font-outfit',
          weights: [400, 500, 600],
          styles: ['normal'],
          fallbacks: ['sans-serif'],
      },
      {
          provider: fontProviders.google(),
          name: 'Noto Sans Devanagari',
          cssVariable: '--font-np',
          weights: [400, 500],
          styles: ['normal'],
          subsets: ['devanagari', 'latin'],
          fallbacks: ['sans-serif'],
      },
	],

  vite: {
    plugins: [tailwindcss()],
  },
});