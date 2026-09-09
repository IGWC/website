import { defineMiddleware } from 'astro:middleware';
import './actions'; // Start the delivery poller on the first request after a restart.

export const onRequest = defineMiddleware((_context, next) => next());
