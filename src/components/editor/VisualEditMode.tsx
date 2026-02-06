import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Type, Save, ChevronDown, Bold, Italic, Underline,
  RotateCcw, Plus, Minus, Palette, Smartphone, Monitor, Tablet,
  AlignLeft, AlignCenter, AlignRight, MousePointer, Check, Edit3
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ProjectFile } from '@/types';
import { applyVisualChanges, generateChangeSummary, parseProjectElements } from '@/services/visualEditService';
import { toast } from 'sonner';

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
  type: 'text' | 'image' | 'button' | 'container' | 'heading' | 'paragraph' | 'link';
  content: string;
  originalContent: string;
  styles: ElementStyles;
  originalStyles: ElementStyles;
  tagName?: string;
  filePath: string;
  startLine: number;
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
  { label: 'Space Grotesk', value: 'Space Grotesk, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Mono', value: 'monospace' },
];

const defaultStyles: ElementStyles = {
  color: '#000000',
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Parse elements from project files
  const parsedElements = useMemo(() => {
    return parseProjectElements(projectFiles);
  }, [projectFiles]);

  // Generate preview HTML
  const previewHtml = useMemo(() => {
    // Find index.html or create a basic one
    const indexHtml = projectFiles['index.html']?.content || projectFiles['public/index.html']?.content;
    const appTsx = projectFiles['src/App.tsx']?.content || projectFiles['App.tsx']?.content;
    const indexCss = projectFiles['src/index.css']?.content || projectFiles['index.css']?.content || '';

    if (indexHtml) {
      return indexHtml;
    }

    // Create a basic preview HTML
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Preview</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${indexCss}</style>
</head>
<body>
  <div id="root">
    <div class="p-8 text-center">
      <h1 class="text-2xl font-bold mb-4">Visual Edit Preview</h1>
      <p class="text-gray-600">Select an element from the list to edit</p>
    </div>
  </div>
</body>
</html>`;
  }, [projectFiles]);

  const handleElementSelect = useCallback((elementId: string) => {
    const element = parsedElements.find(el => el.id === elementId);
    if (!element) return;

    const existing = editedElements.get(elementId);
    
    setSelectedElement({
      id: element.id,
      type: element.type,
      content: existing?.content || element.content,
      originalContent: element.content,
      styles: existing?.styles || { ...defaultStyles, ...element.styles },
      originalStyles: { ...defaultStyles, ...element.styles },
      tagName: element.tagName,
      filePath: element.filePath,
      startLine: element.startLine,
    });
  }, [parsedElements, editedElements]);

  const updateElementStyle = useCallback((property: keyof ElementStyles, value: string) => {
    if (!selectedElement) return;
    
    const updated: SelectedElement = {
      ...selectedElement,
      styles: { ...selectedElement.styles, [property]: value },
    };
    
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  }, [selectedElement]);

  const updateElementContent = useCallback((content: string) => {
    if (!selectedElement) return;
    
    const updated: SelectedElement = { ...selectedElement, content };
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  }, [selectedElement]);

  const resetElement = useCallback(() => {
    if (!selectedElement) return;
    
    const reset: SelectedElement = {
      ...selectedElement,
      content: selectedElement.originalContent,
      styles: { ...selectedElement.originalStyles },
    };
    
    setSelectedElement(reset);
    setEditedElements(prev => {
      const newMap = new Map(prev);
      newMap.delete(selectedElement.id);
      return newMap;
    });
    
    toast.success('Element reset to original');
  }, [selectedElement]);

  const handleSave = useCallback(async () => {
    if (editedElements.size === 0) {
      toast.info('No changes to save');
      return;
    }

    setIsSaving(true);
    
    try {
      const changes = Array.from(editedElements.values()).map(el => ({
        elementId: el.id,
        newContent: el.content,
        newStyles: el.styles,
      }));

      const updatedFiles = applyVisualChanges(projectFiles, changes, parsedElements);
      const summary = generateChangeSummary(changes, parsedElements);

      await onSave(changes, updatedFiles, summary);
      
      setEditedElements(new Map());
      setSelectedElement(null);
      toast.success(`Saved ${changes.length} change(s)`);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  }, [editedElements, projectFiles, parsedElements, onSave]);

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const getChangesCount = () => editedElements.size;

  // Group elements by type for sidebar
  const groupedElements = useMemo(() => {
    const groups: Record<string, typeof parsedElements> = {};
    parsedElements.forEach(el => {
      const group = el.type;
      if (!groups[group]) groups[group] = [];
      groups[group].push(el);
    });
    return groups;
  }, [parsedElements]);

  return (
    <div className="flex h-screen bg-background">
      {/* Left Panel - Element List & Editing */}
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

          {/* Save Button */}
          {getChangesCount() > 0 && (
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full mb-2"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Saving...' : `Save ${getChangesCount()} Change(s)`}
            </Button>
          )}
        </div>

        {/* Element Selection or Editing */}
        <div className="flex-1 overflow-y-auto">
          {!selectedElement ? (
            // Element List
            <div className="p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                Select an element to edit ({parsedElements.length} found)
              </h3>
              
              {Object.entries(groupedElements).map(([type, elements]) => (
                <div key={type} className="mb-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">
                    {type}s ({elements.length})
                  </h4>
                  <div className="space-y-1">
                    {elements.slice(0, 10).map(el => (
                      <button
                        key={el.id}
                        onClick={() => handleElementSelect(el.id)}
                        className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                          editedElements.has(el.id)
                            ? 'bg-primary/10 border border-primary/30'
                            : 'bg-secondary/50 hover:bg-secondary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Edit3 className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate flex-1">
                            {el.content.slice(0, 30) || `<${el.tagName}>`}
                            {el.content.length > 30 && '...'}
                          </span>
                          {editedElements.has(el.id) && (
                            <span className="w-2 h-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {el.filePath}:{el.startLine}
                        </div>
                      </button>
                    ))}
                    {elements.length > 10 && (
                      <p className="text-xs text-muted-foreground px-2">
                        +{elements.length - 10} more...
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {parsedElements.length === 0 && (
                <div className="text-center py-8">
                  <MousePointer className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No editable elements found
                  </p>
                </div>
              )}
            </div>
          ) : (
            // Element Editor
            <div className="p-4">
              {/* Back Button */}
              <button
                onClick={() => setSelectedElement(null)}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
              >
                ← Back to elements
              </button>

              {/* Element Info */}
              <div className="mb-4 p-3 bg-secondary/50 rounded-lg">
                <div className="text-xs text-muted-foreground mb-1">
                  {selectedElement.tagName} • {selectedElement.type}
                </div>
                <div className="text-xs text-muted-foreground">
                  {selectedElement.filePath}:{selectedElement.startLine}
                </div>
              </div>

              {/* Content Editor */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Content
                </label>
                <textarea
                  value={selectedElement.content}
                  onChange={(e) => updateElementContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-border bg-background text-foreground text-sm resize-none"
                  rows={3}
                  placeholder="Enter content..."
                />
              </div>

              {/* Font Family */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Font
                </label>
                <div className="relative">
                  <button
                    onClick={() => setShowFontDropdown(!showFontDropdown)}
                    className="w-full p-2 rounded-lg border border-border bg-background text-left text-sm flex items-center justify-between"
                  >
                    <span>{fontOptions.find(f => f.value === selectedElement.styles.fontFamily)?.label || 'Default'}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {showFontDropdown && (
                    <div className="absolute top-full left-0 w-full mt-1 bg-card border border-border rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {fontOptions.map(font => (
                        <button
                          key={font.value}
                          onClick={() => {
                            updateElementStyle('fontFamily', font.value);
                            setShowFontDropdown(false);
                          }}
                          className="w-full p-2 text-left text-sm hover:bg-secondary"
                          style={{ fontFamily: font.value }}
                        >
                          {font.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Font Size */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Font Size
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const current = parseInt(selectedElement.styles.fontSize) || 16;
                      updateElementStyle('fontSize', `${Math.max(8, current - 2)}px`);
                    }}
                    className="p-2 rounded-lg border border-border hover:bg-secondary"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="text"
                    value={selectedElement.styles.fontSize}
                    onChange={(e) => updateElementStyle('fontSize', e.target.value)}
                    className="flex-1 p-2 rounded-lg border border-border bg-background text-center text-sm"
                  />
                  <button
                    onClick={() => {
                      const current = parseInt(selectedElement.styles.fontSize) || 16;
                      updateElementStyle('fontSize', `${Math.min(72, current + 2)}px`);
                    }}
                    className="p-2 rounded-lg border border-border hover:bg-secondary"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Style */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Style
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateElementStyle('fontWeight', selectedElement.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                    className={`p-2 rounded-lg border ${selectedElement.styles.fontWeight === 'bold' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
                  >
                    <Bold className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElementStyle('fontStyle', selectedElement.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                    className={`p-2 rounded-lg border ${selectedElement.styles.fontStyle === 'italic' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
                  >
                    <Italic className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => updateElementStyle('textDecoration', selectedElement.styles.textDecoration === 'underline' ? 'none' : 'underline')}
                    className={`p-2 rounded-lg border ${selectedElement.styles.textDecoration === 'underline' ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
                  >
                    <Underline className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Text Align */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Alignment
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'left', icon: AlignLeft },
                    { value: 'center', icon: AlignCenter },
                    { value: 'right', icon: AlignRight },
                  ].map(({ value, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => updateElementStyle('textAlign', value)}
                      className={`p-2 rounded-lg border ${selectedElement.styles.textAlign === value ? 'bg-primary text-primary-foreground' : 'border-border hover:bg-secondary'}`}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Colors */}
              <div className="mb-4">
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Colors
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Text</label>
                    <input
                      type="color"
                      value={selectedElement.styles.color}
                      onChange={(e) => updateElementStyle('color', e.target.value)}
                      className="w-full h-10 rounded-lg border border-border cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Background</label>
                    <input
                      type="color"
                      value={selectedElement.styles.backgroundColor || '#ffffff'}
                      onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                      className="w-full h-10 rounded-lg border border-border cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetElement}
                className="w-full p-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-secondary flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Reset to Original
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Preview */}
      <div className="flex-1 flex flex-col bg-secondary/30">
        {/* Preview Header */}
        <div className="h-14 px-4 flex items-center justify-between border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Preview</span>
            {getChangesCount() > 0 && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                {getChangesCount()} unsaved
              </span>
            )}
          </div>

          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'desktop' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'tablet' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'mobile' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 flex items-start justify-center overflow-auto p-4">
          <div
            className={`bg-white shadow-2xl overflow-hidden transition-all duration-300 ${
              deviceView === 'desktop' 
                ? 'w-full h-full rounded-lg' 
                : 'rounded-xl border-4 border-gray-800'
            }`}
            style={{ 
              width: getDeviceWidth(), 
              height: deviceView === 'desktop' ? '100%' : '80vh',
              maxHeight: 'calc(100vh - 120px)'
            }}
          >
            <iframe
              ref={iframeRef}
              srcDoc={previewHtml}
              className="w-full h-full border-none"
              title="Visual Edit Preview"
              sandbox="allow-scripts"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
