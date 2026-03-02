"use strict";
(function () {
  if (window.__vivorax_analyzer) return;
  window.__vivorax_analyzer = true;

  var SESSION_KEY = "vx_session";
  var STORAGE_KEY = "vx_analytics";

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

  function loadAnalytics() {
    try {
      var data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : { sessions: [], pageViews: {}, totalVisits: 0 };
    } catch (e) {
      return { sessions: [], pageViews: {}, totalVisits: 0 };
    }
  }

  function saveAnalytics(data) {
    // Keep only last 100 sessions to avoid storage overflow
    if (data.sessions.length > 100) {
      data.sessions = data.sessions.slice(-100);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  function trackPageView() {
    var session = getSession();
    var path = window.location.pathname;
    var entry = { path: path, time: Date.now() };
    session.pages.push(entry);
    saveSession(session);

    var analytics = loadAnalytics();
    analytics.pageViews[path] = (analytics.pageViews[path] || 0) + 1;
    saveAnalytics(analytics);
  }

  function trackClick(e) {
    var target = e.target;
    var tag = target.tagName;
    var text = (target.innerText || "").substring(0, 50);
    var session = getSession();
    if (!session.clicks) session.clicks = [];
    session.clicks.push({
      tag: tag,
      text: text,
      path: window.location.pathname,
      time: Date.now(),
    });
    // Keep only last 50 clicks per session
    if (session.clicks.length > 50) session.clicks = session.clicks.slice(-50);
    saveSession(session);
  }

  function finishSession() {
    var session = getSession();
    session.end = Date.now();
    session.duration = Math.round((session.end - session.start) / 1000);

    var analytics = loadAnalytics();
    analytics.totalVisits = (analytics.totalVisits || 0) + 1;
    analytics.sessions.push({
      id: session.id,
      start: session.start,
      end: session.end,
      duration: session.duration,
      pages: session.pages.length,
      device: session.device,
      country: session.country,
      referrer: session.referrer,
      topPages: session.pages.map(function (p) { return p.path; }),
    });
    saveAnalytics(analytics);
  }

  // Track initial page view
  trackPageView();

  // Track navigation changes (SPA)
  var lastPath = window.location.pathname;
  setInterval(function () {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      trackPageView();
    }
  }, 500);

  // Track clicks
  document.addEventListener("click", trackClick, true);

  // Save session on leave
  window.addEventListener("beforeunload", finishSession);

  // Expose read API for the analytics panel
  window.__vivorax_getAnalytics = function () {
    return loadAnalytics();
  };
})();
