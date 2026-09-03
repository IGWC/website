// src/pages/email-safe-html/[slug].html.ts
import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { render as emailRender } from 'emailmd';
import { getImage } from 'astro:assets';
import path from 'node:path';

// 1. Gather all potential images in your media directory at build/runtime
const imageImports = import.meta.glob('/src/media/**/*.{jpeg,jpg,png,gif,webp,svg}');

// Helper function to find and replace local image paths with optimized absolute URLs
async function processMarkdownImages(markdown: string, siteOrigin: string) {
  // Regex to match markdown image syntax: ![alt](path)
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const matches = [...markdown.matchAll(imageRegex)];
  let updatedMarkdown = markdown;

  for (const match of matches) {
    const [_, alt, srcPath] = match;

    // Skip external URLs
    if (srcPath.startsWith('http://') || srcPath.startsWith('https://')) {
      continue;
    }

    // 2. Resolve the relative markdown path to a project-root relative path
    // Assuming your 'news' collection markdown files live directly in 'src/content/news'
    const absolutePath = path.resolve(srcPath);
    const rootRelativePath = '/' + path.relative(process.cwd(), absolutePath);

    // 3. Check if the image exists in our globbed media folder
    if (imageImports[rootRelativePath]) {
      // Dynamically import the asset
      const imageModule = (await imageImports[rootRelativePath]()) as any;
      const imageAsset = imageModule.default || imageModule;

      // 4. Run it through Astro's image optimization pipeline
      const optimizedImage = await getImage({ src: imageAsset });

      // 5. Convert to an absolute URL (mandatory for email clients)
      const absoluteUrl = new URL(optimizedImage.src, siteOrigin).toString();

      // Replace the local path in markdown with the finalized production URL
      updatedMarkdown = updatedMarkdown.replace(srcPath, absoluteUrl);
    } else {
      console.warn(`[Email Compiler] Could not resolve image: ${srcPath} (Looked for ${rootRelativePath})`);
    }
  }

  return updatedMarkdown;
}

export async function getStaticPaths() {
  const news = await getCollection('news');
  return news.map(email => ({
    params: { id: email.id }, // Make sure your route filename matches this param ([id].html.ts or change this to slug)
    props: { email },
  }));
}

export async function GET({ props, url }: APIContext) {
  const { email } = props;
  const titleH1 = email.data.title ? `# ${email.data.title}\n\n` : '';
  let body = titleH1 + email.body;

  if (email.data.listserv) {
    try {
      const footerId = `${email.data.listserv}-footer`;
      const footerPiece = await getEntry('pieces', footerId);
      
      if (footerPiece) {
        body += `\n\n${footerPiece.body}`;
      }
    } catch (error) {
      console.error(`Failed to load footer piece for listserv: ${email.data.listserv}`, error);
    }
  }

  // --- FIX APPLIED HERE ---
  // Process all images inside the aggregated markdown body before compiling
  body = await processMarkdownImages(body, url.origin);

  const frontmatterString = `---\n${JSON.stringify(email.data)}\n---\n`;
  
  const regex = /^(\[[^\]]+\]\([^)]+\))\s*$/gm;
  const modifiedMarkdown = body.replace(regex, '$1{button}\n');
  
  const rawMarkdownContent = frontmatterString + modifiedMarkdown;

  const { html } = await emailRender(rawMarkdownContent, {
    fonts: {
      Inter: 'https://rsms.me/inter/inter.css',
    },
    theme: {
      brandColor: "#374151",
      backgroundColor: "#ffffff",
      headingColor: "#0e0e0e",
      bodyColor: "#374151",
      contentColor: "#ffffff",
      buttonColor: "#de1f1a",
      borderRadius: "32px",
      lineHeight: 1.4,
      contentWidth: "700px"
    },
  });

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
}