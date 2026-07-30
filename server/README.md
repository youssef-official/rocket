# Webo server

This is the only backend for Webo. It owns the local SQLite database, authentication, projects, versions, AI generation, and backups.

## cPanel Node.js deployment

1. Create a Node.js application (Node 20+) pointing to this `server` directory.
2. Run `npm install --omit=dev` in this directory.
3. Copy `.env.example` to `.env`, set every value, and use a long random `JWT_SECRET`.
4. Set the application startup file to `src/index.js` and restart it.
5. Point the frontend's `VITE_API_URL` to `https://egyhost1.com/server/api`.

`DATA_DIR` must be outside any public web directory. The server creates `webo.sqlite` and timestamped database backups there. Backups run hourly, daily, and weekly; the admin API can create one on demand.
