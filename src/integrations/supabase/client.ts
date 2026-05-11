// ============================================================================
// LOCAL MOCK of Supabase client. The project is fully local — no backend.
// All "tables" live in localStorage. functions.invoke('generate-code', ...)
// is intercepted and routed to the user-configured AI provider.
// ============================================================================

import type { Database } from './types';
import { callAI, type AIMode } from '@/services/aiClient';

// --- Local user (auto-created, single user) ---
const USER_KEY = 'vivora_local_user';
const TABLE_PREFIX = 'vivora_table_';

function getOrCreateLocalUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const u = {
    id: 'local-user',
    email: 'you@local.dev',
    user_metadata: { display_name: 'You', avatar_url: null },
    app_metadata: {},
    aud: 'authenticated',
    created_at: new Date().toISOString(),
  };
  localStorage.setItem(USER_KEY, JSON.stringify(u));
  return u;
}

const localUser = getOrCreateLocalUser();
const localSession = {
  user: localUser,
  access_token: 'local-token',
  refresh_token: 'local-refresh',
  expires_at: Date.now() / 1000 + 3600 * 24 * 365,
  token_type: 'bearer',
};

// --- Table storage helpers ---
function loadTable(name: string): any[] {
  try {
    const raw = localStorage.getItem(TABLE_PREFIX + name);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function saveTable(name: string, rows: any[]) {
  try {
    localStorage.setItem(TABLE_PREFIX + name, JSON.stringify(rows));
  } catch (e) {
    console.warn('[localdb] localStorage quota exceeded for', name);
  }
}
function uuid(): string {
  if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) return (crypto as any).randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// --- Query builder ---
class Query {
  private rows: any[];
  private filters: Array<(r: any) => boolean> = [];
  private orderBy: { col: string; asc: boolean } | null = null;
  private limitN: number | null = null;
  private selectCols: string | null = null;
  private operation: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private upsertOpts: any = null;

  constructor(private table: string) {
    this.rows = loadTable(table);
  }
  select(cols?: string) {
    this.operation = 'select';
    this.selectCols = cols || '*';
    return this;
  }
  insert(payload: any) {
    this.operation = 'insert';
    this.payload = payload;
    return this;
  }
  update(payload: any) {
    this.operation = 'update';
    this.payload = payload;
    return this;
  }
  delete() {
    this.operation = 'delete';
    return this;
  }
  upsert(payload: any, opts?: any) {
    this.operation = 'upsert';
    this.payload = payload;
    this.upsertOpts = opts;
    return this;
  }
  eq(col: string, val: any) { this.filters.push(r => r[col] === val); return this; }
  neq(col: string, val: any) { this.filters.push(r => r[col] !== val); return this; }
  gt(col: string, val: any) { this.filters.push(r => r[col] > val); return this; }
  gte(col: string, val: any) { this.filters.push(r => r[col] >= val); return this; }
  lt(col: string, val: any) { this.filters.push(r => r[col] < val); return this; }
  lte(col: string, val: any) { this.filters.push(r => r[col] <= val); return this; }
  in(col: string, vals: any[]) { this.filters.push(r => vals.includes(r[col])); return this; }
  is(col: string, val: any) { this.filters.push(r => r[col] === val); return this; }
  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy = { col, asc: opts?.ascending !== false };
    return this;
  }
  limit(n: number) { this.limitN = n; return this; }

  private apply(): any[] {
    let out = this.rows.filter(r => this.filters.every(f => f(r)));
    if (this.orderBy) {
      const { col, asc } = this.orderBy;
      out = [...out].sort((a, b) => {
        const va = a[col]; const vb = b[col];
        if (va === vb) return 0;
        if (va == null) return asc ? 1 : -1;
        if (vb == null) return asc ? -1 : 1;
        return (va > vb ? 1 : -1) * (asc ? 1 : -1);
      });
    }
    if (this.limitN != null) out = out.slice(0, this.limitN);
    return out;
  }

  private execute(): { data: any; error: any } {
    try {
      if (this.operation === 'select') {
        return { data: this.apply(), error: null };
      }
      if (this.operation === 'insert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const now = new Date().toISOString();
        const inserted = items.map((it: any) => ({
          id: it.id || uuid(),
          created_at: it.created_at || now,
          updated_at: now,
          ...it,
        }));
        const next = [...this.rows, ...inserted];
        saveTable(this.table, next);
        return { data: inserted, error: null };
      }
      if (this.operation === 'update') {
        const matched = this.apply();
        const ids = new Set(matched.map((r: any) => r.id));
        const now = new Date().toISOString();
        const next = this.rows.map(r => ids.has(r.id) ? { ...r, ...this.payload, updated_at: now } : r);
        saveTable(this.table, next);
        const updated = next.filter(r => ids.has(r.id));
        return { data: updated, error: null };
      }
      if (this.operation === 'delete') {
        const matched = this.apply();
        const ids = new Set(matched.map((r: any) => r.id));
        const next = this.rows.filter(r => !ids.has(r.id));
        saveTable(this.table, next);
        return { data: matched, error: null };
      }
      if (this.operation === 'upsert') {
        const items = Array.isArray(this.payload) ? this.payload : [this.payload];
        const conflict = this.upsertOpts?.onConflict || 'id';
        const now = new Date().toISOString();
        let next = [...this.rows];
        const result: any[] = [];
        for (const it of items) {
          const matchVal = it[conflict];
          const idx = next.findIndex(r => r[conflict] === matchVal);
          if (idx >= 0) {
            next[idx] = { ...next[idx], ...it, updated_at: now };
            result.push(next[idx]);
          } else {
            const newRow = { id: it.id || uuid(), created_at: now, updated_at: now, ...it };
            next.push(newRow);
            result.push(newRow);
          }
        }
        saveTable(this.table, next);
        return { data: result, error: null };
      }
    } catch (e: any) {
      return { data: null, error: { message: e?.message || String(e) } };
    }
    return { data: null, error: null };
  }

  // single() / maybeSingle() / generic await: return promise
  single() {
    const { data, error } = this.execute();
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return Promise.resolve({ data: arr[0] || null, error: arr.length === 0 ? { message: 'no rows', code: 'PGRST116' } : error });
  }
  maybeSingle() {
    const { data, error } = this.execute();
    const arr = Array.isArray(data) ? data : (data ? [data] : []);
    return Promise.resolve({ data: arr[0] || null, error });
  }
  then(resolve: any, reject?: any) {
    return Promise.resolve(this.execute()).then(resolve, reject);
  }
}

// --- Auth shim ---
const authListeners: Array<(event: string, session: any) => void> = [];
const auth = {
  async getSession() {
    return { data: { session: localSession }, error: null };
  },
  async getUser() {
    return { data: { user: localUser }, error: null };
  },
  onAuthStateChange(cb: (event: string, session: any) => void) {
    authListeners.push(cb);
    // fire INITIAL_SESSION immediately (next tick)
    queueMicrotask(() => cb('INITIAL_SESSION', localSession));
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            const i = authListeners.indexOf(cb);
            if (i >= 0) authListeners.splice(i, 1);
          },
        },
      },
    };
  },
  async signUp({ email, password, options }: any) {
    const u = { ...localUser, email, user_metadata: { ...(localUser.user_metadata || {}), ...(options?.data || {}) } };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    Object.assign(localUser, u);
    return { data: { user: u, session: localSession }, error: null };
  },
  async signInWithPassword({ email }: any) {
    const u = { ...localUser, email };
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    Object.assign(localUser, u);
    return { data: { user: u, session: localSession }, error: null };
  },
  async signOut() {
    return { error: null };
  },
  async signInWithOAuth() {
    return { data: { url: null, provider: 'google' }, error: null };
  },
};

