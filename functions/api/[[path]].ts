// functions/[[path]].ts

import { Hono } from 'hono';
import app from '../../api/index'; // Import the Hono app from our backend code

// The onRequest function is the entry point for all requests to the worker.
export const onRequest: PagesFunction = ({ request, env, next }) => {
    return app.fetch(request, env, { waitUntil: (p) => p, passThroughOnException: () => next() });
};
