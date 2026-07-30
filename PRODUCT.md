# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Arabic-first creators, freelancers, and teams who need to turn a product brief into a working web project without manually assembling a frontend and backend.

## Product Purpose

Webo is a full-stack AI workspace for creating, iterating on, and keeping web projects. Success is a clear project workflow that reliably produces editable, professional project files.

## Positioning

Webo uses one controlled code-generation route, powered only by OpenRouter with Qwen3.7 Flash, and stores the platform's data in a private local SQLite database deployed with its own Node server.

## Operating Context

Users create projects from a written brief, inspect generated files and versions, and continue changes in the editor. Administrators manage platform data and initiate recoverable database backups. The application is deployed as a Node.js application on cPanel.

## Capabilities and Constraints

- A separate `server` Node application owns authentication, projects, chats, versions, backups, and generation requests.
- SQLite is local to the server and is never exposed directly to the browser.
- Generated websites are frontend-only and never receive database or backend instructions.
- The editor preview injects first-party analytics events through the private server without requiring publication.
- Generation is restricted to OpenRouter / Qwen3.7 Flash.
- Hourly, daily, and weekly database backups are required alongside an administrator-triggered backup.
- Legacy generation providers are removed from the product path.

## Brand Commitments

- Product name: Webo.
- The supplied logo is a binding asset; it must replace the previous Vivora identity when its file is available.
- The first product experience must feel professional, clear, and suitable for serious website production.

## Evidence on Hand

- Existing React/Vite application in this repository.
- The supplied logo URL requires a ChatGPT-authenticated download and is not available as a local project asset yet.

## Product Principles

- Keep customer data private and recoverable.
- Make the generation workflow legible, not magical.
- Prefer one dependable model path over a confusing provider picker.
- Treat generated projects as editable software, not disposable previews.
