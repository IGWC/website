# NOTES

## How to write a newsletter

Prerequisites: Get an invite to PagesCMS by someone with access to the [IGWC Github Organization](https://github.com/IGWC)

1. Log in to [PagesCMS](https://app.pagescms.org/sign-in) with Github once you are a member of the Github Org

2. Navigate to `Newsletter` in the sidebar, and `Add an entry`

3. Fill out the information (Title, Date, Mailing List, etc.). If you are writing to the big newsletter (includes faculty, alumni, etc.), select `Newsletter` in the Mailing List dropdown. If you just want to write to members, select `Member List`. `Newsletters` will publish on the IGWC site, `Member List` emails will not.

4. Write the Newsletter. You can include images and links in the body. If you want to have a button, place a link on a single line by itself.

For example, in markdown:

```
Blah blah blah normal text. I can include [links](https://en.wikipedia.org/wiki/Hyperlink) in this text, which will show up as normal links. But if I were to write a link by itself like this:

[Visit the IGWC Website](https://indianagradworkers.org)

That link would show up as a button on both the website and email.
```

5. Save the entry. This will commit the changes to the Github and automatically update the website after about a minute!

6. Visit the page you just made and make sure everything looks correct. `Newsletters` will be available at `https://indianagradworkers.org/news/{URL}` and rendered as email-formatted HTML at `https://indianagradworkers.org/email/{URL}`. `Member List` emails are only rendered as email-formatted HTML at `https://indianagradworkers.org/news/{URL}`.

7. Log in to [IU Listserv](https://list.iu.edu/sympa/my) and find the right email list: `igwc-ue-l@list.iu.edu` is the Member List, and `igwc-ue-news-l@list.iu.edu` is the Newsletter

8. Update the list: visit [https://list.iu.edu/sympa/import/igwc-ue-l](https://list.iu.edu/sympa/import/igwc-ue-l) or [https://list.iu.edu/sympa/import/igwc-ue-news-l](https://list.iu.edu/sympa/import/igwc-ue-news-l) to add emails in bulk. Copy any new members from the card campaign.

9. Visit [https://list.iu.edu/sympa/compose_mail/igwc-ue-l/html_news_letter](https://list.iu.edu/sympa/compose_mail/igwc-ue-l/html_news_letter) or [https://list.iu.edu/sympa/compose_mail/igwc-ue-news-l/html_news_letter](https://list.iu.edu/sympa/compose_mail/igwc-ue-news-l/html_news_letter) and write the subject line for the email, and paste the link to the HTML formatted webpage from the website: `https://indianagradworkers.org/email/{URL}`.

## How to update this website

The content of this website is mostly Markdown (mostly 😬) stored in [src/content](src/content).

- [src/content/news](src/content/news) holds content sent out for newsletters and other emails.
- [src/content/pages](src/content/pages) are normal HTML pages that either are published or could appear in the navigation bar (About, Victories, etc.)
- [src/content/pieces](src/content/pieces) contain the banner for emergency announcements (currently off), and the email footers.

[src/content/homepage.md](src/content/homepage.md) is the homepage in Markdown, [src/content/footer.md](src/content/footer.md) is the text for the footer, and [src/content/slogans.md](src/content/slogans.md) is a list of slogans that appear in the footer randomly on each page.

Each one of these [src/content/pages](src/content/pages), and [src/content/homepage.md](src/content/homepage.md) are both a combination of Markdown and HTML to accomplish some formatting. That is why some paragraphs of text are wrapped in `<div>`s with some [Tailwind Classes](https://tailwindcss.com/docs/styling-with-utility-classes) applied. Most of the time, these classes are arranging text and images to be 2/3rds or 1/3 of the width of the page.

This is flexible, however, just by editing some basic info.

### Changing the navigation menu

To change the order of items in the navigation menu, set the appropriate numbers in the order section of the Markdown. If you want to hide a page, set the order to 0. If you want the button to highlight red, set "highlight" to true.

### Adding Pages

If you want to add more pages, make a new markdown file with this template:

```
---
title:
description:
order: 0 #set to 0 to hide
highlight: false #true/false
---

Lorem ipsum...
```

The `title` of the page is what appears in the navigation bar. The `description` is the SEO description (this is important to set!).

### Exception: The [News](src/content/pages/news.mdx) Page

This is an [MDX file](https://docs.astro.build/en/guides/integrations-guide/mdx/), which means it is a markdown file that supports using React components inside. This page is unique because it pulls content from the [src/content/news](src/content/news) using a special layout: [src/layouts/news.astro](src/layouts/news.astro).


### Changing things

This whole website is built using [Astro](https://docs.astro.build/en/getting-started/). Astro is mostly HTML, but with some templating built in. It is also very trendy, and AI coding tools will be familiar with it.
