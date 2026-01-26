import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Type, Palette, AlignLeft, AlignCenter, AlignRight, AlignJustify, Save, ChevronDown, Bold, Italic, Underline } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextElement {
  id: string;
  text: string;
  selector: string;
  originalText: string;
  styles: {
    color: string;
    fontSize: string;
    fontWeight: string;
    fontStyle: string;
    textAlign: string;
    textDecoration: string;
    fontFamily: string;
  };
}

interface VisualEditModeProps {
  projectFiles: Record<string, { name: string; path: string; content: string; language: string }>;
  onSave: (changes: { elementId: string; newText: string; newStyles: TextElement['styles'] }[]) => void;
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
  const [selectedElement, setSelectedElement] = useState<TextElement | null>(null);
  const [editedElements, setEditedElements] = useState<Map<string, TextElement>>(new Map());
  const [previewHtml, setPreviewHtml] = useState<string>('');
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // Generate preview HTML from project files
  useEffect(() => {
    const appFile = Object.values(projectFiles).find(f => 
      f.path.includes('App.tsx') || f.path.includes('App.jsx')
    );
    
    if (appFile) {
      // Create a simplified preview
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    [data-visual-edit]:hover {
      outline: 2px solid #3b82f6 !important;
      outline-offset: 2px;
      cursor: pointer;
    }
    [data-visual-edit].selected {
      outline: 2px solid #8b5cf6 !important;
      outline-offset: 2px;
    }
  </style>
</head>
<body>
  <div id="preview-root">
    <!-- Content will be injected here -->
    <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8">
      <h1 data-visual-edit="h1-main" class="text-5xl font-bold mb-4">Welcome to Your Website</h1>
      <p data-visual-edit="p-subtitle" class="text-xl text-gray-300 mb-8">Click on any text to edit it</p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-white/10 rounded-xl p-6">
          <h3 data-visual-edit="card-1-title" class="text-2xl font-semibold mb-2">Feature One</h3>
          <p data-visual-edit="card-1-desc" class="text-gray-400">Description of your first amazing feature</p>
        </div>
        <div class="bg-white/10 rounded-xl p-6">
          <h3 data-visual-edit="card-2-title" class="text-2xl font-semibold mb-2">Feature Two</h3>
          <p data-visual-edit="card-2-desc" class="text-gray-400">Description of your second amazing feature</p>
        </div>
        <div class="bg-white/10 rounded-xl p-6">
          <h3 data-visual-edit="card-3-title" class="text-2xl font-semibold mb-2">Feature Three</h3>
          <p data-visual-edit="card-3-desc" class="text-gray-400">Description of your third amazing feature</p>
        </div>
      </div>
      <button data-visual-edit="cta-button" class="mt-8 bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg font-semibold text-lg">
        Get Started Now
      </button>
    </div>
  </div>
</body>
</html>`;
      setPreviewHtml(htmlContent);
    }
  }, [projectFiles]);

  const handleElementClick = useCallback((elementId: string, text: string) => {
    const existingEdit = editedElements.get(elementId);
    
    setSelectedElement({
      id: elementId,
      text: existingEdit?.text || text,
      selector: elementId,
      originalText: text,
      styles: existingEdit?.styles || {
        color: '#ffffff',
        fontSize: '16px',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textAlign: 'left',
        textDecoration: 'none',
        fontFamily: 'inherit',
      },
    });
  }, [editedElements]);

  const updateElementStyle = (property: keyof TextElement['styles'], value: string) => {
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

  const updateElementText = (text: string) => {
    if (!selectedElement) return;
    
    const updated = {
      ...selectedElement,
      text,
    };
    
    setSelectedElement(updated);
    setEditedElements(prev => new Map(prev).set(updated.id, updated));
  };

  const handleSave = () => {
    const changes = Array.from(editedElements.values()).map(el => ({
      elementId: el.id,
      newText: el.text,
      newStyles: el.styles,
    }));
    onSave(changes);
  };

  const handleIframeLoad = (iframe: HTMLIFrameElement | null) => {
    if (!iframe) return;
    
    const doc = iframe.contentDocument;
    if (!doc) return;
    
    // Add click handlers to editable elements
    doc.querySelectorAll('[data-visual-edit]').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = el.getAttribute('data-visual-edit') || '';
        const text = el.textContent || '';
        handleElementClick(id, text);
        
        // Update selection visual
        doc.querySelectorAll('.selected').forEach(sel => sel.classList.remove('selected'));
        el.classList.add('selected');
      });
    });
  };

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <Type className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">Visual Edit Mode</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          <iframe
            ref={handleIframeLoad}
            srcDoc={previewHtml}
            className="w-full h-full border-none"
            title="Visual Edit Preview"
          />
        </div>

        {/* Edit Panel */}
        <AnimatePresence>
          {selectedElement && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-border bg-card overflow-y-auto"
            >
              <div className="p-4 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Edit Element</h3>
                  <button
                    onClick={() => setSelectedElement(null)}
                    className="p-1 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {/* Text Content */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Text Content</label>
                  <textarea
                    value={selectedElement.text}
                    onChange={(e) => updateElementText(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-border bg-background text-foreground resize-none"
                    rows={3}
                  />
                </div>

                {/* Font Family */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Font Family</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowFontDropdown(!showFontDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <span className="text-sm">
                        {fontOptions.find(f => f.value === selectedElement.styles.fontFamily)?.label || 'Default'}
                      </span>
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
                  <label className="text-sm font-medium text-foreground">Font Size</label>
                  <div className="relative">
                    <button
                      onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border bg-background text-foreground"
                    >
                      <span className="text-sm">
                        {fontSizeOptions.find(s => s.value === selectedElement.styles.fontSize)?.label || 'Base'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <AnimatePresence>
                      {showSizeDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden max-h-48 overflow-y-auto"
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
                              {size.label} ({size.value})
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Text Color */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Text Color</label>
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

                {/* Text Style */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Text Style</label>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateElementStyle('fontWeight', selectedElement.styles.fontWeight === 'bold' ? 'normal' : 'bold')}
                      className={`p-2 rounded-lg border transition-colors ${
                        selectedElement.styles.fontWeight === 'bold' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElementStyle('fontStyle', selectedElement.styles.fontStyle === 'italic' ? 'normal' : 'italic')}
                      className={`p-2 rounded-lg border transition-colors ${
                        selectedElement.styles.fontStyle === 'italic' 
                          ? 'bg-primary text-primary-foreground border-primary' 
                          : 'border-border hover:bg-secondary'
                      }`}
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => updateElementStyle('textDecoration', selectedElement.styles.textDecoration === 'underline' ? 'none' : 'underline')}
                      className={`p-2 rounded-lg border transition-colors ${
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
                  <label className="text-sm font-medium text-foreground">Alignment</label>
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
                        className={`p-2 rounded-lg border transition-colors ${
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

                {/* Preview */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Preview</label>
                  <div className="p-4 rounded-lg border border-border bg-secondary/50">
                    <p
                      style={{
                        color: selectedElement.styles.color,
                        fontSize: selectedElement.styles.fontSize,
                        fontWeight: selectedElement.styles.fontWeight,
                        fontStyle: selectedElement.styles.fontStyle,
                        textAlign: selectedElement.styles.textAlign as any,
                        textDecoration: selectedElement.styles.textDecoration,
                        fontFamily: selectedElement.styles.fontFamily,
                      }}
                    >
                      {selectedElement.text}
                    </p>
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
          className="absolute bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-card border border-border rounded-full shadow-lg"
        >
          <p className="text-sm text-muted-foreground">
            <span className="text-primary font-medium">Click</span> on any text element to edit it
          </p>
        </motion.div>
      )}
    </div>
  );
};
