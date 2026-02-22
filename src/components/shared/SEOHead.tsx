import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogType?: string;
  canonical?: string;
  jsonLd?: object;
}

const SITE_NAME = 'Vivora X';
const DEFAULT_TITLE = 'Vivora X — AI-Powered Vibe Coding Platform | Build Web Apps in Seconds';
const DEFAULT_DESCRIPTION = 'Vivora X is the ultimate vibe coding platform. Transform ideas into production-ready React apps using AI. No coding required — just describe what you want and watch it build.';
const DEFAULT_IMAGE = 'https://vivorax.online/og-image.png';
const SITE_URL = 'https://vivorax.online';

export const SEOHead: React.FC<SEOHeadProps> = ({
  title,
  description = DEFAULT_DESCRIPTION,
  keywords,
  ogImage = DEFAULT_IMAGE,
  ogType = 'website',
  canonical,
  jsonLd,
}) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    setMeta('name', 'description', description);
    if (keywords) setMeta('name', 'keywords', keywords);

    // OG
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', ogType);
    setMeta('property', 'og:image', ogImage);
    setMeta('property', 'og:site_name', SITE_NAME);
    if (canonical) {
      setMeta('property', 'og:url', canonical);
      let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
      }
      link.href = canonical;
    }

    // Twitter
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', ogImage);

    // JSON-LD
    let scriptEl = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
    if (jsonLd) {
      if (!scriptEl) {
        scriptEl = document.createElement('script');
        scriptEl.id = 'seo-jsonld';
        scriptEl.type = 'application/ld+json';
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = JSON.stringify(jsonLd);
    } else if (scriptEl) {
      scriptEl.remove();
    }

    return () => {
      // Reset to defaults on unmount
      document.title = DEFAULT_TITLE;
      const scriptToRemove = document.getElementById('seo-jsonld');
      if (scriptToRemove) scriptToRemove.remove();
    };
  }, [fullTitle, description, keywords, ogImage, ogType, canonical, jsonLd]);

  return null;
};