// --- Functions / RPC (intercept generate-code only; everything else no-op) ---
const functions = {
  async invoke(name: string, opts?: { body?: any }) {
    if (name === 'generate-code') {
      // Route to local AI provider — return a Response in fetch shape.
      const body = opts?.body || {};
      const mode: AIMode = body.mode || 'chat';
      try {
        const resp = await callAI(mode, body.messages || [], {
          userLanguage: body.userLanguage,
          colorTheme: body.colorTheme,
          stream: true,
        });
        return { data: resp, error: resp.ok ? null : { message: `AI provider returned ${resp.status}` } };
      } catch (e: any) {
        return { data: null, error: { message: e?.message || 'AI call failed' } };
      }
    }
    // All other edge functions: no-op success
    return { data: null, error: null };
  },
};

const rpc = async (_name: string, _args?: any) => {
  // delete_project_cascade & check_and_reset_user_credits etc — handle locally where needed
  return { data: null, error: null };
};

// --- Storage shim (file uploads → data URL, local only) ---
const storage = {
  from(_bucket: string) {
    return {
      async upload(path: string, file: File) {
        // Convert to data URL — fully local
        const dataUrl: string = await new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.onerror = rej;
          r.readAsDataURL(file);
        });
        // Store under a virtual key so getPublicUrl can return it
        localStorage.setItem('vivora_blob_' + path, dataUrl);
        return { data: { path }, error: null };
      },
      getPublicUrl(path: string) {
        const url = localStorage.getItem('vivora_blob_' + path) || '';
        return { data: { publicUrl: url } };
      },
    };
  },
};

// --- Channel (realtime no-op) ---
const channel = (_name: string) => {
  const c: any = { on: () => c, subscribe: () => c, unsubscribe: () => c };
  return c;
};

export const supabase: any = {
  auth,
  from: (table: string) => new Query(table),
  rpc,
  functions,
  storage,
  channel,
  removeChannel: () => {},
};

// Re-export as default for any default-import callers
export default supabase;
