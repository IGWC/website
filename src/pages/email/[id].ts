// src/pages/email-safe-html/[slug].html.ts
import type { APIContext } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { render as emailRender } from 'emailmd';

export async function getStaticPaths() {
  const news = await getCollection('news');
  return news.map(email => ({
    params: { id: email.id },
    props: { email },
  }));
}

export async function GET({ props }: APIContext) {
  const { email } = props;
  let body = email.body;

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

  const frontmatterString = `---\n${JSON.stringify(email.data)}\n---\n`;
  
  //this is used for a custom button implementation to make things easier!!
  const regex = /^(\[[^\]]+\]\([^)]+\))\s*$/gm;
  const modifiedMarkdown = body.replace(regex, '$1{button}');
  
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
