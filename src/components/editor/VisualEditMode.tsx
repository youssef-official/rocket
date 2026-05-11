import React, { useState, useCallback, useMemo } from 'react';
import {
  X, Save, ChevronDown, Bold, Italic, Underline,
  RotateCcw, Plus, Minus, Palette,
  AlignLeft, AlignCenter, AlignRight, MousePointer, Edit3
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

  // Parse elements from project files
  const parsedElements = useMemo(() => {
    return parseProjectElements(projectFiles);
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
      // Prepare change descriptions for the edge function
      const changeDetails = Array.from(editedElements.values()).map(el => ({
        filePath: el.filePath,
        startLine: el.startLine,
        newContent: el.content,
        originalContent: el.originalContent,
        newStyles: el.styles,
        originalStyles: el.originalStyles,
        tagName: el.tagName,
        type: el.type,
      }));

      const changes = Array.from(editedElements.values()).map(el => ({
        elementId: el.id,
        newContent: el.content,
        newStyles: el.styles,
      }));

      // Call edge function to apply changes via AI
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      let updatedFiles = projectFiles;

      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/visual-edits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
          body: JSON.stringify({
            changes: changeDetails,
            files: projectFiles,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.files && Object.keys(result.files).length > 0) {
            // Merge AI-modified files with project files
            updatedFiles = { ...projectFiles };
            for (const [path, file] of Object.entries(result.files)) {
              if (updatedFiles[path]) {
                updatedFiles[path] = { ...updatedFiles[path], content: (file as any).content };
              }
            }
          } else {
            // Fallback to local apply
            updatedFiles = applyVisualChanges(projectFiles, changes, parsedElements);
          }
        } else {
          console.warn('Edge function failed, using local apply');
          updatedFiles = applyVisualChanges(projectFiles, changes, parsedElements);
        }
      } catch (fetchError) {
        console.warn('Edge function unavailable, using local apply:', fetchError);
        updatedFiles = applyVisualChanges(projectFiles, changes, parsedElements);
      }

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
    <div className="w-80 border-r border-border bg-card flex flex-col h-full">
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
  );
};
