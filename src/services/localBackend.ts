/**
 * Local-only backend.
 *
 * The project used to depend on an external Node/SQLite server
 * (egyhost1.com). That host is unreachable, so every REST call is now served
 * in-browser from localStorage. This keeps the app fully offline/open-source
 * friendly: no database, no cloud, no API server to deploy.
 */

type Json = Record<string, any>;

const DB_KEY = 'webo_local_db';
const EVENT_NAME = 'webo-local-event';

interface LocalDb {
  users: Json[];
  projects: Json[];
  messages: Record<string, Json[]>;
  versions: Record<string, Json[]>;
  stores: Json[];
}

const emptyDb = (): LocalDb => ({ users: [], projects: [], messages: {}, versions: {}, stores: [] });

function readDb(): LocalDb {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (!raw) return emptyDb();
    return { ...emptyDb(), ...(JSON.parse(raw) as LocalDb) };
  } catch {
    return emptyDb();
  }
}

function writeDb(db: LocalDb) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

export function emitLocalEvent(type: string, detail: Json = {}) {
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: { type, at: new Date().toISOString(), ...detail } }));
}

export function subscribeLocalEvents(handler: (event: Json) => void) {
  const listener = (event: Event) => handler((event as CustomEvent).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
const now = () => new Date().toISOString();
const slugify = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9\u0600-\u06ff]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || `store-${uid().slice(0, 6)}`;

// A local password "hash". This never leaves the device and only prevents the
// plain password from sitting in localStorage in readable form.
const hash = (value: string) => {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `h${(h >>> 0).toString(36)}`;
};

const publicUser = (user: Json) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  phone: user.phone || undefined,
  role: user.role,
});

const unlimitedPlan = (userId: string) => ({
  id: `plan-${userId}`,
  userId,
  plan: 'business' as const,
  dailyCredits: 999999,
  maxDailyCredits: 999999,
  creditsUsedToday: 0,
  totalCreditsUsed: 0,
  monthlyCredits: 999999,
  monthlyCreditsUsed: 0,
  subscriptionExpiresAt: null,
  lastDailyReset: now(),
  createdAt: now(),
  updatedAt: now(),
});

export class LocalApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export const localToken = (userId: string) => `local.${userId}`;
const userIdFromToken = (token: string | null) => (token && token.startsWith('local.') ? token.slice(6) : null);

function requireUser(db: LocalDb, token: string | null): Json {
  const id = userIdFromToken(token);
  const user = id ? db.users.find(item => item.id === id) : null;
  if (!user) throw new LocalApiError(401, 'Please sign in again.');
  return user;
}

function ownedProject(db: LocalDb, projectId: string, userId: string): Json {
  const project = db.projects.find(item => item.id === projectId && item.userId === userId);
  if (!project) throw new LocalApiError(404, 'Project not found.');
  return project;
}

function ownedStore(db: LocalDb, storeId: string, userId: string): Json {
  const store = db.stores.find(item => item.id === storeId && item.ownerUserId === userId);
  if (!store) throw new LocalApiError(404, 'Store not found.');
  return store;
}

const randomProjectName = () => {
  const adjectives = ['Amber', 'Atlas', 'Bright', 'Cedar', 'Cloud', 'Coral', 'Delta', 'Echo', 'Lunar', 'Nova', 'Pixel', 'River', 'Solar', 'Velvet'];
  const nouns = ['Canvas', 'Forge', 'Harbor', 'Meadow', 'Nest', 'Orbit', 'Page', 'Studio', 'Trail', 'Wave', 'Works'];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;
};

/**
 * Routes a REST-style request against the local store.
 * Returns the response payload, or undefined for 204-style calls.
 */
