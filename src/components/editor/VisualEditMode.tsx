import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, Save, ChevronDown, Bold, Italic, Underline, 
  RotateCcw, Plus, Minus, Palette, Smartphone, Monitor, Tablet,
  AlignLeft, AlignCenter, AlignRight, MousePointer, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SandpackPreview, SandpackProvider, type SandpackPreviewRef } from '@codesandbox/sandpack-react';
import type { ProjectFile } from '@/types';
import { applyVisualChanges, generateChangeSummary, parseProjectElements } from '@/services/visualEditService';

interface ElementStyles {
  color: string;
  fontSize: string;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  textDecoration: string;
  fontFamily: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  opacity?: string;
}

interface SelectedElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'container';
  content: string;
  originalContent: string;
  styles: ElementStyles;
  originalStyles: ElementStyles;
  tagName?: string;
}

interface VisualEditModeProps {
  projectFiles: Record<string, ProjectFile>;
  onSave: (
    changes: { elementId: string; newContent: string; newStyles: ElementStyles }[],
    updatedFiles: Record<string, ProjectFile>,
    summary: string
  ) => void;
  onClose: () => void;
}

const fontOptions = [
  { label: 'Default', value: 'inherit' },
  { label: 'Inter', value: 'Inter, sans-serif' },
  { label: 'Roboto', value: 'Roboto, sans-serif' },
  { label: 'Poppins', value: 'Poppins, sans-serif' },
  { label: 'Montserrat', value: 'Montserrat, sans-serif' },
  { label: 'Playfair', value: 'Playfair Display, serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Mono', value: 'monospace' },
];

const defaultStyles: ElementStyles = {
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'normal',
  fontStyle: 'normal',
  textAlign: 'left',
  textDecoration: 'none',
  fontFamily: 'inherit',
};

