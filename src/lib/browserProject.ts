const BROWSER_FILE_EXTENSIONS = new Set(['html', 'css', 'js', 'json', 'svg', 'txt', 'md']);

export const normalizeBrowserProjectPath = (rawPath: string) =>
  String(rawPath || '').trim().replace(/\\/g, '/').replace(/^\/+/, '').replace(/\/+/g, '/');

export const isBrowserProjectFile = (rawPath: string) => {
  const path = normalizeBrowserProjectPath(rawPath);
  if (!path || path.length > 240 || path.startsWith('.') || path.endsWith('/')) return false;
  const segments = path.split('/');
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) return false;
  const extension = path.split('.').pop()?.toLowerCase() || '';
  return BROWSER_FILE_EXTENSIONS.has(extension);
};

export const browserFileLanguage = (rawPath: string) => {
  const extension = normalizeBrowserProjectPath(rawPath).split('.').pop()?.toLowerCase();
  return ({
    js: 'javascript',
    css: 'css',
    html: 'html',
    json: 'json',
    svg: 'xml',
    md: 'markdown',
    txt: 'text',
  } as Record<string, string>)[extension || ''] || 'text';
};

export const isHtmlProjectFile = (rawPath: string) =>
  isBrowserProjectFile(rawPath) && normalizeBrowserProjectPath(rawPath).toLowerCase().endsWith('.html');
