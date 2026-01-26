import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Save, ChevronDown, Bold, Italic, Underline, Image as ImageIcon, 
  Upload, RotateCcw, Plus, Minus, Palette, MousePointer,
  FileCode, Check, Smartphone, Monitor, Tablet
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { SandpackPreview, SandpackProvider } from '@codesandbox/sandpack-react';
import type { ProjectFile } from '@/types';

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
  selector?: string;
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
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deviceView, setDeviceView] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [hoveredElement, setHoveredElement] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert project files to Sandpack format
  const sandpackFiles = React.useMemo(() => {
    const files: Record<string, { code: string }> = {};
    Object.entries(projectFiles).forEach(([path, file]) => {
      // Sandpack needs files with / prefix
      const sandpackPath = path.startsWith('/') ? path : `/${path}`;
      files[sandpackPath] = { code: file.content };
    });
    return files;
  }, [projectFiles]);

  // Demo elements for testing when no project files
  const demoElements: SelectedElement[] = [
    {
      id: 'hero-title',
      type: 'text',
      content: 'Welcome to Your Amazing App',
      originalContent: 'Welcome to Your Amazing App',
      styles: { ...defaultStyles, color: '#ffffff', fontSize: '48px', fontWeight: 'bold', textAlign: 'center' },
      originalStyles: { ...defaultStyles, color: '#ffffff', fontSize: '48px', fontWeight: 'bold', textAlign: 'center' },
    },
    {
      id: 'hero-subtitle',
      type: 'text',
      content: 'Build something incredible today with our powerful platform',
      originalContent: 'Build something incredible today with our powerful platform',
      styles: { ...defaultStyles, color: '#a1a1aa', fontSize: '20px', textAlign: 'center' },
      originalStyles: { ...defaultStyles, color: '#a1a1aa', fontSize: '20px', textAlign: 'center' },
    },
    {
      id: 'cta-button',
      type: 'button',
      content: 'Get Started Free',
      originalContent: 'Get Started Free',
      styles: { ...defaultStyles, color: '#ffffff', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#6366f1', borderRadius: '8px', padding: '12px 24px' },
      originalStyles: { ...defaultStyles, color: '#ffffff', fontSize: '16px', fontWeight: 'bold', backgroundColor: '#6366f1', borderRadius: '8px', padding: '12px 24px' },
    },
    {
      id: 'feature-1',
      type: 'text',
      content: 'Fast Performance',
      originalContent: 'Fast Performance',
      styles: { ...defaultStyles, color: '#ffffff', fontSize: '24px', fontWeight: 'bold' },
      originalStyles: { ...defaultStyles, color: '#ffffff', fontSize: '24px', fontWeight: 'bold' },
    },
    {
      id: 'feature-2',
      type: 'text',
      content: 'Modern Design',
      originalContent: 'Modern Design',
      styles: { ...defaultStyles, color: '#ffffff', fontSize: '24px', fontWeight: 'bold' },
      originalStyles: { ...defaultStyles, color: '#ffffff', fontSize: '24px', fontWeight: 'bold' },
    },
  ];

  const handleElementSelect = (element: SelectedElement) => {
    const existingEdit = editedElements.get(element.id);
    setSelectedElement(existingEdit || element);
  };

  const updateElementStyle = (property: keyof ElementStyles, value: string) => {
    if (!selectedElement) return;
    
    const updated = {
      ...selectedElement,
      styles: {
        ...selectedElement.styles,
        [property]: value,
      },
    };
    
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  };

  const updateElementContent = (content: string) => {
    if (!selectedElement) return;
    
    const updated = {
      ...selectedElement,
      content,
    };
    
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const changes = Array.from(editedElements.values()).map(el => ({
        elementId: el.id,
        newContent: el.content,
        newStyles: el.styles,
      }));

      const summary = `Visual Edit: ${changes.length} elements updated`;
      onSave(changes, projectFiles, summary);
    } catch (error) {
      console.error('Error saving visual changes:', error);
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
  };

  const getChangesCount = () => editedElements.size;

  const getDeviceWidth = () => {
    switch (deviceView) {
      case 'mobile': return 'w-[375px]';
      case 'tablet': return 'w-[768px]';
      default: return 'w-full';
    }
  };

  return (
    <div className="flex h-full bg-background">
      {/* Left Panel - Editing Options */}
      <div className="w-80 border-r border-border bg-card flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Type className="w-5 h-5 text-primary" />
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

        {/* Elements List */}
        <div className="flex-1 overflow-auto p-4">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Editable Elements
          </div>
          
          <div className="space-y-2">
            {demoElements.map((element) => {
              const isSelected = selectedElement?.id === element.id;
              const wasEdited = editedElements.has(element.id);
              
              return (
                <button
                  key={element.id}
                  onClick={() => handleElementSelect(element)}
                  onMouseEnter={() => setHoveredElement(element.id)}
                  onMouseLeave={() => setHoveredElement(null)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/10' 
                      : wasEdited 
                        ? 'border-emerald-500/50 bg-emerald-500/5' 
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {element.type === 'text' && <Type className="w-3.5 h-3.5 text-primary" />}
                    {element.type === 'button' && <div className="w-3.5 h-3.5 bg-primary rounded text-[8px] flex items-center justify-center text-white font-bold">B</div>}
                    {element.type === 'image' && <ImageIcon className="w-3.5 h-3.5 text-primary" />}
                    <span className="text-xs font-medium text-muted-foreground capitalize">{element.type}</span>
                    {wasEdited && <Check className="w-3 h-3 text-emerald-400 ml-auto" />}
                  </div>
                  <p className="text-sm text-foreground truncate">
                    {editedElements.get(element.id)?.content || element.content}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Edit Controls - Show when element selected */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-border overflow-hidden"
            >
              <div className="p-4 space-y-4 max-h-[50vh] overflow-auto">
                {/* Element Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground capitalize">{selectedElement.type}</span>
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
                    rows={2}
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
                      <span>{fontOptions.find(f => f.value === selectedElement.styles.fontFamily)?.label || 'Default'}</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {showFontDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute bottom-full left-0 right-0 mb-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
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

                {/* Color */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={selectedElement.styles.color}
                      onChange={(e) => updateElementStyle('color', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                    />
                    <input
                      type="text"
                      value={selectedElement.styles.color}
                      onChange={(e) => updateElementStyle('color', e.target.value)}
                      className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono"
                    />
                  </div>
                </div>

                {/* Background (for buttons) */}
                {selectedElement.type === 'button' && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">Background</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selectedElement.styles.backgroundColor || '#6366f1'}
                        onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={selectedElement.styles.backgroundColor || ''}
                        onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                        className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Text Style */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Style</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateElementStyle('fontWeight', selectedElement.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        selectedElement.styles.fontWeight === 'bold' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElementStyle('fontStyle', selectedElement.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        selectedElement.styles.fontStyle === 'italic' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElementStyle('textDecoration', selectedElement.styles.textDecoration === 'underline' ? 'none' : 'underline')}
                      className={`p-2.5 rounded-lg border transition-colors ${
                        selectedElement.styles.textDecoration === 'underline' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Underline className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Alignment */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Align</label>
                  <div className="flex items-center gap-2">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight },
                      { value: 'justify', icon: AlignJustify },
                    ].map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => updateElementStyle('textAlign', value)}
                        className={`p-2.5 rounded-lg border transition-colors ${
                          selectedElement.styles.textAlign === value 
                            ? 'bg-primary text-primary-foreground border-primary' 
                            : 'border-border hover:bg-secondary'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Save Button */}
        <div className="p-4 border-t border-border">
          <Button 
            onClick={handleSave} 
            className="w-full gap-2"
            disabled={getChangesCount() === 0 || isSaving}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save & Create Version
          </Button>
        </div>
      </div>

      {/* Right Panel - Live Preview */}
      <div className="flex-1 flex flex-col bg-muted/30">
        {/* Preview Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <MousePointer className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-foreground">Live Preview</span>
            <span className="text-xs text-muted-foreground">• Click elements to edit</span>
          </div>
          
          {/* Device Toggle */}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setDeviceView('desktop')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'desktop' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Desktop"
            >
              <Monitor className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('tablet')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'tablet' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Tablet"
            >
              <Tablet className="w-4 h-4" />
            </button>
            <button
              onClick={() => setDeviceView('mobile')}
              className={`p-2 rounded-md transition-colors ${
                deviceView === 'mobile' ? 'bg-accent text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Mobile"
            >
              <Smartphone className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-6 flex justify-center">
          <div className={`${getDeviceWidth()} h-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-lg shadow-2xl overflow-hidden transition-all duration-300`}>
            {/* Decorative background */}
            <div className="relative h-full overflow-auto">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
              </div>

              {/* Preview Elements */}
              <div className="relative p-8 space-y-8">
                {/* Hero Section */}
                <div className="text-center space-y-6 py-16">
                  {demoElements.slice(0, 2).map((element) => {
                    const displayElement = editedElements.get(element.id) || element;
                    const isSelected = selectedElement?.id === element.id;
                    const isHovered = hoveredElement === element.id;
                    
                    return (
                      <motion.div
                        key={element.id}
                        onClick={() => handleElementSelect(element)}
                        className={`cursor-pointer transition-all rounded-lg ${
                          isSelected 
                            ? 'ring-2 ring-primary ring-offset-4 ring-offset-transparent' 
                            : isHovered 
                              ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-transparent' 
                              : ''
                        }`}
                        whileHover={{ scale: 1.02 }}
                        animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                      >
                        {element.id === 'hero-title' ? (
                          <h1
                            style={{
                              color: displayElement.styles.color,
                              fontSize: displayElement.styles.fontSize,
                              fontWeight: displayElement.styles.fontWeight,
                              fontStyle: displayElement.styles.fontStyle,
                              textAlign: displayElement.styles.textAlign as any,
                              fontFamily: displayElement.styles.fontFamily,
                            }}
                          >
                            {displayElement.content}
                          </h1>
                        ) : (
                          <p
                            style={{
                              color: displayElement.styles.color,
                              fontSize: displayElement.styles.fontSize,
                              fontWeight: displayElement.styles.fontWeight,
                              fontStyle: displayElement.styles.fontStyle,
                              textAlign: displayElement.styles.textAlign as any,
                              fontFamily: displayElement.styles.fontFamily,
                            }}
                          >
                            {displayElement.content}
                          </p>
                        )}
                      </motion.div>
                    );
                  })}

                  {/* CTA Button */}
                  {demoElements.filter(e => e.type === 'button').map((element) => {
                    const displayElement = editedElements.get(element.id) || element;
                    const isSelected = selectedElement?.id === element.id;
                    const isHovered = hoveredElement === element.id;
                    
                    return (
                      <motion.div
                        key={element.id}
                        onClick={() => handleElementSelect(element)}
                        className={`inline-block cursor-pointer transition-all rounded-lg ${
                          isSelected 
                            ? 'ring-2 ring-primary ring-offset-4 ring-offset-transparent' 
                            : isHovered 
                              ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-transparent' 
                              : ''
                        }`}
                        whileHover={{ scale: 1.05 }}
                        animate={isSelected ? { scale: 1.05 } : { scale: 1 }}
                      >
                        <button
                          style={{
                            color: displayElement.styles.color,
                            fontSize: displayElement.styles.fontSize,
                            fontWeight: displayElement.styles.fontWeight,
                            backgroundColor: displayElement.styles.backgroundColor,
                            padding: displayElement.styles.padding,
                            borderRadius: displayElement.styles.borderRadius,
                          }}
                          className="pointer-events-none"
                        >
                          {displayElement.content}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Features Section */}
                <div className="grid grid-cols-2 gap-6 py-8">
                  {demoElements.slice(3).map((element) => {
                    const displayElement = editedElements.get(element.id) || element;
                    const isSelected = selectedElement?.id === element.id;
                    const isHovered = hoveredElement === element.id;
                    
                    return (
                      <motion.div
                        key={element.id}
                        onClick={() => handleElementSelect(element)}
                        className={`cursor-pointer p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 transition-all ${
                          isSelected 
                            ? 'ring-2 ring-primary ring-offset-4 ring-offset-transparent' 
                            : isHovered 
                              ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-transparent' 
                              : ''
                        }`}
                        whileHover={{ scale: 1.03, y: -5 }}
                        animate={isSelected ? { scale: 1.03, y: -5 } : { scale: 1, y: 0 }}
                      >
                        <h3
                          style={{
                            color: displayElement.styles.color,
                            fontSize: displayElement.styles.fontSize,
                            fontWeight: displayElement.styles.fontWeight,
                            fontStyle: displayElement.styles.fontStyle,
                            textAlign: displayElement.styles.textAlign as any,
                            fontFamily: displayElement.styles.fontFamily,
                          }}
                        >
                          {displayElement.content}
                        </h3>
                        <p className="text-gray-400 text-sm mt-2">
                          Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
