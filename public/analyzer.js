"use strict";
(function () {
  if (window.__vivorax_analyzer) return;
  window.__vivorax_analyzer = true;

  var SESSION_KEY = "vx_session";
  var FLUSH_KEY = "vx_flush_queue";

  // Read project config injected by the editor/preview
  var PROJECT_ID = window.__vivorax_project_id || null;
  var API_BASE = window.__vivorax_api_base || null;

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  function getSession() {
    var s = sessionStorage.getItem(SESSION_KEY);
    if (s) return JSON.parse(s);
    var session = {
      id: uuid(),
      start: Date.now(),
      pages: [],
      device: /Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop",
      country: Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown",
      referrer: document.referrer || "direct",
      screenW: screen.width,
      screenH: screen.height,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function saveSession(session) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function queueEvent(event) {
    try {
      var queue = JSON.parse(localStorage.getItem(FLUSH_KEY) || "[]");
      queue.push(event);
      // Keep max 200 queued events
      if (queue.length > 200) queue = queue.slice(-200);
      localStorage.setItem(FLUSH_KEY, JSON.stringify(queue));
    } catch (e) { /* ignore */ }
  }

  function flushEvents() {
    if (!PROJECT_ID || !API_BASE) return;
    var raw = localStorage.getItem(FLUSH_KEY);
    if (!raw) return;
    var events;
    try { events = JSON.parse(raw); } catch (e) { return; }
    if (!events || events.length === 0) return;

    // Clear immediately to prevent double-sends
    localStorage.removeItem(FLUSH_KEY);

    var url = API_BASE + "/functions/v1/track-analytics";
    var payload = JSON.stringify({ project_id: PROJECT_ID, events: events });

    // Use sendBeacon if available (works on page unload), else fetch
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    } else {
      fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(function () {
        // Re-queue on failure
        try {
          var existing = JSON.parse(localStorage.getItem(FLUSH_KEY) || "[]");
          localStorage.setItem(FLUSH_KEY, JSON.stringify(existing.concat(events)));
        } catch (e) { /* ignore */ }
      });
    }
  }

  function trackPageView() {
    var session = getSession();
    var path = window.location.pathname;
    session.pages.push({ path: path, time: Date.now() });
    saveSession(session);

    queueEvent({
      session_id: session.id,
      event_type: "pageview",
      path: path,
      device: session.device,
      referrer: session.referrer,
      country: session.country,
      screen_w: session.screenW,
      screen_h: session.screenH,
    });
  }

  function finishSession() {
    var session = getSession();
    var duration = Math.round((Date.now() - session.start) / 1000);

    queueEvent({
      session_id: session.id,
      event_type: "session_end",
      path: session.pages.length > 0 ? session.pages[session.pages.length - 1].path : "/",
      device: session.device,
      referrer: session.referrer,
      country: session.country,
      screen_w: session.screenW,
      screen_h: session.screenH,
      duration: duration,
      pages_count: session.pages.length,
    });

    flushEvents();
  }

  // Track initial page view
  trackPageView();

  // Track SPA navigation changes
  var lastPath = window.location.pathname;
  setInterval(function () {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  }, 500);

  // Flush every 30 seconds
  setInterval(flushEvents, 30000);

  // Save session + flush on leave
  window.addEventListener("beforeunload", finishSession);

  // Expose for the analytics panel (fallback)
  window.__vivorax_getAnalytics = function () {
    return { sessions: [], pageViews: {}, totalVisits: 0 };
  };
})();