export const VisualEditMode: React.FC<VisualEditModeProps> = ({
  projectFiles,
  onSave,
  onClose,
}) => {
  const [selectedElement, setSelectedElement] = useState<SelectedElement | null>(null);
  const [editedElements, setEditedElements] = useState<Map<string, SelectedElement>>(new Map());
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const previewRef = useRef<SandpackPreviewRef | null>(null);

  const parsedProjectElements = React.useMemo(() => {
    return parseProjectElements(projectFiles);
  }, [projectFiles]);

  // Convert project files to Sandpack format
  const sandpackFiles = React.useMemo(() => {
    const files: Record<string, { code: string }> = {};
    Object.entries(projectFiles).forEach(([path, file]) => {
      const sandpackPath = path.startsWith('/') ? path : `/${path}`;
      files[sandpackPath] = { code: file.content };
    });

    // Remap /src/ files to root for react-ts template
    const remappedFiles: Record<string, { code: string }> = {};
    Object.entries(files).forEach(([path, file]) => {
      if (path.startsWith('/src/')) {
        remappedFiles[path.replace('/src/', '/')] = file;
      } else {
        remappedFiles[path] = file;
      }
    });

    if (!remappedFiles['/main.tsx'] && !remappedFiles['/index.tsx']) {
      remappedFiles['/main.tsx'] = {
        code: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const root = createRoot(document.getElementById("root"));
root.render(<App />);`
      };
    }

    if (!remappedFiles['/index.css']) {
      remappedFiles['/index.css'] = {
        code: `@tailwind base;
@tailwind components;
@tailwind utilities;`
      };
    }

    return remappedFiles;
  }, [projectFiles]);

  // Inject click handler into preview
  const injectClickHandler = useCallback(() => {
    const iframe = previewRef.current?.getClient()?.iframe;
    if (!iframe?.contentWindow) return;

    try {
      const doc = iframe.contentDocument;
      if (!doc) return;

      const win = iframe.contentWindow;

      // Use design tokens for highlight color (fallback if missing)
      const rootStyles = win.getComputedStyle(doc.documentElement);
      const primary = rootStyles.getPropertyValue('--primary').trim();
      const outlineColor = primary ? `hsl(${primary})` : '#6366f1';

      // Add click listener to editable elements
      const editableSelectors = 'h1, h2, h3, h4, h5, h6, p, span, button, a, label, div[class*="text"], img';
      const elements = doc.querySelectorAll(editableSelectors);

      elements.forEach((el, index) => {
        const htmlEl = el as HTMLElement;

        // Avoid double-binding listeners when the preview re-renders.
        if (htmlEl.dataset.visualEditBound === '1') return;

        htmlEl.dataset.visualEditId = `element-${index}`;
        htmlEl.dataset.visualEditBound = '1';
        
        // Add hover effect
        htmlEl.addEventListener('mouseenter', () => {
          htmlEl.style.outline = `2px solid ${outlineColor}`;
          htmlEl.style.outlineOffset = '2px';
          htmlEl.style.cursor = 'pointer';
        });
        
        htmlEl.addEventListener('mouseleave', () => {
          if (htmlEl.dataset.visualEditId !== selectedElement?.id) {
            htmlEl.style.outline = 'none';
          }
        });
        
        htmlEl.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          
          const computedStyle = win.getComputedStyle(htmlEl);
          const tagName = htmlEl.tagName.toLowerCase();
          
          let type: 'text' | 'button' | 'image' | 'container' = 'text';
          if (tagName === 'button' || tagName === 'a') type = 'button';
          else if (tagName === 'img') type = 'image';
          else if (tagName === 'div') type = 'container';

          const styles: ElementStyles = {
            color: computedStyle.color,
            fontSize: computedStyle.fontSize,
            fontWeight: computedStyle.fontWeight,
            fontStyle: computedStyle.fontStyle,
            textAlign: computedStyle.textAlign,
            textDecoration: computedStyle.textDecoration,
            fontFamily: computedStyle.fontFamily,
            backgroundColor: computedStyle.backgroundColor,
          };

          const content = tagName === 'img' 
            ? (htmlEl as HTMLImageElement).src 
            : htmlEl.textContent || '';

          const element: SelectedElement = {
            id: htmlEl.dataset.visualEditId!,
            type,
            content,
            originalContent: content,
            styles,
            originalStyles: { ...styles },
            tagName,
          };

          // Check if already edited
          const existing = editedElements.get(element.id);
          setSelectedElement(existing || element);

          // Highlight selected
          doc.querySelectorAll('[data-visual-edit-id]').forEach(e => {
            (e as HTMLElement).style.outline = 'none';
          });
          htmlEl.style.outline = `3px solid ${outlineColor}`;
          htmlEl.style.outlineOffset = '2px';
        });
      });
    } catch (error) {
      console.error('Error injecting click handler:', error);
    }
  }, [selectedElement, editedElements]);

  // Apply changes to preview
  const applyChangesToPreview = useCallback(() => {
    const iframe = previewRef.current?.getClient()?.iframe;
    if (!iframe?.contentDocument) return;

    editedElements.forEach((element, id) => {
      const el = iframe.contentDocument?.querySelector(`[data-visual-edit-id="${id}"]`) as HTMLElement;
      if (el) {
        if (element.type === 'image') {
          (el as HTMLImageElement).src = element.content;
        } else {
          el.textContent = element.content;
        }
        Object.assign(el.style, {
          color: element.styles.color,
          fontSize: element.styles.fontSize,
          fontWeight: element.styles.fontWeight,
          fontStyle: element.styles.fontStyle,
          textAlign: element.styles.textAlign,
          textDecoration: element.styles.textDecoration,
          fontFamily: element.styles.fontFamily,
          backgroundColor: element.styles.backgroundColor || '',
        });
      }
    });
  }, [editedElements]);

  const updateElementStyle = (property: keyof ElementStyles, value: string) => {
    if (!selectedElement) return;
    
    const updated = {
      ...selectedElement,
      styles: { ...selectedElement.styles, [property]: value },
    };
    
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
    
    // Apply to preview immediately
    setTimeout(applyChangesToPreview, 0);
  };

  const updateElementContent = (content: string) => {
    if (!selectedElement) return;
    
    const updated = { ...selectedElement, content };
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
    
    setTimeout(applyChangesToPreview, 0);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const rawChanges = Array.from(editedElements.values()).map(el => ({
        elementId: el.id,
        newContent: el.content,
        newStyles: el.styles,
        originalContent: el.originalContent,
        tagName: (el.tagName || '').toLowerCase(),
        type: el.type,
      }));

      const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

      const getSrcKey = (src: string) => {
        try {
          // Prefer stable part of URLs (strip query + origin)
          const u = new URL(src);
          return `${u.hostname}${u.pathname}`;
        } catch {
          return src.split('?')[0];
        }
      };

      const pickBestMatch = (candidates: any[], target: { tagName: string; originalContent: string; type: string }) => {
        const tag = target.tagName;
        const original = normalize(target.originalContent);

        // Strong preference: exact tag + exact content
        const exact = candidates.find((c) => normalize(c.content || '') === original && (!tag || c.tagName === tag));
        if (exact) return exact;

        // Next: exact content regardless tag
        const exact2 = candidates.find((c) => normalize(c.content || '') === original);
        if (exact2) return exact2;

        // Next: includes match
        const inc = candidates.find((c) => {
          const cc = normalize(c.content || '');
          return cc.includes(original) || original.includes(cc);
        });
        return inc || null;
      };

      const mappedChanges = rawChanges
        .map((c) => {
          const tag = c.tagName;
          const isHeading = /^h[1-6]$/.test(tag);
          const desiredTypes: string[] = [];
          if (c.type === 'image' || tag === 'img') desiredTypes.push('image');
          else if (tag === 'a') desiredTypes.push('link', 'button');
          else if (tag === 'button') desiredTypes.push('button');
          else if (isHeading) desiredTypes.push('heading');
          else if (tag === 'p') desiredTypes.push('paragraph');
          else if (tag === 'div') desiredTypes.push('container', 'text', 'paragraph');
          else desiredTypes.push('text');

          let candidates = parsedProjectElements.filter((el: any) => desiredTypes.includes(el.type));
          if (tag) {
            const tagFiltered = candidates.filter((el: any) => (el.tagName || '').toLowerCase() === tag);
            if (tagFiltered.length > 0) candidates = tagFiltered;
          }

          if (desiredTypes.includes('image')) {
            const originalKey = getSrcKey(c.originalContent);
            const match = candidates.find((el: any) => {
              if (!el.src) return false;
              const elKey = getSrcKey(el.src);
              return elKey === originalKey || elKey.includes(originalKey) || originalKey.includes(elKey);
            });
            if (!match) return null;
            return { elementId: match.id, newContent: c.newContent, newStyles: c.newStyles };
          }

          const match = pickBestMatch(candidates, c);
          if (!match) return null;
          return { elementId: match.id, newContent: c.newContent, newStyles: c.newStyles };
        })
        .filter(Boolean) as { elementId: string; newContent: string; newStyles: ElementStyles }[];

      const updatedFiles = applyVisualChanges(
        projectFiles,
        mappedChanges as any,
        parsedProjectElements as any
      );

      const summary = generateChangeSummary(mappedChanges as any, parsedProjectElements as any);
      onSave(mappedChanges, updatedFiles, summary);
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetElement = () => {
    if (!selectedElement) return;
    
    const reset: SelectedElement = {
      ...selectedElement,
      content: selectedElement.originalContent,
      styles: { ...selectedElement.originalStyles },
    };
    
    setSelectedElement(reset);
    editedElements.delete(reset.id);
    setEditedElements(new Map(editedElements));
    
    setTimeout(applyChangesToPreview, 0);
  };

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getChangesCount = () => editedElements.size;

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Editing Options */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Visual Edit</span>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
          
          {getChangesCount() > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 rounded-lg">
              <Check className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400">{getChangesCount()} changes</span>
            </div>
          )}
        </div>

        {/* Instructions when no element selected */}
        {!selectedElement ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MousePointer className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Select an Element</h3>
            <p className="text-sm text-muted-foreground">
              Click on any text, button, or image in the preview to start editing
            </p>
          </div>
        ) : (
          /* Edit Controls */
          <div className="flex-1 overflow-auto p-4 space-y-4">
            {/* Element Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground capitalize">{selectedElement.type}</span>
                <span className="text-xs text-muted-foreground">({selectedElement.tagName})</span>
              </div>
              <button
                onClick={resetElement}
                className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Content</label>
              <textarea
                value={selectedElement.content}
                onChange={(e) => updateElementContent(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none text-sm"
                rows={3}
              />
            </div>

            {/* Font Family */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Font</label>
              <div className="relative">
                <button
                  onClick={() => setShowFontDropdown(!showFontDropdown)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                >
                  <span>{fontOptions.find(f => selectedElement.styles.fontFamily.includes(f.value.split(',')[0]))?.label || 'Default'}</span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </button>
                <AnimatePresence>
                  {showFontDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto"
                    >
                      {fontOptions.map((font) => (
                        <button
                          key={font.value}
                          onClick={() => {
                            updateElementStyle('fontFamily', font.value);
                            setShowFontDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors text-foreground"
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Font Size */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Size</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = parseInt(selectedElement.styles.fontSize);
                    updateElementStyle('fontSize', `${Math.max(10, current - 2)}px`);
                  }}
                  className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={selectedElement.styles.fontSize}
                  onChange={(e) => updateElementStyle('fontSize', e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm text-center"
                />
                <button
                  onClick={() => {
                    const current = parseInt(selectedElement.styles.fontSize);
                    updateElementStyle('fontSize', `${Math.min(100, current + 2)}px`);
                  }}
                  className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Text Style */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Style</label>
              <div className="flex gap-1">
                <button
                  onClick={() => updateElementStyle('fontWeight', selectedElement.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    selectedElement.styles.fontWeight === 'bold' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <Bold className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => updateElementStyle('fontStyle', selectedElement.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    selectedElement.styles.fontStyle === 'italic' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <Italic className="w-4 h-4 mx-auto" />
                </button>
                <button
                  onClick={() => updateElementStyle('textDecoration', selectedElement.styles.textDecoration === 'underline' ? 'none' : 'underline')}
                  className={`flex-1 p-2 rounded-lg border transition-colors ${
                    selectedElement.styles.textDecoration === 'underline' 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'border-border hover:bg-secondary'
                  }`}
                >
                  <Underline className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>

            {/* Alignment */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Alignment</label>
              <div className="flex gap-1">
                {['left', 'center', 'right'].map((align) => (
                  <button
                    key={align}
                    onClick={() => updateElementStyle('textAlign', align)}
                    className={`flex-1 p-2 rounded-lg border transition-colors ${
                      selectedElement.styles.textAlign === align 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {align === 'left' && <AlignLeft className="w-4 h-4 mx-auto" />}
                    {align === 'center' && <AlignCenter className="w-4 h-4 mx-auto" />}
                    {align === 'right' && <AlignRight className="w-4 h-4 mx-auto" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Colors */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">Text Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={selectedElement.styles.color.startsWith('rgb') ? '#ffffff' : selectedElement.styles.color}
                    onChange={(e) => updateElementStyle('color', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                  />
                </div>
              </div>
              {selectedElement.type === 'button' && (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Background</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor?.startsWith('rgb') ? '#6366f1' : (selectedElement.styles.backgroundColor || '#6366f1')}
                      onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            onClick={handleSave}
            disabled={getChangesCount() === 0 || isSaving}
            className="w-full"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : `Save ${getChangesCount()} Change${getChangesCount() !== 1 ? 's' : ''}`}
          </Button>
          <Button variant="outline" onClick={onClose} className="w-full">
            Cancel
          </Button>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 flex flex-col bg-secondary/30">
        {/* Preview Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Live Preview</span>
            <span className="text-xs text-muted-foreground">Click on elements to edit</span>
          </div>
          
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'tablet' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'mobile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex items-start justify-center p-4 overflow-auto">
          <div 
            className="bg-background rounded-lg shadow-2xl overflow-hidden transition-all duration-300"
            style={{ width: getDeviceWidth(), height: deviceView === 'desktop' ? '100%' : '80vh' }}
          >
            {Object.keys(sandpackFiles).length > 0 ? (
              <SandpackProvider
                template="react-ts"
                files={sandpackFiles}
                theme="dark"
                options={{
                  externalResources: [
                    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
                  ],
                }}
              >
                <div className="h-full">
                  <SandpackPreview
                    showNavigator={false}
                    showRefreshButton={false}
                    showOpenInCodeSandbox={false}
                    style={{ height: '100%' }}
                    ref={(ref: SandpackPreviewRef | null) => {
                      previewRef.current = ref;
                      // Sandpack mounts/updates the iframe asynchronously
                      setTimeout(injectClickHandler, 700);
                    }}
                  />
                </div>
              </SandpackProvider>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <Palette className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No files to preview</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
