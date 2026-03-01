(function () {
  if (document.getElementById("vivorax-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a href="https://www.vivorax.online" target="_blank" rel="noopener noreferrer" class="vx-link">
      <img src="https://Vivorax.online/vivora-logo.png" alt="Vivora X" class="vx-logo-img" />
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
    #vivorax-branding {
      position: fixed; bottom: 20px; left: 20px; z-index: 999999;
      display: flex; align-items: center; gap: 0;
      background: linear-gradient(145deg, rgba(8,8,14,0.97), rgba(18,12,30,0.97));
      backdrop-filter: blur(30px) saturate(2);
      -webkit-backdrop-filter: blur(30px) saturate(2);
      padding: 0; border-radius: 60px;
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
      color: #fff;
      border: 1px solid rgba(255,255,255,0.06);
      box-shadow:
        0 0 0 0.5px rgba(139,92,246,0.15),
        0 2px 8px rgba(0,0,0,0.4),
        0 8px 32px rgba(139,92,246,0.08),
        0 0 80px -20px rgba(236,72,153,0.06);
      animation: vx-entrance .7s cubic-bezier(.22,1,.36,1) forwards;
      transform: translateY(60px) scale(0.85); opacity: 0;
      user-select: none;
      overflow: hidden;
      transition: all .35s cubic-bezier(.4,0,.2,1);
    }
    #vivorax-branding.vx-hidden {
      transform: translateY(60px) scale(0.7) !important;
      opacity: 0 !important;
      pointer-events: none;
    }
    @keyframes vx-entrance {
      0% { transform: translateY(60px) scale(0.85); opacity: 0; }
      60% { transform: translateY(-4px) scale(1.02); opacity: 1; }
      100% { transform: translateY(0) scale(1); opacity: 1; }
    }
    #vivorax-branding .vx-link {
      display: flex; align-items: center; gap: 10px;
      color: #fff; text-decoration: none;
      padding: 7px 4px 7px 8px;
      transition: all .3s ease;
    }
    #vivorax-branding .vx-logo-img {
      width: 28px; height: 28px; flex-shrink: 0;
      border-radius: 8px;
      object-fit: contain;
      filter: drop-shadow(0 0 10px rgba(139,92,246,0.5));
      transition: transform .4s cubic-bezier(.34,1.56,.64,1), filter .3s ease;
    }
    #vivorax-branding:hover .vx-logo-img {
      transform: scale(1.15) rotate(-8deg);
      filter: drop-shadow(0 0 18px rgba(139,92,246,0.8));
    }
    #vivorax-branding .vx-text-wrap {
      display: flex; flex-direction: column; gap: 0;
      line-height: 1.15;
    }
    #vivorax-branding .vx-text {
      color: rgba(255,255,255,0.4);
      font-size: 10px;
      font-weight: 500;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    #vivorax-branding .vx-brand {
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.01em;
      background: linear-gradient(135deg, #c084fc 0%, #ec4899 40%, #f472b6 70%, #a78bfa 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text;
      background-size: 300% 300%;
      animation: vx-shimmer 4s ease infinite;
    }
    @keyframes vx-shimmer {
      0%,100% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
    }
    #vivorax-branding .vx-close {
      display: flex; align-items: center; justify-content: center;
      width: 30px; height: 30px;
      background: none; border: none;
      color: rgba(255,255,255,0.15);
      cursor: pointer;
      border-left: 1px solid rgba(255,255,255,0.04);
      margin-right: 5px;
      border-radius: 0 60px 60px 0;
      transition: color .2s ease, background .2s ease;
      flex-shrink: 0;
    }
    #vivorax-branding .vx-close:hover {
      color: rgba(255,255,255,0.6);
      background: rgba(255,255,255,0.06);
    }
    #vivorax-branding:hover {
      border-color: rgba(139,92,246,0.2);
      box-shadow:
        0 0 0 0.5px rgba(139,92,246,0.3),
        0 2px 8px rgba(0,0,0,0.4),
        0 12px 40px rgba(139,92,246,0.15),
        0 0 100px -20px rgba(236,72,153,0.1);
      transform: translateY(-3px) scale(1.03);
    }
    @media (max-width: 480px) {
      #vivorax-branding {
        bottom: 14px; left: 14px;
      }
      #vivorax-branding .vx-brand { font-size: 12px; }
      #vivorax-branding .vx-text { font-size: 9px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);
})();
