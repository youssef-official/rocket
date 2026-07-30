import 'dotenv/config';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import morgan from 'morgan';
import { randomBytes, randomInt, randomUUID } from 'node:crypto';
import { mkdirSync, existsSync, copyFileSync, readdirSync, statSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { z } from 'zod';
import { designQualitySystem } from './prompts/designQuality.js';

const config = {
  port: Number(process.env.PORT || 3001),
  origin: process.env.WEB_ORIGIN || 'https://egyhost1.com,http://localhost:8080,http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || '',
  openRouterKey: process.env.OPENROUTER_API_KEY || '',
  adminEmail: (process.env.ADMIN_EMAIL || '').toLowerCase(),
  dataDir: resolve(process.env.DATA_DIR || './data'),
};

if (config.jwtSecret.length < 48) throw new Error('JWT_SECRET must be at least 48 characters.');
mkdirSync(config.dataDir, { recursive: true, mode: 0o700 });
const backupDir = join(config.dataDir, 'backups');
mkdirSync(backupDir, { recursive: true, mode: 0o700 });

const db = new Database(join(config.dataDir, 'webo.sqlite'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
// WAL + NORMAL keeps committed data durable without a full disk fsync per write.
db.pragma('synchronous = NORMAL');
db.pragma('busy_timeout = 5000');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL,
    display_name TEXT NOT NULL, role TEXT NOT NULL DEFAULT 'user', created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL, description TEXT, project_type TEXT NOT NULL DEFAULT 'html',
    files_json TEXT NOT NULL DEFAULT '{}', is_published INTEGER NOT NULL DEFAULT 0,
    published_slug TEXT, building_plan_json TEXT, generation_status TEXT,
    created_at TEXT NOT NULL, updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_projects_user_updated ON projects(user_id, updated_at DESC);
  CREATE TABLE IF NOT EXISTS chat_messages (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL,
    content TEXT NOT NULL, image_url TEXT, credits_used REAL, actions_json TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_messages_project_created ON chat_messages(project_id, created_at ASC);
  CREATE TABLE IF NOT EXISTS project_versions (
    id TEXT PRIMARY KEY, project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, version_number INTEGER NOT NULL,
    name TEXT, files_json TEXT NOT NULL, messages_json TEXT NOT NULL, actions_json TEXT,
    credits_used REAL, created_at TEXT NOT NULL, UNIQUE(project_id, version_number)
  );
  CREATE TABLE IF NOT EXISTS backups (
    id TEXT PRIMARY KEY, kind TEXT NOT NULL, filename TEXT NOT NULL, created_by TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS user_plans (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'free', daily_credits INTEGER NOT NULL DEFAULT 3,
    max_daily_credits INTEGER NOT NULL DEFAULT 3, credits_used_today INTEGER NOT NULL DEFAULT 0,
    total_credits_used INTEGER NOT NULL DEFAULT 0, updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS credit_reservations (
    id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT REFERENCES projects(id) ON DELETE SET NULL, cost INTEGER NOT NULL,
    work_type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'reserved',
    created_at TEXT NOT NULL, finalized_at TEXT
  );
  CREATE INDEX IF NOT EXISTS idx_credit_reservations_user_status ON credit_reservations(user_id,status,created_at);
  CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    visitor_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    path TEXT,
    target TEXT,
    country TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_analytics_project_created ON analytics_events(project_id, created_at DESC);
  CREATE TABLE IF NOT EXISTS site_celebrations (
    name TEXT PRIMARY KEY, is_active INTEGER NOT NULL DEFAULT 0,
    config_json TEXT NOT NULL DEFAULT '{}', updated_at TEXT NOT NULL
  );
`);
// SQLite does not support ADD COLUMN IF NOT EXISTS. These small migrations keep
// existing Webo databases compatible without touching any account data.
const ensureColumn = (table, column, definition) => {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  if (!columns.some(item => item.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${definition}`);
};
ensureColumn('users', 'phone', 'phone TEXT');
ensureColumn('user_plans', 'monthly_credits', 'monthly_credits INTEGER NOT NULL DEFAULT 0');
ensureColumn('user_plans', 'monthly_credits_used', 'monthly_credits_used INTEGER NOT NULL DEFAULT 0');
ensureColumn('user_plans', 'subscription_expires_at', 'subscription_expires_at TEXT');
ensureColumn('user_plans', 'last_daily_reset', 'last_daily_reset TEXT');
const schemaTimestamp = new Date().toISOString();
db.prepare("INSERT OR IGNORE INTO site_celebrations (name,is_active,config_json,updated_at) VALUES ('ramadan',0,'{}',?)").run(schemaTimestamp);
db.prepare("INSERT OR IGNORE INTO site_celebrations (name,is_active,config_json,updated_at) VALUES ('eid',0,'{}',?)").run(schemaTimestamp);

// The configured owner account is always an administrator, including accounts
// created before the environment variable was added.
if (config.adminEmail) {
  db.prepare("UPDATE users SET role = 'admin' WHERE lower(email) = ?").run(config.adminEmail);
}

const app = express();
app.set('trust proxy', 1);
// Some cPanel Passenger configurations forward the application URL prefix.
// Accept both /api/* and /server/api/* without exposing a second API surface.
app.use((req, _res, next) => {
  if (req.url === '/server') req.url = '/';
  else if (req.url.startsWith('/server/')) req.url = req.url.slice('/server'.length);
  next();
});
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(compression());
const allowedOrigins = [...new Set([
  ...config.origin.split(',').map(value => value.trim()).filter(Boolean),
  'http://localhost:8080',
  'http://localhost:5173',
])];
const isLocalNetworkOrigin = origin => {
  if (process.env.NODE_ENV === 'production') return false;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.replace(/^\[|\]$/g, '');
    const isPrivateHost = hostname === 'localhost'
      || hostname === '127.0.0.1'
      || hostname === '::1'
      || hostname.endsWith('.local')
      || /^10\./.test(hostname)
      || /^192\.168\./.test(hostname)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
    return isPrivateHost && ['5173', '8080'].includes(url.port);
  } catch {
    return false;
  }
};
app.use(cors({
  origin(origin, callback) {
    // Local development may be opened through localhost or the machine's LAN IP.
    if (!origin || allowedOrigins.includes(origin) || isLocalNetworkOrigin(origin)) return callback(null, true);
    return callback(new Error(`Origin not allowed: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type'],
  maxAge: 86_400,
  credentials: false,
}));
// Generated multi-page sites can exceed a couple of megabytes once SVG and
// embedded assets are included. Keep the limit bounded, but large enough for a
// complete project snapshot and its version history.
app.use(express.json({ limit: '20mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', rateLimit({ windowMs: 15 * 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

const id = () => randomUUID();
const now = () => new Date().toISOString();
const json = (value, fallback = null) => { try { return value ? JSON.parse(value) : fallback; } catch { return fallback; } };
const projectAdjectives = ['Amber', 'Atlas', 'Bright', 'Cedar', 'Cloud', 'Coral', 'Delta', 'Echo', 'Lunar', 'Nova', 'Pixel', 'River', 'Solar', 'Velvet'];
const projectNouns = ['Canvas', 'Forge', 'Harbor', 'Meadow', 'Nest', 'Orbit', 'Page', 'Studio', 'Trail', 'Wave', 'Works'];
const randomItem = values => values[randomInt(0, values.length)];
const systemProjectName = () => `${randomItem(projectAdjectives)} ${randomItem(projectNouns)} ${randomBytes(2).toString('hex').toUpperCase()}`;
// A small authenticated SSE hub keeps every open Vivora X screen in sync. It is
// intentionally in-process: no third-party realtime service and no token in a
// URL are needed.  SQLite remains the source of truth; events only tell a
// client when it should fetch the latest record.
const realtimeClients = new Map();
function sendRealtimeEvent(userId, type, payload = {}) {
  const clients = realtimeClients.get(userId);
  if (!clients) return;
  const message = `event: ${type}\ndata: ${JSON.stringify({ type, ...payload, at: now() })}\n\n`;
  for (const client of clients) {
    try { client.write(message); } catch { clients.delete(client); }
  }
  if (!clients.size) realtimeClients.delete(userId);
}
const publicUser = row => ({ id: row.id, email: row.email, displayName: row.display_name, phone: row.phone || undefined, role: row.role });
const project = row => ({
  id: row.id, userId: row.user_id, name: row.name, description: row.description || undefined,
  projectType: row.project_type, files: json(row.files_json, {}), isPublished: Boolean(row.is_published),
  publishedSlug: row.published_slug || undefined, buildingPlan: json(row.building_plan_json),
  generationStatus: row.generation_status || undefined,
  createdAt: row.created_at, updatedAt: row.updated_at,
});
const projectVersion = row => ({
  id: row.id,
  projectId: row.project_id,
  userId: row.user_id,
  versionNumber: Number(row.version_number),
  name: row.name || undefined,
  files: json(row.files_json, {}),
  chatMessages: json(row.messages_json, []),
  actionsTaken: json(row.actions_json, []),
  creditsUsed: row.credits_used == null ? undefined : Number(row.credits_used),
  createdAt: row.created_at,
});
const chatMessage = row => ({
  id: row.id, role: row.role, content: row.content,
  imageUrl: row.image_url || undefined,
  creditsUsed: row.credits_used || undefined,
  actionsTaken: json(row.actions_json, []),
  createdAt: row.created_at,
});
const sign = user => jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, { expiresIn: '7d', issuer: 'webo' });
const utcDay = () => new Date().toISOString().slice(0, 10);
const addMonths = (from, months) => { const date = new Date(from); date.setUTCMonth(date.getUTCMonth() + months); return date.toISOString(); };
function resetDailyCredits(userId) {
  const row = db.prepare('SELECT last_daily_reset FROM user_plans WHERE user_id=?').get(userId);
  if (row && String(row.last_daily_reset || '').slice(0, 10) !== utcDay()) {
    db.prepare('UPDATE user_plans SET credits_used_today=0,last_daily_reset=?,updated_at=? WHERE user_id=?').run(now(), now(), userId);
  }
}
function activeReservationTotal(userId) {
  db.prepare("UPDATE credit_reservations SET status='released',finalized_at=? WHERE user_id=? AND status='reserved' AND created_at < ?").run(now(), userId, new Date(Date.now() - 10 * 60_000).toISOString());
  return Number(db.prepare("SELECT COALESCE(SUM(cost),0) total FROM credit_reservations WHERE user_id=? AND status='reserved'").get(userId).total);
}
function creditAvailability(userId) {
  resetDailyCredits(userId);
  const plan = db.prepare('SELECT * FROM user_plans WHERE user_id=?').get(userId);
  if (!plan) return { total: 0, daily: 0, monthly: 0 };
  const daily = Math.max(0, Number(plan.daily_credits) - Number(plan.credits_used_today));
  const monthly = Math.max(0, Number(plan.monthly_credits) - Number(plan.monthly_credits_used));
  return { total: Math.max(0, daily + monthly - activeReservationTotal(userId)), daily, monthly };
}
function reserveGenerationCredit(userId, projectId, workType) {
  const cost = workType === 'initial' ? 2 : 1;
  return db.transaction(() => {
    const available = creditAvailability(userId);
    if (available.total < cost) return null;
    const reservation = { id:id(), user_id:userId, project_id:projectId || null, cost, work_type:workType, status:'reserved', created_at:now(), finalized_at:null };
    db.prepare('INSERT INTO credit_reservations (id,user_id,project_id,cost,work_type,status,created_at,finalized_at) VALUES (@id,@user_id,@project_id,@cost,@work_type,@status,@created_at,@finalized_at)').run(reservation);
    return reservation;
  })();
}
function finalizeReservation(reservationId, success) {
  return db.transaction(() => {
    const reservation = db.prepare('SELECT * FROM credit_reservations WHERE id=?').get(reservationId);
    if (!reservation || reservation.status !== 'reserved') return;
    if (!success) { db.prepare("UPDATE credit_reservations SET status='released',finalized_at=? WHERE id=?").run(now(), reservationId); return; }
    resetDailyCredits(reservation.user_id);
    const plan = db.prepare('SELECT * FROM user_plans WHERE user_id=?').get(reservation.user_id);
    const dailyRemaining = Math.max(0, Number(plan.daily_credits) - Number(plan.credits_used_today));
    const dailyUsed = Math.min(reservation.cost, dailyRemaining);
    const monthlyUsed = reservation.cost - dailyUsed;
    db.prepare('UPDATE user_plans SET credits_used_today=credits_used_today+?,monthly_credits_used=monthly_credits_used+?,total_credits_used=total_credits_used+?,updated_at=? WHERE user_id=?').run(dailyUsed, monthlyUsed, reservation.cost, now(), reservation.user_id);
    db.prepare("UPDATE credit_reservations SET status='committed',finalized_at=? WHERE id=?").run(now(), reservationId);
    sendRealtimeEvent(reservation.user_id, 'account.updated');
  })();
}
function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
  try {
    const claims = jwt.verify(token, config.jwtSecret, { issuer: 'webo' });
    // Resolve the role from SQLite so role changes take effect immediately,
    // even for a token created before an account was promoted.
    const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(claims.sub);
    if (!user) return res.status(401).json({ error: 'Session expired.' });
    req.auth = { ...claims, role: user.role };
    next();
  }
  catch { res.status(401).json({ error: 'Authentication required.' }); }
}
function admin(req, res, next) { return req.auth?.role === 'admin' ? next() : res.status(403).json({ error: 'Administrator access required.' }); }
function ownedProject(projectId, userId) { return db.prepare('SELECT * FROM projects WHERE id = ? AND user_id = ?').get(projectId, userId); }

app.get('/api/events', auth, (req, res) => {
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  res.write(': connected\n\n');
  const clients = realtimeClients.get(req.auth.sub) || new Set();
  clients.add(res);
  realtimeClients.set(req.auth.sub, clients);
  const keepAlive = setInterval(() => { try { res.write(': keep-alive\n\n'); } catch {} }, 25_000);
  req.on('close', () => {
    clearInterval(keepAlive);
    clients.delete(res);
    if (!clients.size) realtimeClients.delete(req.auth.sub);
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true, model: 'qwen/qwen3.7-flash' }));
app.get('/api/site/celebrations', (_req, res) => res.json(db.prepare('SELECT name,is_active FROM site_celebrations WHERE is_active = 1 ORDER BY name').all().map(row => ({ name: row.name, isActive: Boolean(row.is_active) }))));
const credentials = z.object({ email: z.string().email().max(254), password: z.string().min(10).max(200), displayName: z.string().min(1).max(80).optional(), phone: z.string().trim().min(7).max(30).optional() });
app.post('/api/auth/register', rateLimit({ windowMs: 60 * 60_000, limit: 10 }), async (req, res) => {
  const parsed = credentials.safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Use a valid email and a password of at least 10 characters.' });
  const email = parsed.data.email.toLowerCase();
  if (db.prepare('SELECT 1 FROM users WHERE email = ?').get(email)) return res.status(409).json({ error: 'This email is already registered.' });
  const user = { id: id(), email, display_name: parsed.data.displayName || email.split('@')[0], phone: parsed.data.phone || null, role: email === config.adminEmail ? 'admin' : 'user', created_at: now() };
  db.prepare('INSERT INTO users (id,email,password_hash,display_name,phone,role,created_at) VALUES (@id,@email,@password_hash,@display_name,@phone,@role,@created_at)').run({ ...user, password_hash: await bcrypt.hash(parsed.data.password, 12) });
  db.prepare('INSERT INTO user_plans (user_id,last_daily_reset,updated_at) VALUES (?,?,?)').run(user.id, now(), now());
  res.status(201).json({ token: sign(user), user: publicUser(user) });
});
app.post('/api/auth/login', rateLimit({ windowMs: 15 * 60_000, limit: 20 }), async (req, res) => {
  const parsed = credentials.pick({ email: true, password: true }).safeParse(req.body); if (!parsed.success) return res.status(400).json({ error: 'Invalid login request.' });
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.toLowerCase());
  if (!user || !(await bcrypt.compare(parsed.data.password, user.password_hash))) return res.status(401).json({ error: 'Incorrect email or password.' });
  res.json({ token: sign(user), user: publicUser(user) });
});
app.get('/api/auth/me', auth, (req, res) => { const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.auth.sub); return user ? res.json({ user: publicUser(user) }) : res.status(401).json({ error: 'Session expired.' }); });
app.get('/api/account/plan', auth, (req, res) => {
  const user = db.prepare('SELECT id,created_at FROM users WHERE id = ?').get(req.auth.sub);
  if (!user) return res.status(401).json({ error: 'Session expired.' });
  let row = db.prepare('SELECT * FROM user_plans WHERE user_id = ?').get(user.id);
  if (!row) {
    db.prepare('INSERT INTO user_plans (user_id,updated_at) VALUES (?,?)').run(user.id, now());
    row = db.prepare('SELECT * FROM user_plans WHERE user_id = ?').get(user.id);
  }
  resetDailyCredits(user.id);
  row = db.prepare('SELECT * FROM user_plans WHERE user_id = ?').get(user.id);
  res.json({
    id: row.user_id, userId: row.user_id, plan: row.plan,
    dailyCredits: Number(row.daily_credits), maxDailyCredits: Number(row.max_daily_credits),
    creditsUsedToday: Number(row.credits_used_today), totalCreditsUsed: Number(row.total_credits_used),
    monthlyCredits: Number(row.monthly_credits), monthlyCreditsUsed: Number(row.monthly_credits_used),
    subscriptionExpiresAt: row.subscription_expires_at || null, lastDailyReset: row.last_daily_reset || null, createdAt: user.created_at, updatedAt: row.updated_at,
  });
});

app.get('/api/projects', auth, (req, res) => res.json(db.prepare('SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC').all(req.auth.sub).map(project)));
app.get('/api/projects/:id', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  return current ? res.json(project(current)) : res.status(404).json({ error: 'Project not found.' });
});
app.post('/api/projects', auth, (req, res) => {
  try {
    const schema = z.object({ name: z.string().max(120).optional(), projectType: z.enum(['vite', 'html']).optional(), description: z.string().max(100000).optional(), files: z.record(z.unknown()).default({}) });
    const p = schema.safeParse(req.body);
    if (!p.success) {
      const issue = p.error.issues[0];
      return res.status(400).json({
        error: issue ? `Invalid project data: ${issue.path.join('.') || 'request'} ${issue.message}` : 'Invalid project data.',
      });
    }
    const record = { id: id(), user_id: req.auth.sub, name: systemProjectName(), description: p.data.description || null, project_type: 'html', files_json: JSON.stringify(p.data.files), created_at: now(), updated_at: now() };
    db.prepare('INSERT INTO projects (id,user_id,name,description,project_type,files_json,created_at,updated_at) VALUES (@id,@user_id,@name,@description,@project_type,@files_json,@created_at,@updated_at)').run(record);
    const created = project(db.prepare('SELECT * FROM projects WHERE id = ?').get(record.id));
    sendRealtimeEvent(req.auth.sub, 'project.created', { projectId: created.id });
    return res.status(201).json(created);
  } catch (error) {
    console.error('Project creation failed:', error);
    return res.status(500).json({ error: 'Could not create project. Check the server log and try again.' });
  }
});
app.patch('/api/projects/:id', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub); if (!current) return res.status(404).json({ error: 'Project not found.' });
  const allowed = ['name','description','files','isPublished','buildingPlan','generationStatus']; const updates = Object.fromEntries(Object.entries(req.body || {}).filter(([key]) => allowed.includes(key)));
  const fields = []; const values = { id: current.id, user_id: req.auth.sub, updated_at: now() };
  const columns = { name: 'name', description: 'description', files: 'files_json', isPublished: 'is_published', buildingPlan: 'building_plan_json', generationStatus: 'generation_status' };
  for (const [key, value] of Object.entries(updates)) { fields.push(`${columns[key]} = @${columns[key]}`); values[columns[key]] = ['files','buildingPlan'].includes(key) ? JSON.stringify(value) : key === 'isPublished' ? Number(Boolean(value)) : value; }
  if (!fields.length) return res.json(project(current)); fields.push('updated_at = @updated_at'); db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = @id AND user_id = @user_id`).run(values);
  const updated = project(ownedProject(current.id, req.auth.sub));
  sendRealtimeEvent(req.auth.sub, 'project.updated', { projectId: updated.id });
  res.json(updated);
});

app.get('/api/projects/:id/versions', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  res.json(db.prepare('SELECT * FROM project_versions WHERE project_id = ? AND user_id = ? ORDER BY version_number DESC')
    .all(current.id, req.auth.sub)
    .map(projectVersion));
});

app.post('/api/projects/:id/versions', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  const parsed = z.object({
    files: z.record(z.unknown()),
    chatMessages: z.array(z.unknown()),
    name: z.string().max(100).optional(),
    actionsTaken: z.array(z.unknown()).optional(),
    creditsUsed: z.number().optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid project version.' });
  const nextNumber = Number(db.prepare('SELECT COALESCE(MAX(version_number), 0) + 1 AS next FROM project_versions WHERE project_id = ?').get(current.id).next);
  const record = {
    id: id(),
    project_id: current.id,
    user_id: req.auth.sub,
    version_number: nextNumber,
    name: parsed.data.name || null,
    files_json: JSON.stringify(parsed.data.files),
    messages_json: JSON.stringify(parsed.data.chatMessages),
    actions_json: JSON.stringify(parsed.data.actionsTaken || []),
    credits_used: parsed.data.creditsUsed ?? null,
    created_at: now(),
  };
  db.prepare('INSERT INTO project_versions (id,project_id,user_id,version_number,name,files_json,messages_json,actions_json,credits_used,created_at) VALUES (@id,@project_id,@user_id,@version_number,@name,@files_json,@messages_json,@actions_json,@credits_used,@created_at)')
    .run(record);
  const created = projectVersion(db.prepare('SELECT * FROM project_versions WHERE id = ?').get(record.id));
  sendRealtimeEvent(req.auth.sub, 'version.created', { projectId: current.id, versionId: created.id });
  res.status(201).json(created);
});

app.post('/api/projects/:id/versions/snapshot', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  const parsed = z.object({ name:z.string().max(100).optional(), actionsTaken:z.array(z.unknown()).optional(), creditsUsed:z.number().optional() }).safeParse(req.body || {});
  if (!parsed.success) return res.status(400).json({ error: 'Invalid version snapshot.' });
  const chatMessages = db.prepare('SELECT * FROM chat_messages WHERE project_id = ? AND user_id = ? ORDER BY created_at ASC').all(current.id, req.auth.sub).map(chatMessage);
  const messagesJson = JSON.stringify(chatMessages);
  const latest = db.prepare('SELECT * FROM project_versions WHERE project_id = ? AND user_id = ? ORDER BY version_number DESC LIMIT 1').get(current.id, req.auth.sub);
  if (latest && latest.files_json === current.files_json && latest.messages_json === messagesJson) return res.json(projectVersion(latest));
  const nextNumber = Number(latest?.version_number || 0) + 1;
  const record = {
    id: id(), project_id: current.id, user_id: req.auth.sub, version_number: nextNumber,
    name: parsed.data.name || (nextNumber === 1 ? 'Initial Build' : `Website Update ${nextNumber}`),
    files_json: current.files_json, messages_json: messagesJson,
    actions_json: JSON.stringify(parsed.data.actionsTaken || []), credits_used: parsed.data.creditsUsed ?? null, created_at: now(),
  };
  db.prepare('INSERT INTO project_versions (id,project_id,user_id,version_number,name,files_json,messages_json,actions_json,credits_used,created_at) VALUES (@id,@project_id,@user_id,@version_number,@name,@files_json,@messages_json,@actions_json,@credits_used,@created_at)').run(record);
  const created = projectVersion(db.prepare('SELECT * FROM project_versions WHERE id = ?').get(record.id));
  sendRealtimeEvent(req.auth.sub, 'version.created', { projectId: current.id, versionId: created.id });
  res.status(201).json(created);
});

app.post('/api/projects/:id/versions/:number/rollback', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  const versionNumber = Number(req.params.number);
  if (!Number.isInteger(versionNumber) || versionNumber < 1) return res.status(400).json({ error: 'Invalid version number.' });
  const target = db.prepare('SELECT * FROM project_versions WHERE project_id = ? AND user_id = ? AND version_number = ?').get(current.id, req.auth.sub, versionNumber);
  if (!target) return res.status(404).json({ error: 'Version not found.' });

  db.transaction(() => {
    db.prepare('DELETE FROM project_versions WHERE project_id = ? AND user_id = ? AND version_number > ?').run(current.id, req.auth.sub, versionNumber);
    db.prepare('DELETE FROM chat_messages WHERE project_id = ? AND user_id = ? AND created_at > ?').run(current.id, req.auth.sub, target.created_at);
    db.prepare('UPDATE projects SET files_json = ?, generation_status = ?, updated_at = ? WHERE id = ? AND user_id = ?')
      .run(target.files_json, 'complete', now(), current.id, req.auth.sub);
  })();

  sendRealtimeEvent(req.auth.sub, 'project.updated', { projectId: current.id });
  res.json(projectVersion(target));
});

app.post('/api/projects/:id/analytics/events', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  const parsed = z.object({
    visitorId: z.string().min(1).max(100),
    eventType: z.enum(['pageview', 'click']),
    path: z.string().max(500).optional(),
    target: z.string().max(300).optional(),
  }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Invalid analytics event.' });
  const forwardedCountry = String(req.headers['cf-ipcountry'] || req.headers['x-country-code'] || '').trim().toUpperCase();
  const country = /^[A-Z]{2}$/.test(forwardedCountry) ? forwardedCountry : 'LOCAL';
  db.prepare('INSERT INTO analytics_events (id,project_id,user_id,visitor_id,event_type,path,target,country,user_agent,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id(), current.id, req.auth.sub, parsed.data.visitorId, parsed.data.eventType, parsed.data.path || '/', parsed.data.target || null, country, String(req.headers['user-agent'] || '').slice(0, 500), now());
  res.status(204).end();
});

app.get('/api/projects/:id/analytics', auth, (req, res) => {
  const current = ownedProject(req.params.id, req.auth.sub);
  if (!current) return res.status(404).json({ error: 'Project not found.' });
  const totals = db.prepare(`
    SELECT
      COUNT(DISTINCT visitor_id) AS visitors,
      SUM(CASE WHEN event_type = 'pageview' THEN 1 ELSE 0 END) AS pageviews,
      SUM(CASE WHEN event_type = 'click' THEN 1 ELSE 0 END) AS clicks
    FROM analytics_events WHERE project_id = ?
  `).get(current.id);
  const countries = db.prepare(`
    SELECT country, COUNT(DISTINCT visitor_id) AS visitors
    FROM analytics_events WHERE project_id = ?
    GROUP BY country ORDER BY visitors DESC, country ASC LIMIT 20
  `).all(current.id).map(row => ({ country: row.country || 'UNKNOWN', visitors: Number(row.visitors) }));
  const visitors = db.prepare(`
    SELECT visitor_id, country, COUNT(*) AS events, MAX(created_at) AS last_seen
    FROM analytics_events WHERE project_id = ?
    GROUP BY visitor_id, country ORDER BY last_seen DESC LIMIT 50
  `).all(current.id).map(row => ({
    visitorId: row.visitor_id,
    country: row.country || 'UNKNOWN',
    events: Number(row.events),
    lastSeen: row.last_seen,
  }));
  const targets = db.prepare(`
    SELECT target, COUNT(*) AS clicks
    FROM analytics_events
    WHERE project_id = ? AND event_type = 'click' AND target IS NOT NULL
    GROUP BY target ORDER BY clicks DESC LIMIT 20
  `).all(current.id).map(row => ({ target: row.target, clicks: Number(row.clicks) }));
  res.json({
    totals: {
      visitors: Number(totals.visitors || 0),
      pageviews: Number(totals.pageviews || 0),
      clicks: Number(totals.clicks || 0),
    },
    countries,
    visitors,
    targets,
  });
});

app.delete('/api/projects/:id', auth, (req, res) => { const result = db.prepare('DELETE FROM projects WHERE id = ? AND user_id = ?').run(req.params.id, req.auth.sub); if (result.changes) { sendRealtimeEvent(req.auth.sub, 'project.deleted', { projectId:req.params.id }); return res.status(204).end(); } return res.status(404).json({ error: 'Project not found.' }); });

app.get('/api/projects/:id/messages', auth, (req, res) => {
  if (!ownedProject(req.params.id, req.auth.sub)) return res.status(404).json({ error: 'Project not found.' });
  res.json(db.prepare('SELECT * FROM chat_messages WHERE project_id = ? AND user_id = ? ORDER BY created_at ASC').all(req.params.id, req.auth.sub).map(chatMessage));
});
app.put('/api/projects/:id/messages/:messageId', auth, (req, res) => {
  if (!ownedProject(req.params.id, req.auth.sub)) return res.status(404).json({ error: 'Project not found.' });
  const message = z.object({ role:z.enum(['user','assistant']), content:z.string().max(500000), imageUrl:z.string().max(5000000).optional(), actionsTaken:z.array(z.unknown()).optional(), creditsUsed:z.number().optional() }).safeParse(req.body);
  if (!message.success) return res.status(400).json({ error: 'Invalid message.' }); const m = message.data;
  db.prepare(`INSERT INTO chat_messages (id,project_id,user_id,role,content,image_url,credits_used,actions_json,created_at) VALUES (@id,@project_id,@user_id,@role,@content,@image_url,@credits_used,@actions_json,@created_at) ON CONFLICT(id) DO UPDATE SET content=excluded.content,image_url=excluded.image_url,credits_used=excluded.credits_used,actions_json=excluded.actions_json`).run({ id:req.params.messageId, project_id:req.params.id, user_id:req.auth.sub, role:m.role, content:m.content, image_url:m.imageUrl || null, credits_used:m.creditsUsed || null, actions_json:JSON.stringify(m.actionsTaken || []), created_at:now() });
  sendRealtimeEvent(req.auth.sub, 'message.updated', { projectId:req.params.id, messageId:req.params.messageId });
  res.status(204).end();
});

const planDefaults = { free: 3, pro: 5, business: 10 };
app.get('/api/admin/overview', auth, admin, (_req, res) => {
  const users = db.prepare(`SELECT u.id,u.email,u.display_name,u.phone,u.role,u.created_at,COALESCE(p.plan,'free') plan,COALESCE(p.daily_credits,3) daily_credits,COALESCE(p.max_daily_credits,3) max_daily_credits,COALESCE(p.credits_used_today,0) credits_used_today,COALESCE(p.monthly_credits,0) monthly_credits,COALESCE(p.monthly_credits_used,0) monthly_credits_used,p.subscription_expires_at,COUNT(pr.id) project_count FROM users u LEFT JOIN user_plans p ON p.user_id=u.id LEFT JOIN projects pr ON pr.user_id=u.id GROUP BY u.id ORDER BY u.created_at DESC`).all();
  const stats = { users: users.length, projects: users.reduce((total, user) => total + Number(user.project_count), 0), activePlans: users.filter(user => user.plan !== 'free').length, backups: db.prepare('SELECT COUNT(*) count FROM backups').get().count };
  const expiringUsers = users.filter(user => user.subscription_expires_at && new Date(user.subscription_expires_at).getTime() <= Date.now() + 14 * 24 * 60 * 60_000).sort((a,b) => String(a.subscription_expires_at).localeCompare(String(b.subscription_expires_at)));
  res.json({ stats, users, expiringUsers });
});
app.patch('/api/admin/users/:id', auth, admin, (req, res) => {
  const input = z.object({ plan: z.enum(['free','pro','business']).optional(), dailyCredits: z.number().int().min(0).max(100000).optional(), creditsUsedToday: z.number().int().min(0).max(100000).optional(), monthlyCredits: z.number().int().min(0).max(1000000).optional(), monthlyCreditsUsed: z.number().int().min(0).max(1000000).optional(), subscriptionMonths: z.number().int().min(0).max(120).optional(), role: z.enum(['user','admin']).optional() }).safeParse(req.body);
  if (!input.success) return res.status(400).json({ error: 'Invalid user update.' });
  const target = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id); if (!target) return res.status(404).json({ error: 'User not found.' });
  const value = input.data;
  if (value.role && target.email.toLowerCase() !== config.adminEmail) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(value.role, target.id);
  const current = db.prepare('SELECT * FROM user_plans WHERE user_id = ?').get(target.id) || { plan:'free', daily_credits:3, max_daily_credits:3, credits_used_today:0, monthly_credits:0, monthly_credits_used:0, total_credits_used:0 };
  const plan = value.plan || current.plan; const daily = value.dailyCredits ?? current.daily_credits ?? planDefaults[plan]; const used = value.creditsUsedToday ?? current.credits_used_today ?? 0; const monthly = value.monthlyCredits ?? current.monthly_credits ?? 0; const monthlyUsed = value.monthlyCreditsUsed ?? current.monthly_credits_used ?? 0;
  const startsAt = current.subscription_expires_at && new Date(current.subscription_expires_at) > new Date() ? current.subscription_expires_at : now();
  const expiresAt = value.subscriptionMonths === undefined ? current.subscription_expires_at || null : value.subscriptionMonths === 0 ? null : addMonths(startsAt, value.subscriptionMonths);
  db.prepare(`INSERT INTO user_plans (user_id,plan,daily_credits,max_daily_credits,credits_used_today,monthly_credits,monthly_credits_used,total_credits_used,subscription_expires_at,last_daily_reset,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET plan=excluded.plan,daily_credits=excluded.daily_credits,max_daily_credits=excluded.max_daily_credits,credits_used_today=excluded.credits_used_today,monthly_credits=excluded.monthly_credits,monthly_credits_used=excluded.monthly_credits_used,subscription_expires_at=excluded.subscription_expires_at,updated_at=excluded.updated_at`).run(target.id, plan, daily, daily, Math.min(used,daily), monthly, Math.min(monthlyUsed,monthly), current.total_credits_used || 0, expiresAt, current.last_daily_reset || now(), now());
  sendRealtimeEvent(target.id, 'account.updated');
  res.status(204).end();
});
app.get('/api/admin/celebrations', auth, admin, (_req, res) => res.json(db.prepare('SELECT name,is_active,config_json,updated_at FROM site_celebrations ORDER BY name').all().map(row => ({ name:row.name, isActive:Boolean(row.is_active), config:json(row.config_json,{}), updatedAt:row.updated_at }))));
app.patch('/api/admin/celebrations/:name', auth, admin, (req, res) => {
  if (!['ramadan','eid'].includes(req.params.name)) return res.status(404).json({ error: 'Celebration not found.' });
  const input = z.object({ isActive:z.boolean(), config:z.record(z.unknown()).optional() }).safeParse(req.body); if (!input.success) return res.status(400).json({ error:'Invalid celebration update.' });
  db.prepare('UPDATE site_celebrations SET is_active=?,config_json=?,updated_at=? WHERE name=?').run(Number(input.data.isActive), JSON.stringify(input.data.config || {}), now(), req.params.name);
  res.status(204).end();
});
app.get('/api/admin/backup-schedule', auth, admin, (_req, res) => res.json({ hourly: 'Every 60 minutes', daily: 'Every 24 hours', weekly: 'Every 7 days', retention: 30 }));

const codeSystem = `You are Vivora X's senior frontend engineer, QA engineer, and visual designer. Build browser-native websites using only HTML, CSS, and JavaScript.

RUNTIME CONTRACT:
- Build a complete static browser project. index.html is the required entry point, but you may create as many additional files and folders as the product genuinely needs.
- Allowed file types are .html, .css, .js, .json, .svg, .txt, and .md. Use safe relative paths such as pages/about.html, assets/css/theme.css, and assets/js/navigation.js.
- Multi-page requests must use real linked HTML pages. Use correct relative href and src paths from every folder.
- Keep shared styles and scripts reusable instead of duplicating large blocks across pages.
- Use semantic HTML, modern plain CSS, and browser-native JavaScript.
- Never output React, JSX, TypeScript, Vite, Next.js, Vue, Svelte, Tailwind, npm files, package.json, build configs, component frameworks, or package imports.
- If the user asks for an unsupported framework, implement the requested experience with native browser files instead.
- Use browser-safe APIs only. Keep private keys and backend-only logic out of the generated files.
- Generated websites are frontend-only. Do not create database code, backend endpoints, authentication servers, or pretend persistence.

QUALITY CONTRACT:
- Build a fully functional product, not a mockup: real navigation/state/forms/actions, useful sample data, responsive layouts, keyboard focus, and loading/error/empty states where relevant.
- Use a deliberate visual system with strong hierarchy, typography, spacing, contrast, and responsive behavior. Avoid generic card grids and decorative gradients unless the brief earns them.
- Before outputting, silently audit the HTML structure, CSS selectors, responsive states, DOM selectors, event listeners, links, forms, and browser-console errors. Repair all issues in the final files.
- Keep the response focused on FILE blocks; do not include a design explanation, reasoning, or prose outside the required SUMMARY.
- For edits, preserve everything unrelated and prefer compact exact SEARCH/REPLACE patches for localized changes.

OUTPUT CONTRACT:
- For initial builds, return repeated <FILE path="relative/path">complete file contents</FILE> blocks.
- For localized edits and AUTO-FIX, return <PATCH path="relative/path"><SEARCH>exact current snippet</SEARCH><REPLACE>corrected snippet</REPLACE></PATCH>. SEARCH must match exactly and identify one location.
- Use complete FILE blocks during an edit only for new files or when most of the file genuinely changes. Never return analysis-only or read-only actions.
- End with <SUMMARY>what was built, files changed, interactions implemented, and checks performed</SUMMARY>.
- FILE paths may use folders but must stay relative, must not contain "..", and must use an allowed browser-native extension.
- Never mention a file unless you output it. Never use markdown code fences outside FILE blocks.` + designQualitySystem;
const autoFixSystem = `You are Vivora X's fast automatic repair engine for an existing browser-native website.

- Fix the reported reproducible error only. The user message includes the exact error and the current source file.
- Inspect only the named failing file unless the supplied evidence proves one direct dependency is required.
- Make the smallest safe correction and preserve all unrelated code, formatting, behavior, copy, and design.
- Return ONLY one or more exact patches in this format:
<PATCH path="relative/file.js">
<SEARCH>exact snippet copied from the current file</SEARCH>
<REPLACE>corrected snippet</REPLACE>
</PATCH>
- SEARCH must match the supplied source exactly and include enough context to identify one location.
- Never return read actions, analysis, markdown fences, plans, unchanged files, or a full rewritten file.
- End with one short <SUMMARY> describing the repaired error.</SUMMARY>.`;
const promptForMode = (mode) => ({
  code: codeSystem,
  explanation: `Return exactly one short, natural sentence describing the concrete website or change you are about to implement.
Mention the subject-led art direction or primary interaction that matters most, and use the user's language.
Stay strictly within the user's request. Do not invent business details or suggest gathering assets.
Never mention choosing a platform/CMS, buying a domain, hosting, SSL, launch, publishing, analytics, backups, photography, maintenance schedules, or other work outside the generated app unless the user explicitly requested that exact capability.
Do not output bullets, numbering, headings, code, XML tags, JSON, generic filler, React, frameworks, or build tooling.`,
  suggestions: 'Return ONLY a JSON array of exactly four objects with the string keys "label" and "prompt". Make each suggestion a concrete, subject-specific improvement to composition, typography, responsive behavior, or one purposeful interaction; never return generic polish advice or repeat the same effect. Every suggestion must be possible using only HTML, CSS, and browser-native JavaScript. Never suggest React, frameworks, packages, build tools, a database, or a backend. No markdown or explanation.',
  'version-name': 'Return ONLY a short version name of two to five words. No code, XML, JSON, or explanation.',
  clarify: 'Ask only the smallest set of clear product questions needed to build the request. Do not output code or file blocks.',
  chat: 'Answer the user clearly and helpfully in plain text. Do not output code unless they explicitly requested code.',
  status: 'Return a short plain-text progress status. Do not output code, XML, or JSON.',
}[mode] || codeSystem);
app.post('/api/generate', auth, rateLimit({ windowMs: 60_000, limit: 12 }), async (req, res) => {
  if (!config.openRouterKey) return res.status(503).json({ error: 'OpenRouter generation is not configured on the server.' });
  const payload = z.object({ mode:z.enum(['code','status','explanation','suggestions','chat','version-name','clarify']).default('code'), messages:z.array(z.object({ role:z.enum(['user','assistant','system']), content:z.any() })).min(1).max(60), userLanguage:z.string().max(10).optional(), projectId:z.string().uuid().optional(), generationKind:z.enum(['initial','edit']).optional(), colorTheme:z.object({ name:z.string().max(80), colors:z.array(z.string().regex(/^#[0-9a-f]{6}$/i)).min(1).max(8) }).optional() }).safeParse(req.body);
  if (!payload.success) return res.status(400).json({ error: 'Invalid generation request.' });
  let reservation = null;
  let generationProject = null;
  if (payload.data.mode === 'code') {
    generationProject = payload.data.projectId ? ownedProject(payload.data.projectId, req.auth.sub) : null;
    if (!generationProject) return res.status(404).json({ error: 'Project not found.' });
    reservation = reserveGenerationCredit(req.auth.sub, payload.data.projectId, payload.data.generationKind || 'edit');
    if (!reservation) return res.status(402).json({ error: 'There are not enough credits for this generation.' });
  }
  let upstream;
  const latestUserContent = [...payload.data.messages].reverse().find(message => message.role === 'user')?.content;
  const isAutoFix = payload.data.mode === 'code' && typeof latestUserContent === 'string' && latestUserContent.startsWith('[AUTO-FIX]');
  const themeDirective = payload.data.colorTheme
    ? `\n\nSELECTED DESIGN SYSTEM (MANDATORY): Use the “${payload.data.colorTheme.name}” palette as real CSS design tokens throughout the result: ${payload.data.colorTheme.colors.join(', ')}. Preserve accessible contrast while keeping these colors visibly dominant. Do not substitute a different palette.`
    : '';
  const systemPrompt = `${isAutoFix ? autoFixSystem : promptForMode(payload.data.mode)}${themeDirective}`;
  const temperature = isAutoFix ? 0.1 : payload.data.mode === 'code' ? 0.35 : 0.25;
  const maxTokens = isAutoFix ? 6000 : payload.data.mode === 'explanation' ? 240 : payload.data.mode === 'code' ? 35000 : 8000;
  try { upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{ 'Authorization':`Bearer ${config.openRouterKey}`, 'Content-Type':'application/json', 'HTTP-Referer': process.env.OPENROUTER_SITE_URL || 'https://vivorax.online', 'X-Title':'Vivora X' }, body:JSON.stringify({ model:'qwen/qwen3.7-flash', stream:true, temperature, max_tokens:maxTokens, messages:[{ role:'system', content:systemPrompt }, ...payload.data.messages] }) }); }
  catch (error) { if (reservation) finalizeReservation(reservation.id, false); throw error; }
  if (!upstream.ok || !upstream.body) {
    if (reservation) finalizeReservation(reservation.id, false);
    const upstreamError = await upstream.text().catch(() => '');
    return res.status(upstream.status || 502).json({ error: `OpenRouter رفض طلب التوليد. ${upstreamError.slice(0, 500) || 'تحقق من الرصيد وصلاحية المفتاح.'}` });
  }
  if (reservation) res.setHeader('X-Webo-Credits-Reserved', String(reservation.cost));
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  upstream.body.pipeTo(new WritableStream({ write(chunk) { res.write(chunk); res.flush?.(); }, close() { if (reservation) finalizeReservation(reservation.id, true); res.end(); }, abort() { if (reservation) finalizeReservation(reservation.id, false); res.end(); } })).catch(() => { if (reservation) finalizeReservation(reservation.id, false); res.end(); });
});

function createBackup(kind, createdBy = null) {
  const stamp = now().replace(/[:.]/g, '-'); const filename = `webo-${kind}-${stamp}.sqlite`; const target = join(backupDir, filename);
  db.pragma('wal_checkpoint(TRUNCATE)'); copyFileSync(join(config.dataDir, 'webo.sqlite'), target); db.prepare('INSERT INTO backups (id,kind,filename,created_by,created_at) VALUES (?,?,?,?,?)').run(id(), kind, filename, createdBy, now());
  const files = readdirSync(backupDir).map(name => ({ name, path:join(backupDir,name), time:statSync(join(backupDir,name)).mtimeMs })).sort((a,b)=>b.time-a.time); files.slice(30).forEach(file => unlinkSync(file.path)); return filename;
}
app.get('/api/admin/backups', auth, admin, (_req,res) => res.json(db.prepare('SELECT id,kind,filename,created_at FROM backups ORDER BY created_at DESC LIMIT 30').all()));
app.post('/api/admin/backups', auth, admin, (req,res) => res.status(201).json({ filename:createBackup('manual', req.auth.sub) }));
app.use((err, _req, res, _next) => { console.error(err); res.status(500).json({ error: 'Unexpected server error.' }); });

setInterval(() => createBackup('hourly'), 60 * 60_000).unref();
setInterval(() => createBackup('daily'), 24 * 60 * 60_000).unref();
setInterval(() => createBackup('weekly'), 7 * 24 * 60 * 60_000).unref();
if (!existsSync(join(backupDir, '.initialized'))) { createBackup('initial'); }
// Keep an explicit server reference: some local/cPanel launchers otherwise
// detach the event loop immediately after startup.
const httpServer = app.listen(config.port, () => console.log(`Vivora X server listening on port ${config.port}`));
httpServer.ref();
