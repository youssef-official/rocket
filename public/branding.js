"use strict";
(function () {
  // Don't show branding inside iframes (preview mode)
  if (window !== window.top) return;
  if (document.getElementById("vivorax-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a href="https://www.vivorax.online" target="_blank" rel="noopener noreferrer" class="vx-link">
      <img src="https://www.vivorax.online/vivora-logo.png" alt="Vivora X" class="vx-logo-img" />
      <div class="vx-text-wrap">
        <span class="vx-text">Built with</span>
        <span class="vx-brand">Vivora X</span>
      </div>
    </a>
    <button class="vx-close" aria-label="Close" onclick="document.getElementById('vivorax-branding').classList.add('vx-hidden')">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  const style = document.createElement("style");
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;800&display=swap');
    #vivorax-branding {
      position: fixed; bottom: 16px; right: 16px; z-index: 2147483647;
      display: flex; align-items: center; gap: 0;
      background: rgba(255,255,255,0.95);
      backdrop-filter: blur(20px) saturate(1.8);
      -webkit-backdrop-filter: blur(20px) saturate(1.8);
      padding: 0; border-radius: 50px;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      color: #1a1a1a;
      border: 1px solid rgba(0,0,0,0.08);
      box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06);
      animation: vx-entrance .5s cubic-bezier(.22,1,.36,1) forwards;
      transform: translateY(40px) scale(0.9); opacity: 0;
      user-select: none;
      overflow: hidden;
      transition: all .25s cubic-bezier(.4,0,.2,1);
    }
    @media (prefers-color-scheme: dark) {
      #vivorax-branding {
        background: rgba(18,18,22,0.95);
        color: #f0f0f0;
        border: 1px solid rgba(255,255,255,0.08);
        box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2);
      }
      #vivorax-branding .vx-text { color: rgba(255,255,255,0.45); }
      #vivorax-branding .vx-close { color: rgba(255,255,255,0.2); border-left-color: rgba(255,255,255,0.06); }
      #vivorax-branding .vx-close:hover { color: rgba(255,255,255,0.6); background: rgba(255,255,255,0.06); }
      #vivorax-branding:hover { border-color: rgba(139,92,246,0.3); box-shadow: 0 1px 3px rgba(0,0,0,0.3), 0 8px 24px rgba(139,92,246,0.12); }
    }
    #vivorax-branding.vx-hidden {
      transform: translateY(40px) scale(0.8) !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    @keyframes vx-entrance {
      0% { transform: translateY(40px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    #vivorax-branding .vx-link {
      display: flex; align-items: center; gap: 8px;
      color: inherit; text-decoration: none;
      padding: 6px 4px 6px 8px;
      transition: all .2s ease;
      cursor: pointer;
    }
    #vivorax-branding .vx-logo-img {
      width: 24px; height: 24px; flex-shrink: 0;
      border-radius: 6px;
      object-fit: contain;
      transition: transform .3s cubic-bezier(.34,1.56,.64,1);
    }
    #vivorax-branding:hover .vx-logo-img {
      transform: scale(1.1) rotate(-5deg);
    }
    #vivorax-branding .vx-text-wrap {
      display: flex; flex-direction: column; gap: 0;
      line-height: 1.15;
    }
    #vivorax-branding .vx-text {
      color: rgba(0,0,0,0.4);
      font-size: 9px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    #vivorax-branding .vx-brand {
      font-size: 13px;
      font-weight: 800;
      letter-spacing: -0.01em;
      background: linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #a78bfa 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 200% 200%;
      animation: vx-shimmer 3s ease infinite;
    }
    @keyframes vx-shimmer {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    #vivorax-branding .vx-close {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: none; border: none;
      color: rgba(0,0,0,0.15);
      cursor: pointer;
      border-left: 1px solid rgba(0,0,0,0.06);
      margin-right: 4px;
      border-radius: 0 50px 50px 0;
      transition: color .2s ease, background .2s ease;
      flex-shrink: 0;
    }
    #vivorax-branding .vx-close:hover {
      color: rgba(0,0,0,0.5);
      background: rgba(0,0,0,0.04);
    }
    #vivorax-branding:hover {
      transform: translateY(-2px) scale(1.02);
      box-shadow: 0 2px 6px rgba(0,0,0,0.1), 0 8px 24px rgba(139,92,246,0.1);
    }
    @media (max-width: 480px) {
      #vivorax-branding { bottom: 12px; right: 12px; }
      #vivorax-branding .vx-brand { font-size: 12px; }
      #vivorax-branding .vx-text { font-size: 8px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);
})();