export async function handleLocalRequest(path: string, init: RequestInit, token: string | null): Promise<any> {
  const method = (init.method || 'GET').toUpperCase();
  const body: Json = init.body ? JSON.parse(String(init.body)) : {};
  const db = readDb();
  const segments = path.split('?')[0].split('/').filter(Boolean);

  // ── Auth ──────────────────────────────────────────────────────────────────
  if (segments[0] === 'auth') {
    if (segments[1] === 'register' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '');
      if (!email.includes('@')) throw new LocalApiError(400, 'Enter a valid email address.');
      if (password.length < 10) throw new LocalApiError(400, 'Use a password with at least 10 characters.');
      if (db.users.some(user => user.email === email)) throw new LocalApiError(409, 'This email already has an account on this device.');
      const user = {
        id: uid(),
        email,
        displayName: body.displayName || email.split('@')[0],
        phone: body.phone || undefined,
        role: db.users.length === 0 ? 'admin' : 'user',
        passwordHash: hash(password),
        createdAt: now(),
      };
      db.users.push(user);
      writeDb(db);
      return { token: localToken(user.id), user: publicUser(user) };
    }

    if (segments[1] === 'login' && method === 'POST') {
      const email = String(body.email || '').trim().toLowerCase();
      const user = db.users.find(item => item.email === email);
      if (!user || user.passwordHash !== hash(String(body.password || ''))) {
        throw new LocalApiError(401, 'Invalid email or password.');
      }
      return { token: localToken(user.id), user: publicUser(user) };
    }

    if (segments[1] === 'me' && method === 'GET') {
      return { user: publicUser(requireUser(db, token)) };
    }
  }

  // ── Account ───────────────────────────────────────────────────────────────
  if (path.startsWith('/account/plan')) {
    return unlimitedPlan(requireUser(db, token).id);
  }

  if (path.startsWith('/site/celebrations')) {
    return [
      { name: 'ramadan', isActive: localStorage.getItem('vivora_show_ramadan') === 'true', config: {}, updatedAt: now() },
      { name: 'eid', isActive: localStorage.getItem('vivora_show_eid') === 'true', config: {}, updatedAt: now() },
    ];
  }

  if (segments[0] === 'admin') {
    const user = requireUser(db, token);
    if (path.startsWith('/admin/overview')) {
      return {
        stats: { users: db.users.length, projects: db.projects.length, activePlans: db.users.length, backups: 0 },
        users: db.users.map(item => ({
          ...publicUser(item),
          created_at: item.createdAt,
          display_name: item.displayName,
          plan: 'business',
          daily_credits: 999999,
          max_daily_credits: 999999,
          credits_used_today: 0,
          monthly_credits: 999999,
          monthly_credits_used: 0,
          subscription_expires_at: null,
          project_count: db.projects.filter(project => project.userId === item.id).length,
        })),
        expiringUsers: [],
      };
    }
    if (path.startsWith('/admin/celebrations')) return method === 'GET' ? [] : undefined;
    if (path.startsWith('/admin/backup')) return method === 'GET' ? [] : { filename: 'local-only' };
    void user;
    return undefined;
  }

  // ── Projects ──────────────────────────────────────────────────────────────
  if (segments[0] === 'projects') {
    const user = requireUser(db, token);

    if (segments.length === 1) {
      if (method === 'GET') {
        return db.projects
          .filter(project => project.userId === user.id)
          .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      }
      if (method === 'POST') {
        const project = {
          id: uid(),
          userId: user.id,
          name: String(body.name || '').trim() || randomProjectName(),
          description: body.description || undefined,
          projectType: 'html',
          files: body.files || {},
          isPublished: false,
          publishedSlug: undefined,
          buildingPlan: undefined,
          generationStatus: undefined,
          createdAt: now(),
          updatedAt: now(),
        };
        db.projects.unshift(project);
        writeDb(db);
        emitLocalEvent('project.created', { projectId: project.id });
        return project;
      }
    }

    const projectId = segments[1];
    const project = ownedProject(db, projectId, user.id);

    if (segments.length === 2) {
      if (method === 'GET') return project;
      if (method === 'PATCH') {
        for (const key of ['name', 'description', 'files', 'isPublished', 'buildingPlan', 'generationStatus'] as const) {
          if (key in body) (project as Json)[key] = body[key];
        }
        project.updatedAt = now();
        writeDb(db);
        emitLocalEvent('project.updated', { projectId });
        return project;
      }
      if (method === 'DELETE') {
        db.projects = db.projects.filter(item => item.id !== projectId);
        delete db.messages[projectId];
        delete db.versions[projectId];
        writeDb(db);
        emitLocalEvent('project.deleted', { projectId });
        return undefined;
      }
    }

    // Chat messages
    if (segments[2] === 'messages') {
      const list = db.messages[projectId] || (db.messages[projectId] = []);
      if (segments.length === 3 && method === 'GET') {
        return [...list].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)));
      }
      if (segments.length === 4 && method === 'PUT') {
        const id = segments[3];
        const message = {
          id,
          role: body.role,
          content: body.content ?? '',
          imageUrl: body.imageUrl || undefined,
          actionsTaken: body.actionsTaken || [],
          creditsUsed: body.creditsUsed || undefined,
          createdAt: list.find(item => item.id === id)?.createdAt || now(),
        };
        const index = list.findIndex(item => item.id === id);
        if (index === -1) list.push(message);
        else list[index] = message;
        writeDb(db);
        emitLocalEvent('message.updated', { projectId, messageId: id });
        return undefined;
      }
    }

    // Versions
    if (segments[2] === 'versions') {
      const list = db.versions[projectId] || (db.versions[projectId] = []);
      const nextNumber = () => list.reduce((max, item) => Math.max(max, Number(item.versionNumber) || 0), 0) + 1;

      if (segments.length === 3) {
        if (method === 'GET') return [...list].sort((a, b) => Number(b.versionNumber) - Number(a.versionNumber));
        if (method === 'POST') {
          const version = {
            id: uid(),
            projectId,
            userId: user.id,
            versionNumber: nextNumber(),
            name: body.name || undefined,
            files: body.files || project.files || {},
            chatMessages: body.chatMessages || [],
            actionsTaken: body.actionsTaken || [],
            creditsUsed: body.creditsUsed,
            createdAt: now(),
          };
          list.push(version);
          writeDb(db);
          emitLocalEvent('version.created', { projectId, versionId: version.id });
          return version;
        }
      }

      if (segments[3] === 'snapshot' && method === 'POST') {
        const version = {
          id: uid(),
          projectId,
          userId: user.id,
          versionNumber: nextNumber(),
          name: body.name || undefined,
          files: project.files || {},
          chatMessages: db.messages[projectId] || [],
          actionsTaken: body.actionsTaken || [],
          creditsUsed: body.creditsUsed,
          createdAt: now(),
        };
        list.push(version);
        writeDb(db);
        emitLocalEvent('version.created', { projectId, versionId: version.id });
        return version;
      }

      if (segments[4] === 'rollback' && method === 'POST') {
        const number = Number(segments[3]);
        const version = list.find(item => Number(item.versionNumber) === number);
        if (!version) throw new LocalApiError(404, 'Version not found.');
        project.files = version.files;
        project.updatedAt = now();
        db.versions[projectId] = list.filter(item => Number(item.versionNumber) <= number);
        db.messages[projectId] = Array.isArray(version.chatMessages) ? version.chatMessages : db.messages[projectId] || [];
        writeDb(db);
        emitLocalEvent('project.updated', { projectId });
        return version;
      }
    }

    // Analytics is not tracked locally.
    if (segments[2] === 'analytics') {
      if (method === 'GET') return { totals: { visits: 0, sessions: 0, recordings: 0 }, events: [], recordings: [], pages: [], referrers: [], devices: [] };
      return undefined;
    }
  }

  // ── Stores ────────────────────────────────────────────────────────────────
  if (segments[0] === 'public' && segments[1] === 'stores') {
    const store = db.stores.find(item => item.slug === segments[2]);
    if (!store) throw new LocalApiError(404, 'Store not found.');
    if (segments[3] === 'orders' && method === 'POST') {
      const order = { id: uid(), storeId: store.id, status: 'new', createdAt: now(), ...body };
      store.orders = [order, ...(store.orders || [])];
      writeDb(db);
      return order;
    }
    return store;
  }

  if (segments[0] === 'stores') {
    const user = requireUser(db, token);

    if (segments.length === 1) {
      if (method === 'GET') return db.stores.filter(store => store.ownerUserId === user.id);
      if (method === 'POST') {
        const blueprint: Json = body.blueprint || {};
        const store = {
          id: uid(),
          ownerUserId: user.id,
          name: blueprint.name || 'Store',
          slug: slugify(blueprint.name || 'store'),
          prompt: body.prompt || '',
          status: 'draft',
          config: blueprint.config || {},
          social: blueprint.social || {},
          products: [],
          orders: [],
          createdAt: now(),
          updatedAt: now(),
        };
        db.stores.unshift(store);
        writeDb(db);
        emitLocalEvent('store.created', { storeId: store.id });
        return store;
      }
    }

    const store = ownedStore(db, segments[1], user.id);

    if (segments.length === 2) {
      if (method === 'GET') return store;
      if (method === 'PATCH') {
        for (const key of ['name', 'status', 'config', 'social'] as const) {
          if (key in body) (store as Json)[key] = body[key];
        }
        store.updatedAt = now();
        writeDb(db);
        emitLocalEvent('store.updated', { storeId: store.id });
        return store;
      }
    }

    if (segments[2] === 'products') {
      store.products = store.products || [];
      if (segments.length === 3 && method === 'POST') {
        const product = { id: uid(), storeId: store.id, createdAt: now(), ...body, slug: slugify(String(body.name || 'product')) };
        store.products.unshift(product);
        writeDb(db);
        return product;
      }
      const productId = segments[3];
      const index = store.products.findIndex((item: Json) => item.id === productId);
      if (index === -1) throw new LocalApiError(404, 'Product not found.');
      if (method === 'PATCH') {
        store.products[index] = { ...store.products[index], ...body };
        writeDb(db);
        return store.products[index];
      }
      if (method === 'DELETE') {
        store.products.splice(index, 1);
        writeDb(db);
        return undefined;
      }
    }

    if (segments[2] === 'orders' && method === 'PATCH') {
      store.orders = store.orders || [];
      const index = store.orders.findIndex((item: Json) => item.id === segments[3]);
      if (index === -1) throw new LocalApiError(404, 'Order not found.');
      store.orders[index] = { ...store.orders[index], status: body.status };
      writeDb(db);
      return store.orders[index];
    }
  }

  throw new LocalApiError(404, `Unsupported local endpoint: ${method} ${path}`);
}
