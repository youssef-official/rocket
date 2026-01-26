/**
 * Visual Edit Service
 * Parses project files and applies visual changes to actual code
 */

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

interface VisualChange {
  elementId: string;
  newContent: string;
  newStyles: ElementStyles;
  position?: { x: number; y: number };
  originalSelector?: string;
  filePath?: string;
  lineNumber?: number;
}

interface ParsedElement {
  id: string;
  type: 'text' | 'image' | 'button' | 'container' | 'heading' | 'paragraph' | 'link';
  tagName: string;
  content: string;
  className?: string;
  filePath: string;
  startLine: number;
  endLine: number;
  rawCode: string;
  styles: Partial<ElementStyles>;
  src?: string;
}

// Parse JSX/TSX content to find editable elements
export function parseProjectElements(files: Record<string, ProjectFile>): ParsedElement[] {
  const elements: ParsedElement[] = [];
  let elementCounter = 0;

  Object.entries(files).forEach(([path, file]) => {
    if (!path.endsWith('.tsx') && !path.endsWith('.jsx')) return;
    if (path.includes('node_modules')) return;

    const lines = file.content.split('\n');
    
    lines.forEach((line, index) => {
      // Find headings (h1-h6)
      const headingMatch = line.match(/<(h[1-6])[^>]*>([^<]*)<\/\1>/);
      if (headingMatch) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'heading',
          tagName: headingMatch[1],
          content: headingMatch[2].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find paragraphs
      const pMatch = line.match(/<p[^>]*>([^<]*)<\/p>/);
      if (pMatch) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'paragraph',
          tagName: 'p',
          content: pMatch[1].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find spans with text
      const spanMatch = line.match(/<span[^>]*>([^<]+)<\/span>/);
      if (spanMatch && spanMatch[1].trim()) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'text',
          tagName: 'span',
          content: spanMatch[1].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find buttons
      const buttonMatch = line.match(/<(Button|button)[^>]*>([^<]*)<\/\1>/i);
      if (buttonMatch) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'button',
          tagName: buttonMatch[1],
          content: buttonMatch[2].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find images
      const imgMatch = line.match(/<img[^>]*src=["']([^"']+)["'][^>]*\/?>/);
      if (imgMatch) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'image',
          tagName: 'img',
          content: '',
          src: imgMatch[1],
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find divs with text content (containers)
      const divMatch = line.match(/<div[^>]*className=["'][^"']*["'][^>]*>([^<]+)<\/div>/);
      if (divMatch && divMatch[1].trim() && !divMatch[1].includes('{')) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'container',
          tagName: 'div',
          content: divMatch[1].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }

      // Find links
      const linkMatch = line.match(/<a[^>]*>([^<]+)<\/a>/);
      if (linkMatch) {
        elements.push({
          id: `element-${elementCounter++}`,
          type: 'link',
          tagName: 'a',
          content: linkMatch[1].trim(),
          filePath: path,
          startLine: index + 1,
          endLine: index + 1,
          rawCode: line,
          styles: extractInlineStyles(line),
          className: extractClassName(line),
        });
      }
    });

    // Parse multi-line elements
    const multiLineElements = parseMultiLineElements(file.content, path);
    elements.push(...multiLineElements.map(el => ({ ...el, id: `element-${elementCounter++}` })));
  });

  return elements;
}

