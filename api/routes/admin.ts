// src/routes/admin.ts
import { Hono } from 'hono';
import { Bindings } from '../index';
import { authMiddleware, adminMiddleware } from '../middleware/auth.ts';

const app = new Hono<{ Bindings: Bindings }>();

// Protect all routes in this module with auth and admin middleware
app.use('*', authMiddleware, adminMiddleware);

// Quest management
app.get('/quests', (c) => c.json({ message: 'GET /admin/quests not implemented' }, 501));
app.post('/quests', (c) => c.json({ message: 'POST /admin/quests not implemented' }, 501));
app.put('/quests/:questId', (c) => c.json({ message: `PUT /admin/quests/${c.req.param('questId')} not implemented` }, 501));
app.delete('/quests/:questId', (c) => c.json({ message: `DELETE /admin/quests/${c.req.param('questId')} not implemented` }, 501));

// Blueprint management
app.get('/blueprints', (c) => c.json({ message: 'GET /admin/blueprints not implemented' }, 501));
app.post('/blueprints', (c) => c.json({ message: 'POST /admin/blueprints not implemented' }, 501));
app.put('/blueprints/:blueprintId', (c) => c.json({ message: `PUT /admin/blueprints/${c.req.param('blueprintId')} not implemented` }, 501));
app.delete('/blueprints/:blueprintId', (c) => c.json({ message: `DELETE /admin/blueprints/${c.req.param('blueprintId')} not implemented` }, 501));

// User management
app.get('/users', (c) => c.json({ message: 'GET /admin/users not implemented' }, 501));
app.post('/users', (c) => c.json({ message: 'POST /admin/users not implemented' }, 501));
app.delete('/users/:userId', (c) => c.json({ message: `DELETE /admin/users/${c.req.param('userId')} not implemented` }, 501));
app.put('/users/:userId/role', (c) => c.json({ message: `PUT /admin/users/${c.req.param('userId')}/role not implemented` }, 501));
app.put('/users/:userId/expedition-level', (c) => c.json({ message: `PUT /admin/users/${c.req.param('userId')}/expedition-level not implemented` }, 501));

// Expedition Requirements management
app.get('/expedition-requirements/:expeditionLevel', (c) => c.json({ message: `GET /admin/expedition-requirements/${c.req.param('expeditionLevel')} not implemented` }, 501));
app.get('/expedition-requirements-levels', (c) => c.json({ message: 'GET /admin/expedition-requirements-levels not implemented' }, 501));
app.post('/expedition-requirements', (c) => c.json({ message: 'POST /admin/expedition-requirements not implemented' }, 501));
app.put('/expedition-requirements/:id', (c) => c.json({ message: `PUT /admin/expedition-requirements/${c.req.param('id')} not implemented` }, 501));
app.delete('/expedition-requirements/:id', (c) => c.json({ message: `DELETE /admin/expedition-requirements/${c.req.param('id')} not implemented` }, 501));
app.post('/expedition-requirements/copy', (c) => c.json({ message: 'POST /admin/expedition-requirements/copy not implemented' }, 501));

export default app;