(function () {
  if (document.getElementById("vivorax-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a href="https://www.vivorax.online" target="_blank" rel="noopener noreferrer" class="vx-link">
      <svg class="vx-logo" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="28" height="28" rx="7" fill="url(#vx-grad)"/>
        <path d="M8 9l4.5 10h3L20 9" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <defs><linearGradient id="vx-grad" x1="0" y1="0" x2="28" y2="28"><stop stop-color="#8b5cf6"/><stop offset="1" stop-color="#ec4899"/></linearGradient></defs>
      </svg>
      <span class="vx-text">Built with <strong>Vivora X</strong></span>
    </a>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #vivorax-branding {
      position: fixed; bottom: 16px; left: 16px; z-index: 999999;
      display: flex; align-items: center; gap: 6px;
      background: rgba(10,10,10,0.88); backdrop-filter: blur(20px) saturate(1.6);
      padding: 7px 14px 7px 10px; border-radius: 40px;
      font: 12px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff; border: 1px solid rgba(255,255,255,0.06);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 0 0 0.5px rgba(255,255,255,0.05) inset;
      animation: vx-in .5s cubic-bezier(.16,1,.3,1) forwards;
      transform: translateY(40px); opacity: 0;
      user-select: none;
    }
    @keyframes vx-in { to { transform: translateY(0); opacity: 1; } }
    #vivorax-branding .vx-link {
      display: flex; align-items: center; gap: 8px;
      color: #fff; text-decoration: none;
    }
    #vivorax-branding .vx-logo { width: 22px; height: 22px; flex-shrink: 0; }
    #vivorax-branding .vx-text { color: rgba(255,255,255,.55); font-weight: 400; letter-spacing: 0.01em; }
    #vivorax-branding .vx-text strong {
      background: linear-gradient(135deg, #a78bfa, #ec4899);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; font-weight: 700;
    }
    #vivorax-branding:hover { border-color: rgba(139,92,246,0.3); box-shadow: 0 8px 32px rgba(139,92,246,0.15), 0 0 0 0.5px rgba(255,255,255,0.08) inset; }
    @media (max-width: 480px) {
      #vivorax-branding { bottom: 12px; left: 12px; right: auto; font-size: 11px; padding: 6px 12px 6px 8px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);
})();
