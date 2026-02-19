import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, Zap, Globe, Code2, Sparkles, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AI_GATEWAY_URL = "https://ai-gateway.vivorax.online";

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

export default function AiForAll() {
  const navigate = useNavigate();

  const examples = [
    {
      title: "Quick Chat (cURL)",
      lang: "bash",
      code: `curl -X POST ${AI_GATEWAY_URL}/api/ai/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "prompt": "Hello! Write me a haiku about code.",
    "config": {
      "stream": false,
      "temperature": 0.8,
      "max_tokens": 800
    }
  }'`,
    },
    {
      title: "JavaScript / Node.js",
      lang: "javascript",
      code: `const response = await fetch("${AI_GATEWAY_URL}/api/ai/generate", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    prompt: "Tell me a joke about programming.",
    config: {
      stream: false,
      temperature: 0.8,
      max_tokens: 800
    }
  })
});

const data = await response.json();
console.log(data.result);`,
    },
    {
      title: "Python",
      lang: "python",
      code: `import requests

response = requests.post(
    "${AI_GATEWAY_URL}/api/ai/generate",
    json={
        "prompt": "Explain quantum computing simply.",
        "config": {
            "stream": False,
            "temperature": 0.8,
            "max_tokens": 800
        }
    }
)

print(response.json()["result"])`,
    },
    {
      title: "React Chatbot Component",
      lang: "jsx",
      code: `import { useState } from 'react';

const API_URL = "${AI_GATEWAY_URL}/api/ai/generate";

export default function Chatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = { text: input, type: "user" };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt: input,
        config: {
          stream: false,
          temperature: 0.8,
          max_tokens: 800
        }
      })
    });

    const data = await res.json();
    setMessages(prev => [...prev, { text: data.result, type: "bot" }]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <div style={{ height: 400, overflow: "auto", border: "1px solid #eee", padding: 16, borderRadius: 8 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.type === "user" ? "right" : "left", margin: "8px 0" }}>
            <span style={{
              background: m.type === "user" ? "#2563eb" : "#1e293b",
              color: "white",
              padding: "8px 14px", borderRadius: 10, display: "inline-block"
            }}>
              {m.text}
            </span>
          </div>
        ))}
        {loading && <div>AI is thinking...</div>}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          placeholder="Type a message..."
          style={{ flex: 1, padding: "10px 14px", border: "1px solid #ddd", borderRadius: 8, height: 42, resize: "none" }}
        />
        <button onClick={sendMessage} style={{ background: "#22c55e", color: "white", padding: "10px 20px", border: "none", borderRadius: 8, cursor: "pointer", fontWeight: "bold" }}>
          Send
        </button>
      </div>
    </div>
  );
}`,
    },
  ];



  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back to Vivora X
          </button>
          <span className="font-bold text-sm">AI for All</span>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-2 text-sm text-primary mb-6">
            <Sparkles className="w-4 h-4" />
            Free for Developers · No API Key Required
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent leading-tight">
            AI for All
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            A <strong className="text-foreground">free, unlimited AI gateway</strong> for developers.
            No API key. No billing. No rate limits. Just build.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-sm text-green-600 dark:text-green-400">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live & Operational
            </div>
            <code className="bg-muted border border-border rounded-full px-4 py-2 text-sm text-muted-foreground font-mono">
              {AI_GATEWAY_URL}
            </code>
          </div>
        </motion.div>

        {/* Why cards */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          {[
            { icon: <Zap className="w-6 h-6 text-yellow-500" />, title: "Zero Setup", desc: "No accounts. No keys. No configuration. Just make an HTTP request and go." },
            { icon: <Globe className="w-6 h-6 text-blue-500" />, title: "Unlimited Access", desc: "No monthly quotas. No rate limits. We believe AI should be freely accessible to all developers." },
            { icon: <Code2 className="w-6 h-6 text-purple-500" />, title: "Simple API", desc: "Easy-to-use endpoint. Send a prompt and get a response. That's it." },
          ].map((item, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:bg-accent/50 transition-colors">
              <div className="mb-3">{item.icon}</div>
              <h3 className="text-lg font-bold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </motion.div>


        {/* Base URL */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mb-12">
          <h2 className="text-3xl font-bold mb-2">Base URL</h2>
          <p className="text-muted-foreground mb-6">All requests go to this single endpoint</p>
          <CodeBlock code={`${AI_GATEWAY_URL}/api/ai/generate`} lang="endpoint" />
        </motion.div>

        {/* Code Examples */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-20">
          <h2 className="text-3xl font-bold mb-2">Code Examples</h2>
          <p className="text-muted-foreground mb-8">Copy & paste — works immediately, no setup needed</p>
          <div className="space-y-8">
            {examples.map((ex, i) => (
              <div key={i}>
                <h3 className="text-lg font-semibold mb-3">{ex.title}</h3>
                <CodeBlock code={ex.code} lang={ex.lang} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Gift section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="text-center bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-3xl p-12 mb-16">
          <div className="text-5xl mb-4">🎁</div>
          <h2 className="text-3xl font-bold mb-4">Our Gift to Developers</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            We believe powerful AI tools should be accessible to <em>every</em> developer —
            from students building their first project to indie hackers shipping fast.
            This gateway is our contribution to the open web.
          </p>
          <p className="text-muted-foreground mt-4 text-sm">
            Built with ❤️ by the <strong className="text-foreground">Vivora X</strong> team
          </p>
        </motion.div>

        {/* Footer */}
        <div className="text-center text-muted-foreground text-sm">
          <p>Questions? Reach out at <span className="text-primary">support@vivorax.online</span></p>
          <button onClick={() => navigate('/')} className="mt-4 inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Vivora X
          </button>
        </div>
      </div>
    </div>
  );
}
