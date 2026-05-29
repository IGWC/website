// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import markdoc from '@astrojs/markdoc';
// import starlight from '@astrojs/starlight';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';
import db from '@astrojs/db';

import tailwindcss from '@tailwindcss/vite';

// import vercel from '@astrojs/vercel';

import cloudflare from "@astrojs/cloudflare";

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
  redirects: {
        "/end-the-fees": "/victories",
        "/living-wage-annual-raises": "/victories",
        "/our-victories": "/victories",
        "/grievance-procedure": "/victories",
        "/our-platform": "/platform",
        "/our-history": "/history",
        "/our-union-1": "/",
        "/department-organizers": "/meet-with-me",
        "/coordinating-committee": "/about#coordinating-committee",
        "/endorsements": "/about#endorsements",
        "/endorsement-aaup-cwa": "/archives/Endorsement-from-AAUP-and-CWA.pdf",
        "/endorsement-departments": "/non-retaliation-pledges",
        "/endorsement-faculty": "/faculty-neutrality-pledge",
        "/endorsement-sialf-afl-cio": "/archives/AFL-CIO-endorsement.pdf",
        "/endorsement-iusg": "/archives/IUSG-endorsement.pdf",
        "/labor-petition": "/",
        "/committees": "/organize",
        "/by-laws-grievance-procedure": "/by-laws",
        "/home": "/",
        "/department-donations": "/dues",
        "/fairness-for-international-students": "/platform#fairness-for-international-students",
        "/protect-and-improve-benefits": "/platform#expanded-medical--parental-benefits",
        "/living-wage-annual-raises.html": "/platform#a-living-wage",
        "/donate": "/dues#donate-to-our-campaignstrike-fund",
        "/field-report": "/archives/field-report-2026-01.pdf",
  },

  adapter: cloudflare(),
});