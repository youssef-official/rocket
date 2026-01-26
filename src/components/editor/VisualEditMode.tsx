import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, 
  Save, ChevronDown, Bold, Italic, Underline, Image as ImageIcon, 
  Move, Upload, Trash2, RotateCcw, Plus, Minus, GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

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
  type: 'text' | 'image' | 'button' | 'container';
  content: string;
  originalContent: string;
  styles: ElementStyles;
  position: { x: number; y: number };
  size: { width: number; height: number };
  src?: string; // For images
}

interface VisualEditModeProps {
  projectFiles: Record<string, { name: string; path: string; content: string; language: string }>;
  onSave: (changes: { elementId: string; newContent: string; newStyles: ElementStyles; position?: { x: number; y: number } }[]) => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize demo elements from project
  useEffect(() => {
    const demoElements: EditableElement[] = [
      {
        id: 'hero-title',
        type: 'text',
        content: 'Welcome to Your Amazing Website',
        originalContent: 'Welcome to Your Amazing Website',
        styles: {
          color: '#ffffff',
          fontSize: '48px',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'inherit',
        },
        position: { x: 50, y: 80 },
        size: { width: 600, height: 60 },
      },
      {
        id: 'hero-subtitle',
        type: 'text',
        content: 'Build something incredible today',
        originalContent: 'Build something incredible today',
        styles: {
          color: '#a0aec0',
          fontSize: '20px',
          fontWeight: 'normal',
          fontStyle: 'normal',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'inherit',
        },
        position: { x: 50, y: 150 },
        size: { width: 400, height: 30 },
      },
      {
        id: 'hero-image',
        type: 'image',
        content: '',
        originalContent: '',
        src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&h=300&fit=crop',
        styles: {
          color: '',
          fontSize: '',
          fontWeight: '',
          fontStyle: '',
          textAlign: '',
          textDecoration: '',
          fontFamily: '',
          borderRadius: '12px',
          opacity: '1',
        },
        position: { x: 50, y: 200 },
        size: { width: 400, height: 250 },
      },
      {
        id: 'cta-button',
        type: 'button',
        content: 'Get Started',
        originalContent: 'Get Started',
        styles: {
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'inherit',
          backgroundColor: '#6366f1',
          padding: '12px 32px',
          borderRadius: '8px',
        },
        position: { x: 50, y: 480 },
        size: { width: 160, height: 48 },
      },
      {
        id: 'feature-card-1',
        type: 'container',
        content: 'Fast Performance',
        originalContent: 'Fast Performance',
        styles: {
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'inherit',
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '24px',
          borderRadius: '16px',
        },
        position: { x: 50, y: 560 },
        size: { width: 200, height: 120 },
      },
      {
        id: 'feature-card-2',
        type: 'container',
        content: 'Modern Design',
        originalContent: 'Modern Design',
        styles: {
          color: '#ffffff',
          fontSize: '18px',
          fontWeight: 'bold',
          fontStyle: 'normal',
          textAlign: 'center',
          textDecoration: 'none',
          fontFamily: 'inherit',
          backgroundColor: 'rgba(255,255,255,0.1)',
          padding: '24px',
          borderRadius: '16px',
        },
        position: { x: 280, y: 560 },
        size: { width: 200, height: 120 },
      },
    ];
    
    setElements(demoElements);
  }, [projectFiles]);

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

  const handleSave = () => {
    const changes = Array.from(editedElements.values()).map(el => ({
      elementId: el.id,
      newContent: el.type === 'image' ? el.src || '' : el.content,
      newStyles: el.styles,
      position: el.position,
    }));
    onSave(changes);
  };

  const resetElement = () => {
    if (!selectedElement) return;
    
    const original = elements.find(el => el.id === selectedElement.id);
    if (original) {
      const reset = { ...original };
      setSelectedElement(reset);
      setElements(prev => prev.map(el => el.id === reset.id ? reset : el));
      editedElements.delete(reset.id);
      setEditedElements(new Map(editedElements));
    }
  };

  const getChangesCount = () => editedElements.size;

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
          <Button size="sm" onClick={handleSave} className="gap-2">
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

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
                    width: element.type === 'text' ? 'auto' : element.size.width,
                    minWidth: element.type === 'text' ? element.size.width : undefined,
                  }}
                  onClick={(e) => handleElementClick(element, e)}
                  onMouseDown={(e) => handleDragStart(element, e)}
                  whileHover={{ scale: editMode === 'select' ? 1.02 : 1 }}
                >
                  {editMode === 'drag' && (
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 p-1 bg-primary/80 rounded cursor-grab">
                      <GripVertical className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  {element.type === 'text' && (
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
                  
                  {element.type === 'image' && (
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
                        padding: element.styles.padding,
                        borderRadius: element.styles.borderRadius,
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
                        padding: element.styles.padding,
                        borderRadius: element.styles.borderRadius,
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
                    {selectedElement.type === 'text' && <Type className="w-4 h-4 text-primary" />}
                    {selectedElement.type === 'image' && <ImageIcon className="w-4 h-4 text-primary" />}
                    {selectedElement.type === 'button' && <div className="w-4 h-4 bg-primary rounded text-[10px] flex items-center justify-center text-white font-bold">B</div>}
                    {selectedElement.type === 'container' && <div className="w-4 h-4 border-2 border-primary rounded" />}
                    <h3 className="font-semibold text-foreground capitalize">{selectedElement.type}</h3>
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
                {(selectedElement.type === 'text' || selectedElement.type === 'button' || selectedElement.type === 'container') && (
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
                          const updated = { ...selectedElement, position: { ...selectedElement.position, x: parseInt(e.target.value) || 0 } };
                          setSelectedElement(updated);
                          setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
                          setEditedElements(prev => new Map(prev).set(updated.id, updated));
                        }}
                        className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4">Y</span>
                      <input
                        type="number"
                        value={Math.round(selectedElement.position.y)}
                        onChange={(e) => {
                          const updated = { ...selectedElement, position: { ...selectedElement.position, y: parseInt(e.target.value) || 0 } };
                          setSelectedElement(updated);
                          setElements(prev => prev.map(el => el.id === updated.id ? updated : el));
                          setEditedElements(prev => new Map(prev).set(updated.id, updated));
                        }}
                        className="flex-1 px-2 py-1.5 rounded border border-border bg-background text-foreground text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      {!selectedElement && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 bg-card border border-border rounded-full shadow-lg"
        >
          <p className="text-sm text-muted-foreground">
            {editMode === 'select' ? (
              <>
                <span className="text-primary font-medium">Click</span> to edit • 
                <span className="text-primary font-medium ml-1">Switch to Move</span> to drag elements
              </>
            ) : (
              <>
                <span className="text-primary font-medium">Drag</span> elements to reposition • 
                <span className="text-primary font-medium ml-1">Switch to Edit</span> to modify content
              </>
            )}
          </p>
        </motion.div>
      )}
    </div>
  );
};
