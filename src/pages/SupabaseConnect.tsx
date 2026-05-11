import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, ArrowLeft, Database, Terminal, Code2, ExternalLink, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CodeBlockProps {
  code: string;
  lang?: string;
}

function CodeBlock({ code, lang = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative rounded-xl overflow-hidden border border-border bg-card">
      <div className="flex items-center justify-between px-4 py-2 bg-accent/50 border-b border-border">
        <span className="text-xs text-muted-foreground font-mono">{lang}</span>
        <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <><Check className="w-3.5 h-3.5 text-green-500" /><span className="text-green-500">Copied!</span></> : <><Copy className="w-3.5 h-3.5" />Copy</>}
        </button>
      </div>
      <pre className="p-4 text-sm text-green-400 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function SupabaseConnect() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-green-500" />
            <span className="font-bold text-sm">Supabase Integration Guide</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-16">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Database className="w-8 h-8 text-green-500" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Connect Your Supabase</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Add a real database to your generated project. Store data, authenticate users, and run backend logic.
          </p>
        </motion.div>

        <div className="space-y-12">
          {/* Step 1 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-sm flex-shrink-0">1</div>
              <h2 className="text-2xl font-bold">Create a Supabase Project</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">
                Go to <a href="https://supabase.com" target="_blank" rel="noopener" className="text-green-500 hover:underline inline-flex items-center gap-1">supabase.com <ExternalLink className="w-3 h-3" /></a> and create a free account, then a new project.
              </p>
              <div className="bg-card border border-border rounded-xl p-5">
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li>Go to <strong className="text-foreground">supabase.com/dashboard</strong></li>
                  <li>Click <strong className="text-foreground">"New Project"</strong></li>
                  <li>Choose a name, database password, and region</li>
                  <li>Wait ~2 minutes for provisioning</li>
                </ol>
              </div>
            </div>
          </motion.div>

          {/* Step 2 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-sm flex-shrink-0">2</div>
              <h2 className="text-2xl font-bold">Get Your URL & Anon Key</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">In your project, go to <strong className="text-foreground">Settings → API</strong>. You need:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-4">
                  <p className="text-xs text-green-500 font-medium mb-1 uppercase tracking-wide">Project URL</p>
                  <code className="text-sm text-foreground font-mono">https://xxxx.supabase.co</code>
                  <p className="text-xs text-muted-foreground mt-2">Settings → API → Project URL</p>
                </div>
                <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                  <p className="text-xs text-blue-500 font-medium mb-1 uppercase tracking-wide">Anon (Public) Key</p>
                  <code className="text-sm text-foreground font-mono">eyJhbGci...</code>
                  <p className="text-xs text-muted-foreground mt-2">Settings → API → Project API Keys</p>
                </div>
              </div>
              <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">The <strong className="text-foreground">anon key</strong> is safe for frontend. Never expose your <strong className="text-foreground">service_role key</strong> in the browser — it has full admin access.</p>
              </div>
            </div>
          </motion.div>

          {/* Step 3 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-sm flex-shrink-0">3</div>
              <h2 className="text-2xl font-bold">Connect in the Editor</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">In the project editor, click the <strong className="text-foreground">🗄️ Database</strong> tab. Paste your URL and anon key, then click Connect.</p>
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-sm text-muted-foreground mb-3">Once connected, tell the AI what you need:</p>
                <div className="space-y-2">
                  {[
                    '"Add user authentication with email/password"',
                    '"Create a todos table and show them in the UI"',
                    '"Store contact form submissions in the database"',
                    '"Add a products table with CRUD operations"',
                  ].map((ex, i) => (
                    <div key={i} className="bg-green-500/5 border border-green-500/20 rounded-lg px-3 py-2 text-sm text-green-600 dark:text-green-400 font-mono">
                      {ex}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 4 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-sm flex-shrink-0">4</div>
              <h2 className="text-2xl font-bold">Run SQL Migrations</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">The AI generates migration files in the <code className="text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded text-sm">migrations/</code> folder. Run them in your Supabase SQL Editor.</p>
              <div className="bg-card border border-border rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Terminal className="w-4 h-4 text-green-500" />
                  <span>Generated files structure:</span>
                </div>
                <CodeBlock code={`migrations/
  001-initial-schema.sql   ← Run first
  002-add-auth.sql         ← Run second
  003-products-table.sql   ← Run third`} lang="folder" />
                <p className="text-sm text-muted-foreground">Go to <strong className="text-foreground">Supabase → SQL Editor</strong>, paste each file, click Run.</p>
              </div>
              <CodeBlock code={`-- Example: migrations/001-todos-table.sql
CREATE TABLE public.todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.todos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own todos" ON public.todos
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own todos" ON public.todos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own todos" ON public.todos
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own todos" ON public.todos
  FOR DELETE USING (auth.uid() = user_id);`} lang="sql" />
            </div>
          </motion.div>

          {/* Step 5 */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-green-500 text-black font-bold flex items-center justify-center text-sm flex-shrink-0">5</div>
              <h2 className="text-2xl font-bold">Deploy Edge Functions</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">The AI creates edge functions in <code className="text-green-500 bg-green-500/10 px-1.5 py-0.5 rounded text-sm">supabase/functions/</code>. Deploy them with the Supabase CLI.</p>
              <CodeBlock code={`# Install Supabase CLI
npm install -g supabase

# Login to your account
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy a specific function
supabase functions deploy my-function

# Deploy all functions
supabase functions deploy`} lang="bash" />
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-xl p-4">
                <p className="text-sm text-muted-foreground">
                  📖 Full docs: <a href="https://supabase.com/docs/reference/cli" target="_blank" rel="noopener" className="text-blue-500 hover:underline">supabase.com/docs/reference/cli</a>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Usage */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-500 text-white font-bold flex items-center justify-center text-sm flex-shrink-0">
                <Code2 className="w-4 h-4" />
              </div>
              <h2 className="text-2xl font-bold">Use in Your Project</h2>
            </div>
            <div className="ml-11 space-y-4">
              <p className="text-muted-foreground">The AI generates a ready-to-use Supabase client:</p>
              <CodeBlock code={`// src/lib/supabase.ts (generated by AI)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Usage example - fetch todos
const { data: todos, error } = await supabase
  .from('todos')
  .select('*')
  .order('created_at', { ascending: false });

// Insert a new todo
const { data, error: insertErr } = await supabase
  .from('todos')
  .insert({ title: 'New task', user_id: user.id });`} lang="typescript" />
            </div>
          </motion.div>
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-20 text-center bg-card border border-border rounded-3xl p-10">
          <h3 className="text-2xl font-bold mb-3">Ready to build?</h3>
          <p className="text-muted-foreground mb-6">Go back to your project and click the Database tab to connect Supabase.</p>
          <button onClick={() => navigate(-1)} className="bg-green-500 hover:bg-green-400 text-black font-bold px-8 py-3 rounded-xl transition-colors">
            Back to Editor
          </button>
        </motion.div>
      </div>
    </div>
  );
}
