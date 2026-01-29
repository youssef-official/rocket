(function () {
  if (document.getElementById("youssef-branding")) return;

  const wrapper = document.createElement("div");
  wrapper.id = "youssef-branding";

  wrapper.innerHTML = `
    <a
      href="https://youssef.ymoo.site"
      target="_blank"
      class="y-link"
    >
      <img src="https://youssef.ymoo.site/assets/rocket-logo-Dtwvl5Ty.png" />
      <span>Built with Youssef</span>
    </a>

    <button class="y-close">×</button>
  `;

  const style = document.createElement("style");

  style.innerHTML = `
    #youssef-branding {
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 999999;

      display: flex;
      align-items: center;
      gap: 6px;

      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(6px);

      padding: 6px 8px 6px 10px;
      border-radius: 999px;

      font-family: Arial, sans-serif;
      font-size: 12px;
      color: white;

      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }

    #youssef-branding .y-link {
      display: flex;
      align-items: center;
      gap: 6px;

      color: white;
      text-decoration: none;
    }

    #youssef-branding img {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }

    #youssef-branding .y-close {
      background: transparent;
      border: none;

      color: #ccc;
      font-size: 16px;
      cursor: pointer;

      padding: 0 4px;
      margin-left: 2px;

      transition: .2s;
    }

    #youssef-branding .y-close:hover {
      color: white;
      transform: scale(1.2);
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(wrapper);

  // Close button
  wrapper.querySelector(".y-close").onclick = () => {
    wrapper.remove();
  };
})();
