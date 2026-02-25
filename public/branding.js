(function () {
  if (document.getElementById("vivorax-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a href="https://www.vivorax.online" target="_blank" rel="noopener noreferrer" class="vx-link">
      <img src="/vivora-logo.png" alt="Vivora X" class="vx-logo-img" />
      <span class="vx-text">Built with <strong>Vivora X</strong></span>
    </a>
    <button class="vx-close" aria-label="Close" onclick="document.getElementById('vivorax-branding').classList.add('vx-hidden')">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M1 1l8 8M9 1l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #vivorax-branding {
      position: fixed; bottom: 18px; left: 18px; z-index: 999999;
      display: flex; align-items: center; gap: 0;
      background: linear-gradient(135deg, rgba(15,15,20,0.95), rgba(25,20,35,0.95));
      backdrop-filter: blur(24px) saturate(1.8);
      padding: 0; border-radius: 50px;
      font: 12.5px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow:
        0 0 0 1px rgba(236,72,153,0.1),
        0 4px 16px rgba(0,0,0,0.5),
        0 8px 40px rgba(139,92,246,0.12),
        0 0 60px rgba(236,72,153,0.06);
      animation: vx-slideIn .6s cubic-bezier(.16,1,.3,1) forwards;
      transform: translateY(50px) scale(0.9); opacity: 0;
      user-select: none;
      overflow: hidden;
      transition: all .3s cubic-bezier(.4,0,.2,1);
    }
    #vivorax-branding.vx-hidden {
      transform: translateY(50px) scale(0.8) !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    @keyframes vx-slideIn {
      0% { transform: translateY(50px) scale(0.9); opacity: 0; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    #vivorax-branding .vx-link {
      display: flex; align-items: center; gap: 10px;
      color: #fff; text-decoration: none;
      padding: 8px 6px 8px 10px;
      transition: all .25s ease;
    }
    #vivorax-branding .vx-logo-img {
      width: 26px; height: 26px; flex-shrink: 0;
      border-radius: 6px;
      object-fit: contain;
      filter: drop-shadow(0 0 8px rgba(236,72,153,0.4));
      transition: transform .3s ease, filter .3s ease;
    }
    #vivorax-branding:hover .vx-logo-img {
      transform: scale(1.1) rotate(-5deg);
      filter: drop-shadow(0 0 14px rgba(236,72,153,0.7));
    }
    #vivorax-branding .vx-text {
      color: rgba(255,255,255,.5);
      font-weight: 400;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }
    #vivorax-branding .vx-text strong {
      background: linear-gradient(135deg, #a78bfa 0%, #ec4899 50%, #f472b6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; font-weight: 700;
      background-size: 200% 200%;
      animation: vx-gradient 3s ease infinite;
    }
    @keyframes vx-gradient {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    #vivorax-branding .vx-close {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px;
      background: none; border: none;
      color: rgba(255,255,255,0.25);
      cursor: pointer;
      border-left: 1px solid rgba(255,255,255,0.06);
      margin-right: 4px;
      border-radius: 0 50px 50px 0;
      transition: color .2s ease, background .2s ease;
      flex-shrink: 0;
    }
    #vivorax-branding .vx-close:hover {
      color: rgba(255,255,255,0.7);
      background: rgba(255,255,255,0.05);
    }
    #vivorax-branding:hover {
      border-color: rgba(139,92,246,0.25);
      box-shadow:
        0 0 0 1px rgba(236,72,153,0.2),
        0 4px 16px rgba(0,0,0,0.5),
        0 8px 40px rgba(139,92,246,0.2),
        0 0 80px rgba(236,72,153,0.1);
      transform: translateY(-2px) scale(1.02);
    }
    @media (max-width: 480px) {
      #vivorax-branding {
        bottom: 12px; left: 12px;
        font-size: 11px;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);
})();
