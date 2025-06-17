// keystatic.config.ts
import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
	storage: {
		kind: 'local',
/* 
		kind: 'github',
		repo: {
			owner: "IGWC",
			name: "website"
		}
 */
	},
	ui: {
		brand: { name: 'IGWC Editor' },
/* 
		navigation: {
      'Content': ['homepage', 'pages'],
      'Pieces' : ['footer',]
    },
 */
	},
	
	collections: {
		pages: collection({
			label: 'Main Pages',
			slugField: 'title',
			path: 'src/content/pages/*',
			format: { contentField: 'content' },
			entryLayout: "content",
			schema: {
				title: fields.slug({ name: { label: 'Title' } }),
				layout: fields.ignored({ layout: '/src/layouts/main.astro' }),
				order: fields.integer({
					label: 'Order',
					description: "Customize the order of the navigation bar. Be sure to change the other pages as well. ",
					validation: {
						min: 0,
						max: 12
					}
				}),
				content: fields.markdoc({
					label: 'Content',
					extension: 'md',
					options: {
						image: {
							directory: '/src/media',
							publicPath: '/src/media/',
						},
					},
				}),
			},
		}),
/* 
		pieces: collection({
			label: 'Pieces',
			slugField: 'title',
			path: 'src/content/pieces/*',
			format: { contentField: 'content' },
			entryLayout: "content",
			schema: {},
		}),
 */
	},
	singletons: {
		homepage: singleton({
			label: 'Homepage',
			path: 'src/content/homepage',
			entryLayout: "content",
			format: { contentField: 'content' },
			schema: {
				title: fields.text({ label: 'Title' }),
				summary: fields.text({ label: "Summary", multiline: true }),
				content: fields.markdoc({
					label: 'Content',
					extension: 'md',
					options: {
						image: {
							directory: '/src/media/',
							publicPath: '/src/media/',
						},
					},
				}),
			},
		}),
		footer: singleton({
			label: 'Footer',
			path: 'src/content/footer',
			entryLayout: "content",
			format: { contentField: 'content' },
			schema: {
				title: fields.text({ label: 'Title' }),
				content: fields.markdoc({
					label: 'Content',
					extension: 'md',
					options: {
						image: {
							directory: '/src/media/',
							publicPath: '/src/media/',
						},
					},
				}),
			},
		}),
	},
});