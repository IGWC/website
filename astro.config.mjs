// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
// import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
// import keystatic from '@keystatic/astro';

// https://astro.build/config
export default defineConfig({
  devToolbar: {
    enabled: false
  },
  site: 'https://indianagradworkers.org',
  integrations: [react(), markdoc(), sitemap()]
//  integrations: [react(), markdoc(), keystatic()]
/* 
  integrations: [react(), markdoc(), starlight({
      title: 'Institutional Knowledge',
      logo: {
                src: '/src/media/logo-red.svg',
                replacesTitle: true,
            },
    }), sitemap()]
 */
});