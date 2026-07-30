# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Arabic-first creators, freelancers, and teams who need to turn a product brief into a working web project without manually assembling a frontend and backend.

## Product Purpose

Vivora X is a full-stack AI workspace for creating and iterating on professional browser-native websites. Success is a clear workflow that reliably produces editable, professional files.

## Positioning

Vivora X uses one controlled code-generation route powered by OpenRouter with Qwen3.7 Flash, backed by its private Node server.

## Operating Context

Users create projects from a written brief, inspect generated files and versions, and continue changes in the editor. Administrators manage platform data and initiate recoverable database backups. The application is deployed as a Node.js application on cPanel.

## Capabilities and Constraints

- A separate `server` Node application owns authentication, projects, chats, versions, backups, and generation requests.
- SQLite is local to the server and is never exposed directly to the browser.
- Generated websites are frontend-only and never receive database or backend instructions.
- Sending a home-page prompt creates a durable project immediately; generated files, chat messages, and restorable versions are then saved to that project.
- Music playlists, playback preferences, and player position are stored only in the current browser through `localStorage`.
- The editor preview injects first-party analytics events through the private server without requiring publication.
- Generation is restricted to OpenRouter / Qwen3.7 Flash.
- Hourly, daily, and weekly database backups are required alongside an administrator-triggered backup.
- Legacy generation providers are removed from the product path.

## Brand Commitments

- Product name: Vivora X (VivoraX).
- The original animated pink-and-white Vivora X mark and wordmark are the binding identity across the product.
- The product interface is dark-only; wallpapers and editor accents stay within the Vivora X cosmic pink identity.
- The first product experience must feel professional, clear, and suitable for serious website production.

## Evidence on Hand

- Existing React/Vite application in this repository.
- The original Vivora X favicon is available at `public/vivora-logo.png`.

## Product Principles

- Keep customer data private and recoverable.
- Make the generation workflow legible, not magical.
- Prefer one dependable model path over a confusing provider picker.
- Treat generated projects as editable software, not disposable previews.
