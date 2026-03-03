import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Eye, EyeOff, Edit3, Save, X, GripVertical,
  Image as ImageIcon, Type, AlignLeft, Globe, FileText, Quote,
  Code, ArrowLeft, Monitor, Smartphone,
} from 'lucide-react';

/* ─── Types ────────────────────────────────────────────────── */
interface BlogPost {
  id: string; title: string; slug: string; summary: string | null;
  content: string; cover_image: string | null; category: string;
  is_published: boolean; author_name: string;
  published_at: string | null; created_at: string;
}
interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'code';
  content: string;
}

/* ─── Shared inline style atoms ────────────────────────────── */
const S = {
  // Buttons
  btnPrimary: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
    background: '#2383e2', color: '#ffffff',
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    transition: 'background 0.15s',
  } as React.CSSProperties,
  btnGhost: {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
    background: 'transparent', color: '#6b6b6b',
    border: '1px solid #e3e2de',
    fontSize: 12, fontWeight: 600, fontFamily: "inherit",
    transition: 'background 0.15s',
  } as React.CSSProperties,
  btnDanger: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 30, height: 30, borderRadius: 6, border: 'none', cursor: 'pointer',
    background: 'transparent', color: '#c4c3bf', transition: 'all 0.15s',
  } as React.CSSProperties,
  iconBtn: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    width: 32, height: 32, borderRadius: 8, border: '1px solid #e3e2de',
    background: '#f7f6f3', color: '#6b6b6b', cursor: 'pointer',
  } as React.CSSProperties,
  // Inputs
  input: {
    width: '100%', padding: '8px 10px',
    background: '#ffffff', border: '1px solid #e3e2de', borderRadius: 8,
    fontSize: 13, color: '#191919', fontFamily: "inherit",
    outline: 'none', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  label: {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: '#6b6b6b', textTransform: 'uppercase' as const,
    letterSpacing: '0.05em', marginBottom: 5,
  } as React.CSSProperties,
  // Cards
  card: {
    background: '#ffffff', border: '1px solid #e3e2de',
    borderRadius: 12, overflow: 'hidden',
  } as React.CSSProperties,
  // Tags
  tagBlue:  { display:'inline-block', padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:600, background:'#dbeafe', color:'#1e40af' } as React.CSSProperties,
  tagGreen: { display:'inline-block', padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:600, background:'#dcfce7', color:'#166534' } as React.CSSProperties,
  tagGray:  { display:'inline-block', padding:'2px 8px', borderRadius:5, fontSize:11, fontWeight:600, background:'#f3f4f6', color:'#374151' } as React.CSSProperties,
};

