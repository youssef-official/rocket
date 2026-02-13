(function () {
  if (document.getElementById("vivorax-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a href="https://www.vivorax.online" target="_blank" rel="noopener noreferrer" class="vx-link">
      <img src="https://www.vivorax.online/favicon.svg" alt="Vivora X" class="vx-icon" onerror="this.style.display='none'" />
      <span class="vx-text">Built with <strong>Vivora X</strong></span>
    </a>
    <button class="vx-close" aria-label="Close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
  `;

  const style = document.createElement("style");
  style.textContent = `
    #vivorax-branding {
      position: fixed; bottom: 16px; right: 16px; z-index: 999999;
      display: flex; align-items: center; gap: 6px;
      background: rgba(10,10,10,0.92); backdrop-filter: blur(16px);
      padding: 8px 14px; border-radius: 40px;
      font: 13px/1 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #fff; border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 4px 24px rgba(0,0,0,0.5);
      animation: vx-in .4s cubic-bezier(.16,1,.3,1) forwards;
      transform: translateY(60px); opacity: 0;
    }
    @keyframes vx-in { to { transform: translateY(0); opacity: 1; } }
    #vivorax-branding .vx-link {
      display: flex; align-items: center; gap: 8px;
      color: #fff; text-decoration: none;
    }
    #vivorax-branding .vx-icon { width: 20px; height: 20px; border-radius: 4px; }
    #vivorax-branding .vx-text { color: rgba(255,255,255,.7); font-weight: 400; }
    #vivorax-branding .vx-text strong {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      background-clip: text; font-weight: 700;
    }
    #vivorax-branding .vx-close {
      display: flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; background: rgba(255,255,255,.1);
      border: none; border-radius: 50%; color: rgba(255,255,255,.4);
      cursor: pointer; padding: 0; margin-left: 2px;
    }
    #vivorax-branding .vx-close svg { width: 10px; height: 10px; }
    #vivorax-branding .vx-close:hover { background: rgba(255,255,255,.2); color: #fff; }
    #vivorax-branding.vx-out { animation: vx-out .25s ease forwards; }
    @keyframes vx-out { to { transform: translateY(60px); opacity: 0; } }
    @media (max-width: 480px) {
      #vivorax-branding { bottom: 12px; right: 12px; left: 12px; justify-content: center; font-size: 12px; }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);
  wrapper.querySelector(".vx-close").onclick = () => {
    wrapper.classList.add("vx-out");
    setTimeout(() => wrapper.remove(), 250);
  };
})();
