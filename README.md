# NOTES

## Redesign Notes

- Big footer! 100vh like https://www.normalcomputing.com
- 

## To-do

### HIGH PRIORITY:

- HTML forms for cards and such
	- add custom form: https://ui.shadcn.com/docs/components/form

### MEDIUM PRIORITY:

- newsletter sign-up
	- automate via google script to send subscribe email. can send max 100 emails so batch every 15 minutes. 
- custom calendar
	- https://github.com/ka215/jquery.timeline
- figure out more permanent email solution
- submission form google script
- cornell has really nice FAQs: https://cornellgradunion.org/faq2
- https://pagescms.org/ on cloudflare if possible
- umami on miis
- set up docs: 
	- https://starlight.astro.build/reference/configuration/

### LOW PRIORITY:

- move newsletter and make it editable through astro
	- this would just require a template with the archaic markup. 


## Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

Documentation is available at <https://docs.astro.build>. 
