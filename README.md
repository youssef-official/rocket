# Vivora X

Vivora X is an Arabic-first AI workspace that generates and edits browser-native websites.

## Generated project contract

Every generated website contains exactly:

- `index.html`
- `styles.css`
- `script.js`

Generated projects do not use React, JSX, TypeScript, Vite, package managers, or frontend frameworks. The editor renders the three files directly in an isolated browser preview, so previews do not require Modal, containers, dependency installation, or a build server.

Project names are assigned by the private Node server with cryptographically secure randomness. The AI never receives a project-naming request.

## Generation flow

1. The model returns a short implementation plan that names the files and operations it will perform.
2. The UI reports whether it is analyzing an attached image, reading an existing file, or writing a file.
3. The model streams complete `<FILE>` blocks for the allowed files.
4. Vivora X validates the browser-native runtime contract and refreshes the browser preview.

## Local development

```bash
npm install
npm run dev
```

Run the private API separately:

```bash
cd server
npm install
npm run dev
```

The server owns authentication, SQLite data, backups, project creation, and the OpenRouter generation request. Production builds use `VITE_API_URL=https://egyhost1.com/server`; the frontend appends `/api` to that cPanel application base automatically.
