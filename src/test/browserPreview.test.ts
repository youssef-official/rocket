import { describe, expect, it } from 'vitest';
import { buildBrowserDocument, findJavaScriptSyntaxError } from '@/components/editor/PreviewView';
import { parseAIResponse } from '@/services/aiService';
import type { ProjectFile } from '@/types';

const file = (path: string, content: string): ProjectFile => ({
  name: path,
  path,
  content,
  language: path.split('.').pop() || 'text',
});

describe('browser-native preview', () => {
  it('inlines linked browser files without a build server', () => {
    const documentText = buildBrowserDocument({
      'index.html': file('index.html', '<!doctype html><html><head><link rel="stylesheet" href="./styles.css"></head><body><button id="hello">Hello</button><script src="./script.js" defer></script></body></html>'),
      'styles.css': file('styles.css', 'button { color: tomato; }'),
      'script.js': file('script.js', 'document.querySelector("#hello").dataset.ready = "true";'),
    });

    expect(documentText).toContain('<style data-webo-source="styles.css">button { color: tomato; }</style>');
    expect(documentText).toContain('<script data-webo-source="script.js">document.querySelector("#hello").dataset.ready = "true";');
    expect(documentText).toContain('//# sourceURL=webo-preview://script.js');
    expect(documentText).not.toContain('href="./styles.css"');
    expect(documentText).not.toContain('src="./script.js"');
  });

  it('renders nested pages and resolves their shared assets and page links', () => {
    const documentText = buildBrowserDocument({
      'index.html': file('index.html', '<a href="./pages/about.html">About</a>'),
      'pages/about.html': file('pages/about.html', '<html><head><link rel="stylesheet" href="../assets/site.css"></head><body><a href="../index.html">Home</a><script src="../assets/site.js"></script></body></html>'),
      'assets/site.css': file('assets/site.css', 'body { color: navy; }'),
      'assets/site.js': file('assets/site.js', 'document.body.dataset.page = "about";'),
    }, '', 'pages/about.html');

    expect(documentText).toContain('data-webo-source="assets/site.css"');
    expect(documentText).toContain('body { color: navy; }');
    expect(documentText).toContain('data-webo-source="assets/site.js"');
    expect(documentText).toContain('data-webo-page="index.html"');
  });

  it('accepts arbitrary safe browser files and rejects framework files', () => {
    const parsed = parseAIResponse([
      '<FILE path="index.html"><a href="pages/contact.html">Contact</a></FILE>',
      '<FILE path="pages/contact.html"><h1>Contact</h1></FILE>',
      '<FILE path="assets/css/contact.css">h1 { color: teal; }</FILE>',
      '<FILE path="assets/js/contact.js">document.body.dataset.ready = "true";</FILE>',
      '<FILE path="src/App.tsx">export default function App() { return null; }</FILE>',
      '<SUMMARY>Created a linked contact page.</SUMMARY>',
    ].join('\n'));

    expect(parsed.fileList).toEqual([
      'index.html',
      'pages/contact.html',
      'assets/css/contact.css',
      'assets/js/contact.js',
    ]);
    expect(parsed.files['src/App.tsx']).toBeUndefined();
  });

  it('applies compact search/replace patches without rewriting the file', () => {
    const current = {
      'assets/js/app.js': file('assets/js/app.js', 'const total = 1;\nconsole.log(total);'),
    };
    const parsed = parseAIResponse([
      '<PATCH path="assets/js/app.js">',
      '<SEARCH>const total = 1;</SEARCH>',
      '<REPLACE>const total = 2;</REPLACE>',
      '</PATCH>',
      '<SUMMARY>Corrected the total.</SUMMARY>',
    ].join('\n'), current);

    expect(parsed.fileList).toEqual(['assets/js/app.js']);
    expect(parsed.files['assets/js/app.js'].content).toBe('const total = 2;\nconsole.log(total);');
  });

  it('reports the exact JavaScript file that contains invalid syntax', () => {
    const issue = findJavaScriptSyntaxError({
      'assets/js/products.js': file('assets/js/products.js', 'const products = [];'),
      'assets/js/app.js': file('assets/js/app.js', 'const broken = "unterminated;'),
    });

    expect(issue?.path).toBe('assets/js/app.js');
    expect(issue?.message).toMatch(/token|string|invalid/i);
  });

  it('reports the HTML file containing a broken inline script', () => {
    const issue = findJavaScriptSyntaxError({
      'checkout.html': file('checkout.html', '<main>Checkout</main>\n<script>\nconst value = "broken;\n</script>'),
    });

    expect(issue?.path).toBe('checkout.html');
    expect(issue?.message).toMatch(/token|string|invalid/i);
  });
});