// Parse multi-line JSX elements
function parseMultiLineElements(content: string, filePath: string): Omit<ParsedElement, 'id'>[] {
  const elements: Omit<ParsedElement, 'id'>[] = [];
  const lines = content.split('\n');
  
  // Find JSX text expressions like {`Some text`} or {"Some text"}
  const jsxTextRegex = />\s*\{[`"']([^`"']+)[`"']\}\s*</g;
  let match;
  
  while ((match = jsxTextRegex.exec(content)) !== null) {
    const textContent = match[1];
    const position = match.index;
    const lineNumber = content.substring(0, position).split('\n').length;
    
    if (textContent.trim().length > 0) {
      elements.push({
        type: 'text',
        tagName: 'jsx-text',
        content: textContent,
        filePath,
        startLine: lineNumber,
        endLine: lineNumber,
        rawCode: match[0],
        styles: {},
      });
    }
  }

  return elements;
}

// Extract className from JSX
function extractClassName(line: string): string | undefined {
  const match = line.match(/className=["']([^"']+)["']/);
  return match ? match[1] : undefined;
}

// Extract inline styles from style={{ }} syntax
function extractInlineStyles(line: string): Partial<ElementStyles> {
  const styles: Partial<ElementStyles> = {};
  const styleMatch = line.match(/style=\{\{([^}]+)\}\}/);
  
  if (styleMatch) {
    const styleContent = styleMatch[1];
    
    // Parse style properties
    const colorMatch = styleContent.match(/color:\s*["']?([^,"']+)["']?/);
    if (colorMatch) styles.color = colorMatch[1].trim();
    
    const fontSizeMatch = styleContent.match(/fontSize:\s*["']?([^,"']+)["']?/);
    if (fontSizeMatch) styles.fontSize = fontSizeMatch[1].trim();
    
    const fontWeightMatch = styleContent.match(/fontWeight:\s*["']?([^,"']+)["']?/);
    if (fontWeightMatch) styles.fontWeight = fontWeightMatch[1].trim();
    
    const bgMatch = styleContent.match(/backgroundColor:\s*["']?([^,"']+)["']?/);
    if (bgMatch) styles.backgroundColor = bgMatch[1].trim();
    
    const textAlignMatch = styleContent.match(/textAlign:\s*["']?([^,"']+)["']?/);
    if (textAlignMatch) styles.textAlign = textAlignMatch[1].trim();
  }
  
  return styles;
}

// Apply visual changes to project files
export function applyVisualChanges(
  files: Record<string, ProjectFile>,
  changes: VisualChange[],
  elements: ParsedElement[]
): Record<string, ProjectFile> {
  const updatedFiles = { ...files };
  
  changes.forEach(change => {
    const element = elements.find(el => el.id === change.elementId);
    if (!element) return;
    
    const file = updatedFiles[element.filePath];
    if (!file) return;
    
    const lines = file.content.split('\n');
    const lineIndex = element.startLine - 1;
    
    if (lineIndex < 0 || lineIndex >= lines.length) return;
    
    let updatedLine = lines[lineIndex];
    
    // Update content
    if (change.newContent && element.content !== change.newContent) {
      if (element.type === 'image') {
        // Update image src
        updatedLine = updatedLine.replace(
          /src=["'][^"']+["']/,
          `src="${change.newContent}"`
        );
      } else {
        // Update text content
        updatedLine = updatedLine.replace(element.content, change.newContent);
      }
    }
    
    // Update or add inline styles
    const styleString = generateStyleString(change.newStyles);
    if (styleString) {
      if (updatedLine.includes('style={{')) {
        // Update existing style
        updatedLine = updatedLine.replace(
          /style=\{\{[^}]*\}\}/,
          `style={{${styleString}}}`
        );
      } else {
        // Add new style attribute before closing >
        const tagEndMatch = updatedLine.match(/(\s*)(\/?>)/);
        if (tagEndMatch) {
          const insertPos = updatedLine.lastIndexOf(tagEndMatch[0]);
          updatedLine = 
            updatedLine.substring(0, insertPos) + 
            ` style={{${styleString}}}` + 
            updatedLine.substring(insertPos);
        }
      }
    }
    
    lines[lineIndex] = updatedLine;
    
    updatedFiles[element.filePath] = {
      ...file,
      content: lines.join('\n'),
    };
  });
  
  return updatedFiles;
}

// Generate style string from styles object
function generateStyleString(styles: ElementStyles): string {
  const parts: string[] = [];
  
  if (styles.color) parts.push(`color: '${styles.color}'`);
  if (styles.fontSize) parts.push(`fontSize: '${styles.fontSize}'`);
  if (styles.fontWeight && styles.fontWeight !== 'normal') {
    parts.push(`fontWeight: '${styles.fontWeight}'`);
  }
  if (styles.fontStyle && styles.fontStyle !== 'normal') {
    parts.push(`fontStyle: '${styles.fontStyle}'`);
  }
  if (styles.textAlign && styles.textAlign !== 'left') {
    parts.push(`textAlign: '${styles.textAlign}'`);
  }
  if (styles.textDecoration && styles.textDecoration !== 'none') {
    parts.push(`textDecoration: '${styles.textDecoration}'`);
  }
  if (styles.fontFamily && styles.fontFamily !== 'inherit') {
    parts.push(`fontFamily: '${styles.fontFamily}'`);
  }
  if (styles.backgroundColor) {
    parts.push(`backgroundColor: '${styles.backgroundColor}'`);
  }
  if (styles.borderRadius) {
    parts.push(`borderRadius: '${styles.borderRadius}'`);
  }
  if (styles.opacity && styles.opacity !== '1') {
    parts.push(`opacity: ${styles.opacity}`);
  }
  if (styles.padding) {
    parts.push(`padding: '${styles.padding}'`);
  }
  
  return parts.join(', ');
}

// Generate a summary of changes for version name
export function generateChangeSummary(changes: VisualChange[], elements: ParsedElement[]): string {
  if (changes.length === 0) return 'No changes';
  
  const changeTypes = new Set<string>();
  
  changes.forEach(change => {
    const element = elements.find(el => el.id === change.elementId);
    if (element) {
      changeTypes.add(element.type);
    }
  });
  
  const typeLabels: Record<string, string> = {
    text: 'Text',
    heading: 'Heading',
    paragraph: 'Paragraph',
    button: 'Button',
    image: 'Image',
    container: 'Container',
    link: 'Link',
  };
  
  const changedTypes = Array.from(changeTypes)
    .map(t => typeLabels[t] || t)
    .slice(0, 3)
    .join(', ');
  
  return `Visual Edit: ${changedTypes} updated`;
}
