import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Save, ChevronDown, Bold, Italic, Underline, Image as ImageIcon, 
  Move, Upload, Trash2, RotateCcw, Plus, Minus, GripVertical,
  FileCode, Check, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { parseProjectElements, applyVisualChanges, generateChangeSummary } from '@/services/visualEditService';
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
  transform?: string;
}

interface EditableElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'container' | 'heading' | 'paragraph' | 'link';
  tagName?: string;
  content: string;
  originalContent: string;
  styles: ElementStyles;
  originalStyles: ElementStyles;
  position: { x: number; y: number };
  size: { width: number; height: number };
  src?: string;
  originalSrc?: string;
  filePath?: string;
  lineNumber?: number;
  className?: string;
}

interface VisualEditModeProps {
  projectFiles: Record<string, ProjectFile>;
  onSave: (
    changes: { elementId: string; newContent: string; newStyles: ElementStyles; position?: { x: number; y: number } }[],
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

const fontSizeOptions = [
  { label: 'XS', value: '12px' },
  { label: 'SM', value: '14px' },
  { label: 'Base', value: '16px' },
  { label: 'LG', value: '18px' },
  { label: 'XL', value: '20px' },
  { label: '2XL', value: '24px' },
  { label: '3XL', value: '30px' },
  { label: '4XL', value: '36px' },
  { label: '5XL', value: '48px' },
  { label: '6XL', value: '60px' },
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
  const [selectedElement, setSelectedElement] = useState<EditableElement | null>(null);
  const [editedElements, setEditedElements] = useState<Map<string, EditableElement>>(new Map());
  const [elements, setElements] = useState<EditableElement[]>([]);
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [editMode, setEditMode] = useState<'select' | 'drag'>('select');
  const [isSaving, setIsSaving] = useState(false);
  const [parsedElements, setParsedElements] = useState<any[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Parse project files to find editable elements
  useEffect(() => {
    const parsed = parseProjectElements(projectFiles);
    setParsedElements(parsed);
    
    // Convert parsed elements to editable elements
    const editableElements: EditableElement[] = parsed.map((el, index) => {
      const baseStyles: ElementStyles = {
        color: el.styles?.color || '#ffffff',
        fontSize: el.styles?.fontSize || (el.type === 'heading' ? '48px' : '16px'),
        fontWeight: el.styles?.fontWeight || (el.type === 'heading' ? 'bold' : 'normal'),
        fontStyle: el.styles?.fontStyle || 'normal',
        textAlign: el.styles?.textAlign || 'left',
        textDecoration: el.styles?.textDecoration || 'none',
        fontFamily: el.styles?.fontFamily || 'inherit',
        backgroundColor: el.styles?.backgroundColor,
        borderRadius: el.styles?.borderRadius,
        opacity: el.styles?.opacity || '1',
      };

      return {
        id: el.id,
        type: el.type as any,
        tagName: el.tagName,
        content: el.content,
        originalContent: el.content,
        styles: { ...baseStyles },
        originalStyles: { ...baseStyles },
        position: { x: 50, y: 50 + (index * 80) },
        size: { width: 500, height: el.type === 'heading' ? 60 : 40 },
        src: el.src,
        originalSrc: el.src,
        filePath: el.filePath,
        lineNumber: el.startLine,
        className: el.className,
      };
    });

    // If no elements found, show demo elements
    if (editableElements.length === 0) {
      setElements(getDemoElements());
    } else {
      setElements(editableElements);
    }
  }, [projectFiles]);

  const getDemoElements = (): EditableElement[] => [
    {
      id: 'demo-title',
      type: 'heading',
      content: 'Welcome to Visual Editor',
      originalContent: 'Welcome to Visual Editor',
      styles: { ...defaultStyles, color: '#ffffff', fontSize: '48px', fontWeight: 'bold', textAlign: 'center' },
      originalStyles: { ...defaultStyles, color: '#ffffff', fontSize: '48px', fontWeight: 'bold', textAlign: 'center' },
      position: { x: 50, y: 80 },
      size: { width: 600, height: 60 },
    },
    {
      id: 'demo-subtitle',
      type: 'paragraph',
      content: 'Click on any element to edit it. Changes will be saved to your project files.',
      originalContent: 'Click on any element to edit it. Changes will be saved to your project files.',
      styles: { ...defaultStyles, color: '#a0aec0', fontSize: '20px', textAlign: 'center' },
      originalStyles: { ...defaultStyles, color: '#a0aec0', fontSize: '20px', textAlign: 'center' },
      position: { x: 50, y: 160 },
      size: { width: 600, height: 40 },
    },
  ];

  const handleElementClick = (element: EditableElement, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editMode === 'select') {
      const existingEdit = editedElements.get(element.id);
      setSelectedElement(existingEdit || element);
    }
  };

  const handleDragStart = (element: EditableElement, e: React.MouseEvent) => {
    if (editMode !== 'drag') return;
    e.preventDefault();
    setIsDragging(true);
    setSelectedElement(element);
    
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !selectedElement || !containerRef.current) return;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    const newX = e.clientX - containerRect.left - dragOffset.x;
    const newY = e.clientY - containerRect.top - dragOffset.y;
    
    const updated = {
      ...selectedElement,
      position: { x: Math.max(0, newX), y: Math.max(0, newY) },
    };
    
    setSelectedElement(updated);
    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  }, [isDragging, selectedElement, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMove);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDragMove);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDragMove, handleDragEnd]);

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
    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  };

  const updateElementContent = (content: string) => {
    if (!selectedElement) return;
    
    const updated = {
      ...selectedElement,
      content,
    };
    
    setSelectedElement(updated);
    setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  };

  const updateElementImage = async (file: File) => {
    if (!selectedElement || selectedElement.type !== 'image') return;
    
    setIsUploading(true);
    try {
      const fileName = `visual-edit/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('chat-images')
        .upload(fileName, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      const updated = {
        ...selectedElement,
        src: urlData.publicUrl,
      };
      
      setSelectedElement(updated);
      setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
      setEditedElements(prev => new Map(prev).set(updated.id, updated));
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      const changes = Array.from(editedElements.values()).map(el => ({
        elementId: el.id,
        newContent: el.type === 'image' ? el.src || '' : el.content,
        newStyles: el.styles,
        position: el.position,
        filePath: el.filePath,
        lineNumber: el.lineNumber,
      }));

      // Apply changes to actual project files
      const updatedFiles = applyVisualChanges(projectFiles, changes, parsedElements);
      
      // Generate summary for version name
      const summary = generateChangeSummary(changes, parsedElements);

      onSave(changes, updatedFiles, summary);
    } catch (error) {
      console.error('Error saving visual changes:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const resetElement = () => {
    if (!selectedElement) return;
    
    const reset: EditableElement = {
      ...selectedElement,
      content: selectedElement.originalContent,
      styles: { ...selectedElement.originalStyles },
      src: selectedElement.originalSrc,
    };
    
    setSelectedElement(reset);
    setElements(prev => prev.map(el => el.id === reset.id ? reset : el));
    editedElements.delete(reset.id);
    setEditedElements(new Map(editedElements));
  };

  const getChangesCount = () => editedElements.size;

  const getAffectedFiles = (): string[] => {
    const files = new Set<string>();
    editedElements.forEach(el => {
      if (el.filePath) files.add(el.filePath);
    });
    return Array.from(files);
  };

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'heading':
        return <span className="text-xs font-bold">H</span>;
      case 'paragraph':
      case 'text':
        return <Type className="w-4 h-4" />;
      case 'image':
        return <ImageIcon className="w-4 h-4" />;
      case 'button':
        return <span className="text-xs font-bold">B</span>;
      case 'link':
        return <span className="text-xs font-bold">A</span>;
      default:
        return <div className="w-4 h-4 border-2 border-current rounded" />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Visual Edit Mode</span>
          {getChangesCount() > 0 && (
            <span className="px-2 py-0.5 text-xs bg-primary/20 text-primary rounded-full">
              {getChangesCount()} changes
            </span>
          )}
          {getAffectedFiles().length > 0 && (
            <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
              <FileCode className="w-3 h-3" />
              {getAffectedFiles().length} files
            </span>
          )}
        </div>
        
        {/* Mode Toggle */}
        <div className="flex items-center gap-2 bg-secondary rounded-full p-1">
          <button
            onClick={() => setEditMode('select')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              editMode === 'select' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            onClick={() => setEditMode('drag')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              editMode === 'drag' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Move className="w-3.5 h-3.5" />
            Move
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            size="sm" 
            onClick={handleSave} 
            className="gap-2"
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

      {/* Info Banner */}
      {getAffectedFiles().length > 0 && (
        <div className="px-4 py-2 bg-green-500/10 border-b border-green-500/20 flex items-center gap-2 text-sm">
          <Check className="w-4 h-4 text-green-400" />
          <span className="text-green-400">
            Changes will be applied to: {getAffectedFiles().join(', ')}
          </span>
        </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 overflow-auto bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative"
          onClick={() => setSelectedElement(null)}
          style={{ cursor: editMode === 'drag' ? 'grab' : 'default' }}
        >
          {/* Decorative background */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          </div>

          {/* Editable Elements */}
          <div className="relative min-h-full p-8">
            {elements.map((element) => {
              const isSelected = selectedElement?.id === element.id;
              const wasEdited = editedElements.has(element.id);
              
              return (
                <motion.div
                  key={element.id}
                  className={`absolute cursor-pointer transition-all ${
                    isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-transparent' : ''
                  } ${wasEdited ? 'ring-1 ring-green-500/50' : ''}`}
                  style={{
                    left: element.position.x,
                    top: element.position.y,
                    width: element.type === 'text' || element.type === 'heading' || element.type === 'paragraph' ? 'auto' : element.size.width,
                    minWidth: element.type === 'text' || element.type === 'heading' || element.type === 'paragraph' ? element.size.width : undefined,
                  }}
                  onClick={(e) => handleElementClick(element, e)}
                  onMouseDown={(e) => handleDragStart(element, e)}
                  whileHover={{ scale: editMode === 'select' ? 1.02 : 1 }}
                >
                  {/* File path indicator */}
                  {element.filePath && isSelected && (
                    <div className="absolute -top-6 left-0 flex items-center gap-1 px-2 py-0.5 bg-black/80 rounded text-xs text-green-400">
                      <FileCode className="w-3 h-3" />
                      {element.filePath}:{element.lineNumber}
                    </div>
                  )}
                  
                  {editMode === 'drag' && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 bg-primary/80 rounded cursor-grab">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {(element.type === 'text' || element.type === 'heading' || element.type === 'paragraph' || element.type === 'link') && (
                    <p
                      style={{
                        color: element.styles.color,
                        fontSize: element.styles.fontSize,
                        fontWeight: element.styles.fontWeight,
                        fontStyle: element.styles.fontStyle,
                        textAlign: element.styles.textAlign as any,
                        textDecoration: element.styles.textDecoration,
                        fontFamily: element.styles.fontFamily,
                      }}
                    >
                      {element.content}
                    </p>
                  )}
                  
                  {element.type === 'image' && element.src && (
                    <img
                      src={element.src}
                      alt="Editable"
                      className="object-cover"
                      style={{
                        width: element.size.width,
                        height: element.size.height,
                        borderRadius: element.styles.borderRadius,
                        opacity: element.styles.opacity,
                      }}
                    />
                  )}
                  
                  {element.type === 'button' && (
                    <button
                      style={{
                        color: element.styles.color,
                        fontSize: element.styles.fontSize,
                        fontWeight: element.styles.fontWeight,
                        backgroundColor: element.styles.backgroundColor,
                        padding: element.styles.padding || '12px 32px',
                        borderRadius: element.styles.borderRadius || '8px',
                      }}
                      className="pointer-events-none"
                    >
                      {element.content}
                    </button>
                  )}
                  
                  {element.type === 'container' && (
                    <div
                      style={{
                        color: element.styles.color,
                        fontSize: element.styles.fontSize,
                        fontWeight: element.styles.fontWeight,
                        backgroundColor: element.styles.backgroundColor,
                        padding: element.styles.padding || '24px',
                        borderRadius: element.styles.borderRadius || '16px',
                        width: element.size.width,
                        height: element.size.height,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {element.content}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Edit Panel */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ x: 320, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 320, opacity: 0 }}
              className="w-80 border-l border-border bg-card overflow-y-auto"
            >
              <div className="p-4 space-y-5">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-primary/20 rounded flex items-center justify-center text-primary">
                      {getElementIcon(selectedElement.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground capitalize">{selectedElement.type}</h3>
                      {selectedElement.tagName && (
                        <span className="text-xs text-muted-foreground">&lt;{selectedElement.tagName}&gt;</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={resetElement}
                      className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                      title="Reset"
                    >
                      <RotateCcw className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => setSelectedElement(null)}
                      className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* File Info */}
                {selectedElement.filePath && (
                  <div className="p-3 bg-secondary/50 rounded-lg space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <FileCode className="w-4 h-4 text-green-400" />
                      <span className="text-foreground font-medium">Source File</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">
                      {selectedElement.filePath}
                    </p>
                    {selectedElement.lineNumber && (
                      <p className="text-xs text-muted-foreground">
                        Line {selectedElement.lineNumber}
                      </p>
                    )}
                  </div>
                )}

                {/* Image Controls */}
                {selectedElement.type === 'image' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Image</label>
                      <div className="relative">
                        <img
                          src={selectedElement.src}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-border"
                        />
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) updateElementImage(file);
                          }}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading}
                          className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg"
                        >
                          {isUploading ? (
                            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <div className="flex items-center gap-2 text-white">
                              <Upload className="w-5 h-5" />
                              <span className="text-sm font-medium">Replace</span>
                            </div>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Border Radius</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={parseInt(selectedElement.styles.borderRadius || '0')}
                          onChange={(e) => updateElementStyle('borderRadius', `${e.target.value}px`)}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {selectedElement.styles.borderRadius || '0px'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Opacity</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={parseFloat(selectedElement.styles.opacity || '1') * 100}
                          onChange={(e) => updateElementStyle('opacity', String(parseInt(e.target.value) / 100))}
                          className="flex-1"
                        />
                        <span className="text-sm text-muted-foreground w-12">
                          {Math.round(parseFloat(selectedElement.styles.opacity || '1') * 100)}%
                        </span>
                      </div>
                    </div>
                  </>
                )}

                {/* Text/Button/Container Controls */}
                {(selectedElement.type !== 'image') && (
                  <>
                    {/* Text Content */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Content</label>
                      <textarea
                        value={selectedElement.content}
                        onChange={(e) => updateElementContent(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none text-sm"
                        rows={2}
                      />
                    </div>

                    {/* Font Family */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Font</label>
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
                              className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden"
                            >
                              {fontOptions.map((font) => (
                                <button
                                  key={font.value}
                                  onClick={() => {
                                    updateElementStyle('fontFamily', font.value);
                                    setShowFontDropdown(false);
                                  }}
                                  className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
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
                      <label className="text-sm font-medium text-foreground">Size</label>
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
                        <div className="relative flex-1">
                          <button
                            onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                            className="w-full flex items-center justify-center px-3 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
                          >
                            {selectedElement.styles.fontSize}
                          </button>
                          <AnimatePresence>
                            {showSizeDropdown && (
                              <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden max-h-40 overflow-y-auto"
                              >
                                {fontSizeOptions.map((size) => (
                                  <button
                                    key={size.value}
                                    onClick={() => {
                                      updateElementStyle('fontSize', size.value);
                                      setShowSizeDropdown(false);
                                    }}
                                    className="w-full px-3 py-2 text-left text-sm hover:bg-secondary transition-colors"
                                  >
                                    {size.label}
                                  </button>
                                ))}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
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

                    {/* Text Color */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Color</label>
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

                    {/* Background Color for buttons/containers */}
                    {(selectedElement.type === 'button' || selectedElement.type === 'container') && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-foreground">Background</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={selectedElement.styles.backgroundColor?.startsWith('rgba') ? '#6366f1' : (selectedElement.styles.backgroundColor || '#6366f1')}
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
                      <label className="text-sm font-medium text-foreground">Style</label>
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

                    {/* Text Alignment */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Align</label>
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
                  </>
                )}

                {/* Position Info */}
                <div className="space-y-2 pt-4 border-t border-border">
                  <label className="text-sm font-medium text-foreground">Position</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">X</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.position.x)}
                        onChange={(e) => {
                          const updated = {
                            ...selectedElement,
                            position: { ...selectedElement.position, x: parseInt(e.target.value) || 0 },
                          };
                          setSelectedElement(updated);
                          setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
                          setEditedElements(prev => new Map(prev).set(updated.id, updated));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">Y</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.position.y)}
                        onChange={(e) => {
                          const updated = {
                            ...selectedElement,
                            position: { ...selectedElement.position, y: parseInt(e.target.value) || 0 },
                          };
                          setSelectedElement(updated);
                          setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
                          setEditedElements(prev => new Map(prev).set(updated.id, updated));
                        }}
                        className="w-full px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
