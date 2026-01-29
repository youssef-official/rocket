(function () {
  if (document.getElementById("youssef-branding")) return;

  const link = document.createElement("a");

  link.id = "youssef-branding";
  link.href = "https://youssef.ymoo.site";
  link.target = "_blank";

  link.innerHTML = `
    <img src="https://youssef.ymoo.site/assets/rocket-logo-Dtwvl5Ty.png" />
    <span>Built with Youssef</span>
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

      padding: 6px 10px;
      border-radius: 999px;

      font-family: Arial, sans-serif;
      font-size: 12px;
      color: white;

      text-decoration: none;

      box-shadow: 0 4px 12px rgba(0,0,0,0.3);

      transition: all .2s ease;
    }

    #youssef-branding:hover {
      transform: scale(1.05);
      background: rgba(0,0,0,0.9);
    }

    #youssef-branding img {
      width: 18px;
      height: 18px;
      border-radius: 50%;
    }
  `;

  document.head.appendChild(style);
  document.body.appendChild(link);
})();
