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
