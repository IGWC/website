import { defineCollection, z } from 'astro:content';
import { glob, file } from 'astro/loaders';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';


const pages = defineCollection({ 
	loader: glob({ pattern: "[^_]*.md", base: "src/content/pages" }),
	schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
  })
});

const endorsements = defineCollection({ 
	loader: glob({ pattern: "[^_]*.md", base: "src/content/endorsements" }),
	schema: z.object({
    title: z.string(),
    description: z.string(),
  })
});

const pieces = defineCollection({ 
	loader: glob({ pattern: ["*.md", "**/*.md"], base: "src/content/pieces" }),
	schema: z.object({
    text: z.string(),
    url: z.string(),
    type: z.string(),
    order: z.number(),
  })
});

/* 
const docs = defineCollection({ 
	loader: docsLoader(),
	schema: docsSchema() 
});
export const collections = { pages, pieces, docs };
 */



export const collections = { pages, pieces, endorsements };
