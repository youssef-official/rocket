# Vivora Local

A local-first, open-source AI chat playground. **Bring Your Own API Key** — your keys never leave your browser.

## Features

- 🔒 100% local: all projects, messages, and API keys stored in `localStorage`
- 🤖 Multi-provider: OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Mistral, DeepSeek, Together, Ollama, or any OpenAI-compatible endpoint
- ⚙️ Add custom models from the Settings modal
- 🎯 Pick the model per chat from the input box
- 🚫 No backend, no database, no auth, no analytics

## Run locally

```bash
npm install
npm run dev
```

Then open the app, click the user menu → **Settings**, choose your provider, paste an API key, hit **Test**, and start chatting.

## Stack

React 18 · Vite 5 · TypeScript · Tailwind · shadcn/ui · React Router

## License

MIT
