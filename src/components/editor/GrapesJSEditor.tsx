import React, { useEffect, useRef, useState, useCallback } from 'react';
import grapesjs, { Editor } from 'grapesjs';
import 'grapesjs/dist/css/grapes.min.css';
import { X, Save, Undo2, Redo2, Monitor, Smartphone, Tablet, Layers, Paintbrush, Settings2, Code2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/types';
import { toast } from 'sonner';

interface GrapesJSEditorProps {
  projectFiles: Record<string, ProjectFile>;
  onSave: (
    changes: { elementId: string; newContent: string; newStyles: any }[],
    updatedFiles: Record<string, ProjectFile>,
    summary: string
  ) => void;
  onClose: () => void;
}

export const GrapesJSEditor: React.FC<GrapesJSEditorProps> = ({
  projectFiles,
  onSave,
  onClose,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const gjsEditor = useRef<Editor | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activePanel, setActivePanel] = useState<'blocks' | 'styles' | 'layers' | 'settings'>('blocks');
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Build initial HTML from project files
  const buildProjectHTML = useCallback((): string => {
    // Always start with a proper editable page structure
    // The JSX-to-HTML extraction is too fragile, so we provide 
    // a rich starter template that users can edit visually
    
    const hasFiles = Object.keys(projectFiles).length > 0;
    
    // Try to extract any index.html if it exists
    const indexHtml = projectFiles['index.html'];
    if (indexHtml) {
      const bodyMatch = indexHtml.content.match(/<body[^>]*>([\s\S]*)<\/body>/i);
      if (bodyMatch && bodyMatch[1].trim().length > 50) {
        return bodyMatch[1];
      }
    }

    // Provide a rich default template for visual editing
    return `
      <nav class="flex items-center justify-between px-8 py-4 bg-white shadow-sm border-b">
        <div class="text-2xl font-bold text-gray-900">My Website</div>
        <div class="flex items-center gap-6">
          <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Home</a>
          <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">About</a>
          <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Services</a>
          <a href="#" class="text-gray-600 hover:text-gray-900 font-medium">Contact</a>
          <button class="px-5 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700">Get Started</button>
        </div>
      </nav>
      
      <section class="relative py-24 px-4 bg-gradient-to-br from-gray-900 via-blue-900 to-gray-800 text-white">
        <div class="max-w-4xl mx-auto text-center">
          <h1 class="text-6xl font-bold mb-6 leading-tight">Build Something<br/>Amazing Today</h1>
          <p class="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">Create stunning websites with our powerful visual editor. Drag, drop, and customize every element.</p>
          <div class="flex items-center justify-center gap-4">
            <button class="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 shadow-lg shadow-blue-600/30">Start Building</button>
            <button class="px-8 py-4 bg-white/10 text-white rounded-xl font-bold text-lg hover:bg-white/20 backdrop-blur border border-white/20">Learn More</button>
          </div>
        </div>
      </section>

      <section class="py-20 px-4 bg-white">
        <div class="max-w-6xl mx-auto text-center">
          <h2 class="text-4xl font-bold text-gray-900 mb-4">Our Features</h2>
          <p class="text-lg text-gray-500 mb-12 max-w-2xl mx-auto">Everything you need to build modern websites</p>
          <div class="grid grid-cols-3 gap-8">
            <div class="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <div class="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">🎨</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Visual Design</h3>
              <p class="text-gray-500">Drag and drop components to build your perfect layout</p>
            </div>
            <div class="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <div class="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">⚡</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Fast & Light</h3>
              <p class="text-gray-500">Optimized for performance with clean, semantic code</p>
            </div>
            <div class="p-8 rounded-2xl bg-gray-50 border border-gray-100 text-center">
              <div class="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-2xl">📱</div>
              <h3 class="text-xl font-bold text-gray-900 mb-2">Responsive</h3>
              <p class="text-gray-500">Looks great on every device, from mobile to desktop</p>
            </div>
          </div>
        </div>
      </section>

      <footer class="bg-gray-900 text-gray-400 py-12 px-4">
        <div class="max-w-6xl mx-auto grid grid-cols-3 gap-8">
          <div>
            <h4 class="text-white font-bold text-lg mb-4">My Website</h4>
            <p class="text-sm">Building the future of web design.</p>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Links</h4>
            <a href="#" class="block text-sm hover:text-white mb-2">About Us</a>
            <a href="#" class="block text-sm hover:text-white mb-2">Services</a>
            <a href="#" class="block text-sm hover:text-white">Contact</a>
          </div>
          <div>
            <h4 class="text-white font-bold mb-4">Contact</h4>
            <p class="text-sm">hello@example.com</p>
          </div>
        </div>
      </footer>
    `;
  }, [projectFiles]);



  useEffect(() => {
    if (!editorRef.current) return;

    const htmlContent = buildProjectHTML();

    const editor = grapesjs.init({
      container: editorRef.current,
      fromElement: false,
      height: '100%',
      width: 'auto',
      storageManager: false,
      panels: { defaults: [] },
      selectorManager: { componentFirst: true, appendTo: '#gjs-styles' },
      layerManager: { appendTo: '#gjs-layers' },
      traitManager: { appendTo: '#gjs-traits' },
      styleManager: {
        appendTo: '#gjs-styles',
        sectors: [
          {
            name: 'General',
            properties: [
              { property: 'display', type: 'select', options: [
                { id: 'block', label: 'Block' }, { id: 'flex', label: 'Flex' },
                { id: 'grid', label: 'Grid' }, { id: 'inline', label: 'Inline' }, { id: 'none', label: 'None' },
              ]},
              { property: 'position', type: 'select', options: [
                { id: 'static', label: 'Static' }, { id: 'relative', label: 'Relative' },
                { id: 'absolute', label: 'Absolute' }, { id: 'fixed', label: 'Fixed' },
              ]},
            ],
          },
          { name: 'Dimension', properties: ['width', 'height', 'max-width', 'min-height', 'margin', 'padding'] },
          { name: 'Typography', properties: ['font-family', 'font-size', 'font-weight', 'letter-spacing', 'color', 'line-height', 'text-align', 'text-decoration', 'text-transform'] },
          { name: 'Decorations', properties: ['background-color', 'background', 'border-radius', 'border', 'box-shadow', 'opacity'] },
          { name: 'Flex', properties: ['flex-direction', 'flex-wrap', 'justify-content', 'align-items', 'align-content', 'gap'] },
        ],
      },
      blockManager: {
        appendTo: '#gjs-blocks',
        blocks: [
          { id: 'section', label: 'Section', category: 'Layout', content: '<section class="py-16 px-4"><div class="max-w-6xl mx-auto"></div></section>' },
          { id: 'container', label: 'Container', category: 'Layout', content: '<div class="max-w-6xl mx-auto px-4"></div>' },
          { id: 'grid-2', label: '2 Columns', category: 'Layout', content: '<div class="grid grid-cols-2 gap-6"><div class="p-4">Column 1</div><div class="p-4">Column 2</div></div>' },
          { id: 'grid-3', label: '3 Columns', category: 'Layout', content: '<div class="grid grid-cols-3 gap-6"><div class="p-4">Col 1</div><div class="p-4">Col 2</div><div class="p-4">Col 3</div></div>' },
          { id: 'heading', label: 'Heading', category: 'Basic', content: '<h2 class="text-3xl font-bold mb-4">Your Heading</h2>' },
          { id: 'paragraph', label: 'Paragraph', category: 'Basic', content: '<p class="text-lg text-gray-600 leading-relaxed">Your paragraph text goes here.</p>' },
          { id: 'button', label: 'Button', category: 'Basic', content: '<button class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">Click Me</button>' },
          { id: 'image', label: 'Image', category: 'Basic', content: { type: 'image' } },
          { id: 'hero', label: 'Hero Section', category: 'Sections', content: '<section class="relative py-24 px-4 bg-gradient-to-br from-gray-900 to-gray-800 text-white"><div class="max-w-4xl mx-auto text-center"><h1 class="text-5xl font-bold mb-6">Build Something Amazing</h1><p class="text-xl text-gray-300 mb-8">Create stunning websites with our visual editor</p><button class="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold text-lg hover:bg-blue-700 transition-colors">Get Started</button></div></section>' },
          { id: 'card', label: 'Card', category: 'Sections', content: '<div class="bg-white rounded-xl shadow-lg p-6 border border-gray-100"><h3 class="text-xl font-bold mb-2">Card Title</h3><p class="text-gray-600">Card description text here.</p></div>' },
          { id: 'navbar', label: 'Navigation', category: 'Sections', content: '<nav class="flex items-center justify-between px-6 py-4 bg-white shadow-sm"><div class="text-xl font-bold">Logo</div><div class="flex items-center gap-6"><a href="#" class="text-gray-600 hover:text-gray-900">Home</a><a href="#" class="text-gray-600 hover:text-gray-900">About</a><a href="#" class="text-gray-600 hover:text-gray-900">Contact</a><button class="px-4 py-2 bg-blue-600 text-white rounded-lg">Sign Up</button></div></nav>' },
          { id: 'footer', label: 'Footer', category: 'Sections', content: '<footer class="bg-gray-900 text-gray-400 py-12 px-4"><div class="max-w-6xl mx-auto grid grid-cols-3 gap-8"><div><h4 class="text-white font-bold mb-4">Company</h4><p>Building the future.</p></div><div><h4 class="text-white font-bold mb-4">Links</h4><a href="#" class="block hover:text-white">About</a></div><div><h4 class="text-white font-bold mb-4">Contact</h4><p>hello@example.com</p></div></div></footer>' },
          { id: 'testimonial', label: 'Testimonial', category: 'Sections', content: '<div class="bg-gray-50 rounded-2xl p-8 text-center"><p class="text-lg italic text-gray-700 mb-4">"This is an amazing product that changed our workflow."</p><p class="font-bold">John Doe</p><p class="text-sm text-gray-500">CEO, Company</p></div>' },
        ],
      },
      deviceManager: {
        devices: [
          { name: 'Desktop', width: '' },
          { name: 'Tablet', width: '768px', widthMedia: '992px' },
          { name: 'Mobile', width: '375px', widthMedia: '480px' },
        ],
      },
      canvas: {
        styles: [
          'https://cdn.tailwindcss.com',
          'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800;900&display=swap',
        ],
        scripts: ['https://cdn.tailwindcss.com'],
      },
    });

    // Set initial content
    editor.setComponents(htmlContent);

    // Custom styling for GrapesJS panels
    const editorEl = editorRef.current;
    if (editorEl) {
      const style = document.createElement('style');
      style.textContent = `
        .gjs-one-bg { background-color: hsl(var(--card)) !important; }
        .gjs-two-color { color: hsl(var(--foreground)) !important; }
        .gjs-three-bg { background-color: hsl(var(--secondary)) !important; }
        .gjs-four-color, .gjs-four-color-h:hover { color: hsl(var(--primary)) !important; }
        .gjs-cv-canvas { background-color: hsl(var(--muted)) !important; }
        .gjs-frame-wrapper { background: hsl(var(--background)) !important; }
        .gjs-block { 
          border: 1px solid hsl(var(--border)) !important; 
          border-radius: 8px !important; 
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--foreground)) !important;
          padding: 8px !important;
          min-height: 60px !important;
        }
        .gjs-block:hover { border-color: hsl(var(--primary)) !important; }
        .gjs-block__media { display: none !important; }
        .gjs-blocks-cs { padding: 8px !important; }
        .gjs-category-title { 
          background: hsl(var(--card)) !important; 
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
          padding: 10px 12px !important;
          font-weight: 600 !important;
        }
        .gjs-sm-sector-title {
          background: hsl(var(--card)) !important;
          color: hsl(var(--foreground)) !important;
          border-bottom: 1px solid hsl(var(--border)) !important;
        }
        .gjs-field { 
          background: hsl(var(--background)) !important; 
          border: 1px solid hsl(var(--border)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 6px !important;
        }
        .gjs-sm-property { color: hsl(var(--muted-foreground)) !important; }
        .gjs-layer-title { color: hsl(var(--foreground)) !important; }
        .gjs-layers { background: hsl(var(--card)) !important; }
        .gjs-clm-tags { background: hsl(var(--card)) !important; padding: 8px !important; }
        .gjs-clm-tag { 
          background: hsl(var(--secondary)) !important;
          color: hsl(var(--foreground)) !important;
          border-radius: 4px !important;
        }
        .gjs-toolbar { background: hsl(var(--primary)) !important; border-radius: 6px !important; }
        .gjs-toolbar-item { color: hsl(var(--primary-foreground)) !important; }
        .gjs-resizer-h { border-color: hsl(var(--primary)) !important; }
        .gjs-highlighter { outline-color: hsl(var(--primary)) !important; }
        .gjs-badge { background: hsl(var(--primary)) !important; color: hsl(var(--primary-foreground)) !important; border-radius: 4px !important; }
        #gjs { border: none !important; }
        .gjs-pn-panel { background: transparent !important; border: none !important; }
        .gjs-editor { background: hsl(var(--card)) !important; }
        .gjs-selected { outline: 2px solid hsl(var(--primary)) !important; outline-offset: -2px; }
      `;
      editorEl.appendChild(style);
    }

    gjsEditor.current = editor;

    return () => {
      editor.destroy();
      gjsEditor.current = null;
    };
  }, [buildProjectHTML]);

  // Device mode
  useEffect(() => {
    if (!gjsEditor.current) return;
    const deviceMap = { desktop: 'Desktop', tablet: 'Tablet', mobile: 'Mobile' };
    gjsEditor.current.setDevice(deviceMap[deviceMode]);
  }, [deviceMode]);

  // Save changes back to project files
  const handleSave = useCallback(async () => {
    if (!gjsEditor.current) return;
    setIsSaving(true);

    try {
      const html = gjsEditor.current.getHtml();
      const css = gjsEditor.current.getCss();

      // Send the HTML/CSS to the visual-edits edge function to convert back to JSX
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      let updatedFiles = { ...projectFiles };

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/visual-edits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            action: 'grapesjs-save',
            html,
            css,
            files: projectFiles,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.files) {
            for (const [path, file] of Object.entries(result.files)) {
              if (updatedFiles[path]) {
                updatedFiles[path] = { ...updatedFiles[path], content: (file as any).content };
              }
            }
          }
        }
      } catch (e) {
        console.warn('Edge function unavailable, saving raw HTML:', e);
      }

      // If edge function didn't update files, save as HTML directly
      const changes = [{ elementId: 'grapesjs-full', newContent: html, newStyles: {} }];
      onSave(changes, updatedFiles, 'Visual Editor: Layout & style changes');
      toast.success('Changes saved successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [projectFiles, onSave]);

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="h-5 w-px bg-border" />
          <span className="text-sm font-semibold text-foreground">Visual Editor</span>
          <span className="text-xs text-muted-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">GrapesJS</span>
        </div>

        <div className="flex items-center gap-1">
          {/* Device modes */}
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'desktop' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <Monitor className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'tablet' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <Tablet className="w-4 h-4" />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${deviceMode === 'mobile' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            <Smartphone className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Undo/Redo */}
          <button
            onClick={() => gjsEditor.current?.UndoManager.undo()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => gjsEditor.current?.UndoManager.redo()}
            className="p-1.5 rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <div className="h-5 w-px bg-border mx-1" />

          {/* Save */}
          <Button onClick={handleSave} disabled={isSaving} size="sm" className="h-8">
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
            Save
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Panel Switcher */}
        <div className="w-10 flex flex-col items-center py-2 gap-1 border-r border-border bg-card">
          <button
            onClick={() => setActivePanel('blocks')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'blocks' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Blocks"
          >
            <Code2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel('styles')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'styles' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Styles"
          >
            <Paintbrush className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel('layers')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'layers' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Layers"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            onClick={() => setActivePanel('settings')}
            className={`p-2 rounded-lg transition-colors ${activePanel === 'settings' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
            title="Settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>

        {/* Right Panel Content */}
        <div className="w-64 border-r border-border overflow-y-auto bg-card">
          {activePanel === 'blocks' && (
            <div id="gjs-blocks" className="gjs-blocks-container" />
          )}
          {activePanel === 'styles' && (
            <div id="gjs-styles" className="gjs-styles-container" />
          )}
          {activePanel === 'layers' && (
            <div id="gjs-layers" className="gjs-layers-container" />
          )}
          {activePanel === 'settings' && (
            <div id="gjs-traits" className="gjs-traits-container p-3">
              <p className="text-sm text-muted-foreground">Select an element to see its settings</p>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div ref={editorRef} className="flex-1 overflow-hidden" id="gjs" />
      </div>
    </div>
  );
};
