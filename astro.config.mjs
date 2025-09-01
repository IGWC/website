// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
// import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import db from '@astrojs/db';

import tailwindcss from '@tailwindcss/vite';

import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },

  site: 'https://indianagradworkers.org',
  integrations: [react(), markdoc(), sitemap(), mdx(), db()],

  vite: {
    plugins: [tailwindcss()]
  },

  adapter: vercel(),
});