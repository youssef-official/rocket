(function () {
  // Prevent duplicate injection
  if (document.getElementById("vivorax-branding")) return;

  // Create wrapper element
  const wrapper = document.createElement("div");
  wrapper.id = "vivorax-branding";

  wrapper.innerHTML = `
    <a
      href="https://www.vivorax.online"
      target="_blank"
      rel="noopener noreferrer"
      class="vx-link"
    >
      <div class="vx-logo">
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#grad1)" />
          <path d="M2 17L12 22L22 17" stroke="url(#grad2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="url(#grad2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <defs>
            <linearGradient id="grad1" x1="2" y1="2" x2="22" y2="12" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ec4899"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
            <linearGradient id="grad2" x1="2" y1="12" x2="22" y2="22" gradientUnits="userSpaceOnUse">
              <stop stop-color="#ec4899"/>
              <stop offset="1" stop-color="#8b5cf6"/>
            </linearGradient>
          </defs>
        </svg>
      </div>
      <span class="vx-text">Built with <strong>Vivora X</strong></span>
      <div class="vx-sparkle">✨</div>
    </a>

    <button class="vx-close" aria-label="Close branding">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;

  // Create styles
  const style = document.createElement("style");
  style.innerHTML = `
    #vivorax-branding {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;
      
      display: flex;
      align-items: center;
      gap: 8px;
      
      background: linear-gradient(135deg, rgba(17, 17, 17, 0.95) 0%, rgba(38, 38, 38, 0.95) 100%);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      
      padding: 10px 14px;
      border-radius: 50px;
      
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      color: white;
      
      border: 1px solid rgba(255, 255, 255, 0.1);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 0 1px rgba(255, 255, 255, 0.05),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
      
      animation: vx-slideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transform: translateY(100px);
      opacity: 0;
    }
    
    @keyframes vx-slideIn {
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    
    #vivorax-branding:hover {
      border-color: rgba(236, 72, 153, 0.3);
      box-shadow: 
        0 8px 32px rgba(0, 0, 0, 0.4),
        0 0 20px rgba(236, 72, 153, 0.2),
        inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    #vivorax-branding .vx-link {
      display: flex;
      align-items: center;
      gap: 10px;
      color: white;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    #vivorax-branding .vx-link:hover {
      opacity: 0.9;
    }
    
    #vivorax-branding .vx-logo {
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: vx-pulse 2s ease-in-out infinite;
    }
    
    #vivorax-branding .vx-logo svg {
      width: 100%;
      height: 100%;
    }
    
    @keyframes vx-pulse {
      0%, 100% {
        transform: scale(1);
        filter: drop-shadow(0 0 4px rgba(236, 72, 153, 0.4));
      }
      50% {
        transform: scale(1.05);
        filter: drop-shadow(0 0 8px rgba(236, 72, 153, 0.6));
      }
    }
    
    #vivorax-branding .vx-text {
      color: rgba(255, 255, 255, 0.8);
      font-weight: 400;
      letter-spacing: 0.01em;
    }
    
    #vivorax-branding .vx-text strong {
      background: linear-gradient(135deg, #ec4899, #8b5cf6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      font-weight: 700;
    }
    
    #vivorax-branding .vx-sparkle {
      font-size: 14px;
      animation: vx-sparkle 1.5s ease-in-out infinite;
    }
    
    @keyframes vx-sparkle {
      0%, 100% {
        opacity: 0.5;
        transform: scale(1) rotate(0deg);
      }
      50% {
        opacity: 1;
        transform: scale(1.2) rotate(15deg);
      }
    }
    
    #vivorax-branding .vx-close {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 20px;
      height: 20px;
      background: rgba(255, 255, 255, 0.1);
      border: none;
      border-radius: 50%;
      color: rgba(255, 255, 255, 0.5);
      cursor: pointer;
      padding: 0;
      margin-left: 4px;
      transition: all 0.2s ease;
    }
    
    #vivorax-branding .vx-close svg {
      width: 12px;
      height: 12px;
    }
    
    #vivorax-branding .vx-close:hover {
      background: rgba(255, 255, 255, 0.2);
      color: white;
      transform: scale(1.1);
    }
    
    /* Mobile responsive */
    @media (max-width: 480px) {
      #vivorax-branding {
        bottom: 12px;
        right: 12px;
        left: 12px;
        justify-content: center;
        padding: 12px 16px;
        font-size: 12px;
      }
      
      #vivorax-branding .vx-sparkle {
        display: none;
      }
    }
    
    /* Fade out animation */
    #vivorax-branding.vx-closing {
      animation: vx-slideOut 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    
    @keyframes vx-slideOut {
      to {
        transform: translateY(100px);
        opacity: 0;
      }
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  // Close button functionality
  wrapper.querySelector(".vx-close").onclick = () => {
    wrapper.classList.add("vx-closing");
    setTimeout(() => wrapper.remove(), 300);
  };
})();