/* ═══════════════════════════════════════════════════════════
   COMPONENT
═══════════════════════════════════════════════════════════ */
export const AdminBlogEditor: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('general');
  const [authorName, setAuthorName] = useState('Vivora Team');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => { fetchPosts(); fetchCategories(); }, []);

  const fetchPosts = async () => {
    const { data } = await supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };
  const fetchCategories = async () => {
    const { data } = await supabase.from('blog_categories').select('*').order('sort_order', { ascending: true });
    if (data) setCategories(data);
  };

  const generateSlug = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  const parseContentToBlocks = (html: string): ContentBlock[] => {
    if (!html) return [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: ContentBlock[] = [];
    doc.body.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['h1','h2','h3','h4'].includes(tag))
          blocks.push({ id: crypto.randomUUID(), type: 'heading', content: el.textContent || '' });
        else if (tag === 'img')
          blocks.push({ id: crypto.randomUUID(), type: 'image', content: (el as HTMLImageElement).src });
        else if (tag === 'blockquote')
          blocks.push({ id: crypto.randomUUID(), type: 'quote', content: el.textContent || '' });
        else if (tag === 'pre')
          blocks.push({ id: crypto.randomUUID(), type: 'code', content: el.textContent || '' });
        else
          blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: el.innerHTML || el.textContent || '' });
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: node.textContent.trim() });
      }
    });
    return blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
  };

  const blocksToHtml = (blocks: ContentBlock[]): string =>
    blocks.map(b => {
      switch (b.type) {
        case 'heading':   return `<h2>${b.content}</h2>`;
        case 'image':     return `<img src="${b.content}" alt="" style="width:100%;border-radius:12px;margin:24px 0" />`;
        case 'quote':     return `<blockquote>${b.content}</blockquote>`;
        case 'code':      return `<pre><code>${b.content}</code></pre>`;
        default:          return `<p>${b.content}</p>`;
      }
    }).join('\n');

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditing(post); setIsNew(false);
      setTitle(post.title); setSlug(post.slug);
      setSummary(post.summary || ''); setCoverImage(post.cover_image || '');
      setCategory(post.category); setAuthorName(post.author_name);
      setContentBlocks(parseContentToBlocks(post.content));
    } else {
      setEditing({ id:'', title:'', slug:'', summary:null, content:'', cover_image:null, category:'general', is_published:false, author_name:'Vivora Team', published_at:null, created_at:'' });
      setIsNew(true);
      setTitle(''); setSlug(''); setSummary(''); setCoverImage('');
      setCategory('general'); setAuthorName('Vivora Team');
      setContentBlocks([{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]);
    }
  };
  const closeEditor = () => { setEditing(null); setIsNew(false); };

  const addBlock    = (type: ContentBlock['type']) => setContentBlocks(prev => [...prev, { id: crypto.randomUUID(), type, content: '' }]);
  const updateBlock = (id: string, content: string) => setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  const removeBlock = (id: string) => setContentBlocks(prev => prev.filter(b => b.id !== id));

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver  = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd   = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      setContentBlocks(prev => {
        const arr = [...prev];
        const [moved] = arr.splice(dragIdx, 1);
        arr.splice(dragOverIdx, 0, moved);
        return arr;
      });
    }
    setDragIdx(null); setDragOverIdx(null);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) return;
    setSaving(true);
    const finalSlug = slug || generateSlug(title);
    const content = blocksToHtml(contentBlocks);
    const payload = { title, slug: finalSlug, summary: summary||null, content, cover_image: coverImage||null, category, author_name: authorName, is_published: publish, published_at: publish ? new Date().toISOString() : null };
    if (isNew) await supabase.from('blog_posts').insert(payload);
    else if (editing) await supabase.from('blog_posts').update(payload).eq('id', editing.id);
    await fetchPosts(); closeEditor(); setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    await fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const newState = !post.is_published;
    await supabase.from('blog_posts').update({
      is_published: newState, published_at: newState ? new Date().toISOString() : null,
    }).eq('id', post.id);
    await fetchPosts();
  };

  /* ── Preview ── */
  const renderPreview = () => (
    <div style={{
      background: '#fafaf9', borderRadius: 12, border: '1px solid #e3e2de',
      overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
    }}>
      {/* Preview toolbar */}
      <div style={{
        padding: '10px 14px', borderBottom: '1px solid #e3e2de',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#f7f6f3',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#9b9a97', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Preview
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {([['desktop', Monitor], ['mobile', Smartphone]] as const).map(([device, Icon]) => (
            <button key={device} onClick={() => setPreviewDevice(device as any)} style={{
              padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
              background: previewDevice === device ? '#191919' : 'transparent',
              color: previewDevice === device ? '#fff' : '#9b9a97',
              display: 'flex', alignItems: 'center',
            }}>
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>
      {/* Preview body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: previewDevice === 'mobile' ? 375 : '100%', maxWidth: 680, transition: 'width 0.3s ease' }}>
          {coverImage && (
            <img src={coverImage} alt="" style={{ width: '100%', borderRadius: 10, marginBottom: 20, maxHeight: 260, objectFit: 'cover' }} />
          )}
          <span style={{ fontSize: 11, fontWeight: 600, color: '#2383e2', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{category}</span>
          <h1 style={{ fontSize: previewDevice === 'mobile' ? 22 : 28, fontWeight: 800, color: '#191919', margin: '8px 0 10px', lineHeight: 1.25 }}>
            {title || 'Untitled Post'}
          </h1>
          {summary && <p style={{ fontSize: 15, color: '#6b6b6b', marginBottom: 20, lineHeight: 1.6 }}>{summary}</p>}
          <div style={{ fontSize: 12, color: '#9b9a97', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid #e3e2de' }}>
            By {authorName} · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: '#374151' }} dangerouslySetInnerHTML={{ __html: blocksToHtml(contentBlocks) }} />
        </div>
      </div>
    </div>
  );

  const blockTypeConfig = {
    heading:   { icon: Type,      label: 'H2',  color: '#9065b0' },
    paragraph: { icon: AlignLeft, label: 'P',   color: '#2383e2' },
    image:     { icon: ImageIcon, label: 'IMG', color: '#e03e3e' },
    quote:     { icon: Quote,     label: 'Q',   color: '#0f7b6c' },
    code:      { icon: Code,      label: '</>',  color: '#6b6b6b' },
  };

  /* ═══════════════════
     EDITOR VIEW
  ═══════════════════ */
  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 110px)' }}>

        {/* ── Editor Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button style={S.iconBtn} onClick={closeEditor}><ArrowLeft size={15} /></button>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#191919', margin: 0 }}>{isNew ? 'New Post' : 'Edit Post'}</h2>
              {!isNew && <p style={{ fontSize: 11, color: '#9b9a97', margin: 0 }}>{editing.slug}</p>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button style={S.btnGhost} onClick={() => setShowPreview(!showPreview)}>
              <Eye size={13} /> {showPreview ? 'Hide Preview' : 'Preview'}
            </button>
            <button style={{ ...S.btnGhost, opacity: saving ? 0.6 : 1 }} onClick={() => handleSave(false)} disabled={saving}>
              <Save size={13} /> Save Draft
            </button>
            <button style={{ ...S.btnPrimary, opacity: saving ? 0.7 : 1 }} onClick={() => handleSave(true)} disabled={saving}>
              <Globe size={13} /> {saving ? 'Publishing…' : 'Publish'}
            </button>
          </div>
        </div>

        {/* ── Split pane ── */}
        <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>

          {/* Left: form */}
          <div style={{ flex: showPreview ? '0 0 50%' : 1, overflowY: 'auto', paddingRight: showPreview ? 4 : 0, transition: 'flex 0.25s ease' }}>

            {/* Meta grid */}
            <div style={{ ...S.card, padding: 16, marginBottom: 12 }}>
              <p style={{ ...S.label, marginBottom: 12 }}>Post Details</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { lbl: 'Title *', val: title, set: (v: string) => { setTitle(v); if (isNew) setSlug(generateSlug(v)); }, ph: 'Post title…' },
                  { lbl: 'Slug', val: slug, set: setSlug, ph: 'post-slug' },
                  { lbl: 'Summary', val: summary, set: setSummary, ph: 'Brief description…' },
                  { lbl: 'Cover Image URL', val: coverImage, set: setCoverImage, ph: 'https://…' },
                  { lbl: 'Author', val: authorName, set: setAuthorName, ph: 'Author name' },
                ].map(f => (
                  <div key={f.lbl}>
                    <label style={S.label}>{f.lbl}</label>
                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.ph}
                      style={S.input}
                      onFocus={e => e.currentTarget.style.borderColor = '#2383e2'}
                      onBlur={e => e.currentTarget.style.borderColor = '#e3e2de'} />
                  </div>
                ))}
                <div>
                  <label style={S.label}>Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} style={S.input}>
                    {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                    {categories.length === 0 && <option value="general">General</option>}
                  </select>
                </div>
              </div>
            </div>

            {/* Block toolbar */}
            <div style={{ ...S.card, padding: '10px 12px', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' as const }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9b9a97', textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: 4 }}>Add Block</span>
              {(['heading','paragraph','image','quote','code'] as const).map(type => {
                const cfg = blockTypeConfig[type];
                const Icon = cfg.icon;
                return (
                  <button key={type} onClick={() => addBlock(type)} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '5px 10px', borderRadius: 7,
                    border: `1px solid ${cfg.color}30`,
                    background: `${cfg.color}10`,
                    cursor: 'pointer', fontSize: 11, fontWeight: 600, color: cfg.color,
                    fontFamily: 'inherit',
                  }}>
                    <Icon size={12} /> {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contentBlocks.map((block, idx) => {
                const cfg = blockTypeConfig[block.type];
                const Icon = cfg.icon;
                const isDragging = dragIdx === idx;
                const isOver = dragOverIdx === idx;
                return (
                  <div key={block.id} draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'stretch',
                      background: isOver ? '#eff6ff' : '#ffffff',
                      border: `1px solid ${isOver ? '#93c5fd' : '#e3e2de'}`,
                      borderRadius: 10, overflow: 'hidden', transition: 'all 0.12s',
                      transform: isDragging ? 'scale(1.01)' : 'none',
                      boxShadow: isDragging ? '0 4px 16px rgba(0,0,0,0.08)' : 'none',
                    }}>
                    {/* Drag handle */}
                    <div style={{
                      width: 36, display: 'flex', flexDirection: 'column', alignItems: 'center',
                      justifyContent: 'center', gap: 4, cursor: 'grab',
                      background: '#f7f6f3', borderRight: '1px solid #e3e2de',
                    }}>
                      <GripVertical size={13} color="#c4c3bf" />
                      <span style={{ fontSize: 8, fontWeight: 800, color: cfg.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{cfg.label}</span>
                    </div>

                    {/* Content area */}
                    <div style={{ flex: 1, padding: '9px 12px' }}>
                      {block.type === 'image' ? (
                        <div>
                          <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                            placeholder="Image URL…" style={{ ...S.input, marginBottom: block.content ? 8 : 0, fontSize: 12 }}
                            onFocus={e => e.currentTarget.style.borderColor = '#2383e2'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e3e2de'} />
                          {block.content && (
                            <img src={block.content} alt="" style={{ maxHeight: 90, borderRadius: 6, objectFit: 'cover' }} />
                          )}
                        </div>
                      ) : block.type === 'heading' ? (
                        <input value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder="Heading text…" style={{ ...S.input, fontWeight: 700, fontSize: 15, border: 'none', padding: '3px 0', background: 'transparent' }} />
                      ) : (
                        <textarea value={block.content} onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder={block.type === 'quote' ? 'Quote text…' : block.type === 'code' ? 'Code…' : 'Write content…'}
                          style={{
                            ...S.input, border: 'none', padding: '3px 0', background: 'transparent',
                            minHeight: block.type === 'code' ? 64 : 50, resize: 'vertical',
                            fontFamily: block.type === 'code' ? "'JetBrains Mono', monospace" : 'inherit',
                            fontSize: block.type === 'code' ? 12 : 13,
                          }} />
                      )}
                    </div>

                    {/* Delete */}
                    <button onClick={() => removeBlock(block.id)} style={S.btnDanger}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#991b1b'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4c3bf'; }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}

              {/* Add paragraph shortcut */}
              <button onClick={() => addBlock('paragraph')} style={{
                width: '100%', padding: '9px', borderRadius: 10,
                border: '1px dashed #e3e2de', background: 'transparent',
                color: '#c4c3bf', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#2383e2'; e.currentTarget.style.color = '#2383e2'; e.currentTarget.style.background = '#eff6ff'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#e3e2de'; e.currentTarget.style.color = '#c4c3bf'; e.currentTarget.style.background = 'transparent'; }}>
                <Plus size={13} /> Add block
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          {showPreview && (
            <div style={{ flex: '0 0 50%', overflow: 'hidden' }}>
              {renderPreview()}
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ═══════════════════
     POSTS LIST VIEW
  ═══════════════════ */
  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: '#191919', margin: 0 }}>Blog</h2>
          <p style={{ fontSize: 13, color: '#9b9a97', margin: '2px 0 0' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button style={S.btnPrimary} onClick={() => openEditor()}
          onMouseEnter={e => e.currentTarget.style.background = '#1a6ec2'}
          onMouseLeave={e => e.currentTarget.style.background = '#2383e2'}>
          <Plus size={14} /> New Post
        </button>
      </div>

      {/* Empty state */}
      {posts.length === 0 ? (
        <div style={{ ...S.card, padding: 48, textAlign: 'center' }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f7f6f3', border: '1px solid #e3e2de', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
            <FileText size={22} color="#c4c3bf" />
          </div>
          <p style={{ fontSize: 14, fontWeight: 600, color: '#6b6b6b', margin: '0 0 6px' }}>No blog posts yet</p>
          <p style={{ fontSize: 12, color: '#9b9a97', margin: '0 0 20px' }}>Create your first blog post to get started.</p>
          <button style={S.btnPrimary} onClick={() => openEditor()}
            onMouseEnter={e => e.currentTarget.style.background = '#1a6ec2'}
            onMouseLeave={e => e.currentTarget.style.background = '#2383e2'}>
            <Plus size={14} /> Create Post
          </button>
        </div>
      ) : (
        /* Posts grid */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {posts.map(post => (
            <div key={post.id} style={{ ...S.card, transition: 'box-shadow 0.15s, transform 0.15s', cursor: 'default' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)'; (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = 'none'; (e.currentTarget as HTMLDivElement).style.transform = 'none'; }}>

              {/* Cover */}
              {post.cover_image ? (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '16/9', background: '#f7f6f3', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #e3e2de' }}>
                  <FileText size={28} color="#c4c3bf" />
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={S.tagBlue}>{post.category}</span>
                  <span style={post.is_published ? S.tagGreen : S.tagGray}>{post.is_published ? 'Published' : 'Draft'}</span>
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: '#191919', margin: '0 0 4px', lineHeight: 1.35 }}>{post.title}</h3>
                {post.summary && (
                  <p style={{ fontSize: 12, color: '#9b9a97', lineHeight: 1.5, margin: '0 0 8px' }}>{post.summary}</p>
                )}
                <p style={{ fontSize: 11, color: '#c4c3bf', margin: '0 0 12px' }}>
                  {post.author_name} · {new Date(post.created_at).toLocaleDateString()}
                </p>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <button style={{ ...S.btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => openEditor(post)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f6f3'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Edit3 size={11} /> Edit
                  </button>
                  <button style={{ ...S.btnGhost, padding: '5px 10px', fontSize: 11 }} onClick={() => togglePublish(post)}
                    onMouseEnter={e => e.currentTarget.style.background = '#f7f6f3'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    {post.is_published ? <><EyeOff size={11} /> Unpublish</> : <><Eye size={11} /> Publish</>}
                  </button>
                  <button style={S.btnDanger} onClick={() => handleDelete(post.id)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; e.currentTarget.style.color = '#991b1b'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#c4c3bf'; }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
