import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Eye, EyeOff, Edit3, Save, X, GripVertical,
  Image as ImageIcon, Type, AlignLeft, Globe, FileText, Quote,
  Code, ArrowLeft, Monitor, Smartphone, ExternalLink
} from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  cover_image: string | null;
  category: string;
  is_published: boolean;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

interface ContentBlock {
  id: string;
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'code';
  content: string;
}

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
        if (['h1', 'h2', 'h3', 'h4'].includes(tag))
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
        case 'heading': return `<h2>${b.content}</h2>`;
        case 'image': return `<img src="${b.content}" alt="" style="width:100%;border-radius:12px;margin:24px 0" />`;
        case 'quote': return `<blockquote>${b.content}</blockquote>`;
        case 'code': return `<pre><code>${b.content}</code></pre>`;
        default: return `<p>${b.content}</p>`;
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
      setEditing({ id: '', title: '', slug: '', summary: null, content: '', cover_image: null, category: 'general', is_published: false, author_name: 'Vivora Team', published_at: null, created_at: '' });
      setIsNew(true);
      setTitle(''); setSlug(''); setSummary(''); setCoverImage('');
      setCategory('general'); setAuthorName('Vivora Team');
      setContentBlocks([{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]);
    }
  };

  const closeEditor = () => { setEditing(null); setIsNew(false); };

  const addBlock = (type: ContentBlock['type']) => {
    setContentBlocks(prev => [...prev, { id: crypto.randomUUID(), type, content: '' }]);
  };

  const updateBlock = (id: string, content: string) => {
    setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(prev => prev.filter(b => b.id !== id));
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setDragOverIdx(idx); };
  const handleDragEnd = () => {
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
    const payload = {
      title, slug: finalSlug, summary: summary || null, content,
      cover_image: coverImage || null, category, author_name: authorName,
      is_published: publish, published_at: publish ? new Date().toISOString() : null,
    };
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

  // ── Preview Renderer ──
  const renderPreview = () => {
    const previewHtml = blocksToHtml(contentBlocks);
    return (
      <div style={{
        background: '#fff', borderRadius: 16, border: '1px solid rgba(0,105,92,0.1)',
        overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column',
      }}>
        {/* Preview toolbar */}
        <div style={{
          padding: '12px 16px', borderBottom: '1px solid rgba(0,105,92,0.08)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(0,131,143,0.03)',
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#00695c', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Live Preview
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            <button
              onClick={() => setPreviewDevice('desktop')}
              style={{
                padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: previewDevice === 'desktop' ? '#00838f' : 'transparent',
                color: previewDevice === 'desktop' ? '#fff' : '#78909c',
              }}
            ><Monitor size={14} /></button>
            <button
              onClick={() => setPreviewDevice('mobile')}
              style={{
                padding: '4px 8px', borderRadius: 6, border: 'none', cursor: 'pointer',
                background: previewDevice === 'mobile' ? '#00838f' : 'transparent',
                color: previewDevice === 'mobile' ? '#fff' : '#78909c',
              }}
            ><Smartphone size={14} /></button>
          </div>
        </div>
        {/* Preview content */}
        <div style={{
          flex: 1, overflowY: 'auto', padding: 24,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{
            width: previewDevice === 'mobile' ? 375 : '100%',
            maxWidth: 720, transition: 'width 0.3s ease',
          }}>
            {coverImage && (
              <img src={coverImage} alt="" style={{
                width: '100%', borderRadius: 12, marginBottom: 24,
                maxHeight: 300, objectFit: 'cover',
              }} />
            )}
            <div style={{ marginBottom: 16 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#00838f',
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}>{category}</span>
            </div>
            <h1 style={{
              fontSize: previewDevice === 'mobile' ? 24 : 32,
              fontWeight: 800, color: '#1a1a1a', marginBottom: 12, lineHeight: 1.2,
            }}>{title || 'Untitled Post'}</h1>
            {summary && (
              <p style={{ fontSize: 16, color: '#607d8b', marginBottom: 24, lineHeight: 1.6 }}>{summary}</p>
            )}
            <div style={{
              fontSize: 12, color: '#90a4ae', marginBottom: 32,
              paddingBottom: 24, borderBottom: '1px solid #eee',
            }}>
              By {authorName} • {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            <div
              style={{ fontSize: 15, lineHeight: 1.8, color: '#37474f' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>
    );
  };

  const blockTypeConfig = {
    heading: { icon: Type, label: 'H2', color: '#6a1b9a' },
    paragraph: { icon: AlignLeft, label: 'P', color: '#1565c0' },
    image: { icon: ImageIcon, label: 'IMG', color: '#e65100' },
    quote: { icon: Quote, label: 'Q', color: '#2e7d32' },
    code: { icon: Code, label: '<>', color: '#455a64' },
  };

  // ── Editor View ──
  if (editing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 20, flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="vivora-icon-btn" onClick={closeEditor}><ArrowLeft size={16} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
              {isNew ? 'New Post' : 'Edit Post'}
            </h2>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button
              className="vivora-btn vivora-btn-secondary"
              onClick={() => setShowPreview(!showPreview)}
              style={{ gap: 6 }}
            >
              <Eye size={14} /> {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
              <Save size={14} /> Save Draft
            </button>
            <button className="vivora-btn vivora-btn-primary" onClick={() => handleSave(true)} disabled={saving}>
              <Globe size={14} /> {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Editor + Preview Split */}
        <div style={{
          display: 'flex', gap: 20, flex: 1, overflow: 'hidden',
        }}>
          {/* Left: Editor */}
          <div style={{
            flex: showPreview ? '0 0 50%' : '1',
            overflowY: 'auto', paddingRight: showPreview ? 10 : 0,
            transition: 'flex 0.3s ease',
          }}>
            {/* Meta Fields */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
              <div className="vivora-field">
                <label className="vivora-field-label">Title *</label>
                <input className="vivora-field-input" value={title}
                  onChange={e => { setTitle(e.target.value); if (isNew) setSlug(generateSlug(e.target.value)); }}
                  placeholder="Post title..." />
              </div>
              <div className="vivora-field">
                <label className="vivora-field-label">Slug</label>
                <input className="vivora-field-input" value={slug} onChange={e => setSlug(e.target.value)} placeholder="post-slug" />
              </div>
              <div className="vivora-field">
                <label className="vivora-field-label">Summary</label>
                <input className="vivora-field-input" value={summary} onChange={e => setSummary(e.target.value)} placeholder="Brief description..." />
              </div>
              <div className="vivora-field">
                <label className="vivora-field-label">Cover Image URL</label>
                <input className="vivora-field-input" value={coverImage} onChange={e => setCoverImage(e.target.value)} placeholder="https://..." />
              </div>
              <div className="vivora-field">
                <label className="vivora-field-label">Category</label>
                <select className="vivora-field-input" value={category} onChange={e => setCategory(e.target.value)}>
                  {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
                </select>
              </div>
              <div className="vivora-field">
                <label className="vivora-field-label">Author</label>
                <input className="vivora-field-input" value={authorName} onChange={e => setAuthorName(e.target.value)} />
              </div>
            </div>

            {/* Block toolbar */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 16, padding: '10px 12px',
              background: '#fff', borderRadius: 12, border: '1px solid rgba(0,105,92,0.08)',
            }}>
              <span style={{ fontSize: 11, color: '#90a4ae', fontWeight: 600, alignSelf: 'center', marginRight: 8 }}>ADD:</span>
              {(['heading', 'paragraph', 'image', 'quote', 'code'] as const).map(type => {
                const cfg = blockTypeConfig[type];
                const Icon = cfg.icon;
                return (
                  <button key={type} onClick={() => addBlock(type)} style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(0,105,92,0.12)',
                    background: 'rgba(0,131,143,0.04)', cursor: 'pointer', fontSize: 11,
                    fontWeight: 600, color: cfg.color, fontFamily: "'Geist', sans-serif",
                  }}>
                    <Icon size={13} /> {cfg.label}
                  </button>
                );
              })}
            </div>

            {/* Content Blocks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {contentBlocks.map((block, idx) => {
                const cfg = blockTypeConfig[block.type];
                const Icon = cfg.icon;
                return (
                  <div
                    key={block.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    style={{
                      display: 'flex', alignItems: 'stretch', gap: 0,
                      background: dragOverIdx === idx ? 'rgba(0,131,143,0.06)' : '#fff',
                      border: `1px solid ${dragOverIdx === idx ? '#00838f' : 'rgba(0,105,92,0.08)'}`,
                      borderRadius: 10, overflow: 'hidden',
                      transition: 'all 0.15s',
                      transform: dragIdx === idx ? 'scale(1.02)' : 'none',
                      boxShadow: dragIdx === idx ? '0 8px 24px rgba(0,0,0,0.12)' : 'none',
                    }}
                  >
                    {/* Drag handle + type badge */}
                    <div style={{
                      width: 40, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center', gap: 6,
                      background: 'rgba(0,131,143,0.03)', cursor: 'grab',
                      borderRight: '1px solid rgba(0,105,92,0.06)',
                    }}>
                      <GripVertical size={14} color="#90a4ae" />
                      <span style={{
                        fontSize: 8, fontWeight: 800, color: cfg.color,
                        textTransform: 'uppercase', letterSpacing: 0.5,
                      }}>{cfg.label}</span>
                    </div>

                    {/* Content area */}
                    <div style={{ flex: 1, padding: '10px 12px' }}>
                      {block.type === 'image' ? (
                        <div>
                          <input className="vivora-field-input" value={block.content}
                            onChange={e => updateBlock(block.id, e.target.value)}
                            placeholder="Image URL..." style={{ marginBottom: block.content ? 8 : 0, fontSize: 12 }} />
                          {block.content && (
                            <img src={block.content} alt="" style={{ maxHeight: 100, borderRadius: 8, objectFit: 'cover' }} />
                          )}
                        </div>
                      ) : block.type === 'heading' ? (
                        <input className="vivora-field-input" value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder="Heading text..." style={{ fontWeight: 700, fontSize: 15, border: 'none', padding: '4px 0' }} />
                      ) : block.type === 'code' ? (
                        <textarea className="vivora-field-input" value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder="Code block..."
                          style={{ minHeight: 60, fontFamily: "'Geist Mono', monospace", fontSize: 12, resize: 'vertical' }} />
                      ) : (
                        <textarea className="vivora-field-input" value={block.content}
                          onChange={e => updateBlock(block.id, e.target.value)}
                          placeholder={block.type === 'quote' ? 'Quote text...' : 'Write content...'}
                          style={{ minHeight: block.type === 'quote' ? 50 : 60, border: 'none', padding: '4px 0', resize: 'vertical' }} />
                      )}
                    </div>

                    {/* Delete button */}
                    <button onClick={() => removeBlock(block.id)} style={{
                      width: 36, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#bbb', transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c62828')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#bbb')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
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

  // ── Posts List View ──
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
          {posts.length} Post{posts.length !== 1 ? 's' : ''}
        </h3>
        <button className="vivora-btn vivora-btn-primary" onClick={() => openEditor()}>
          <Plus size={14} /> New Post
        </button>
      </div>

      {posts.length === 0 ? (
        <div className="vivora-empty">
          <div className="vivora-empty-icon"><FileText size={22} /></div>
          <h3 className="vivora-empty-title">No blog posts yet</h3>
          <p className="vivora-empty-text">Create your first blog post to get started.</p>
          <button className="vivora-btn vivora-btn-primary" onClick={() => openEditor()}>
            <Plus size={14} /> Create Post
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {posts.map(post => (
            <div key={post.id} style={{
              background: '#fff', borderRadius: 16, border: '1px solid rgba(0,105,92,0.08)',
              overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              transition: 'all 0.2s', cursor: 'pointer',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.04)'; e.currentTarget.style.transform = 'none'; }}
            >
              {post.cover_image ? (
                <div style={{ aspectRatio: '16/9', overflow: 'hidden' }}>
                  <img src={post.cover_image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ aspectRatio: '16/9', background: 'linear-gradient(135deg, rgba(0,131,143,0.15), rgba(0,105,92,0.08))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FileText size={32} color="#00838f" />
                </div>
              )}
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="vivora-badge badge-blue">{post.category}</span>
                  <span className={`vivora-badge ${post.is_published ? 'badge-green' : 'badge-gray'}`}>
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 4, lineHeight: 1.3 }}>{post.title}</h3>
                {post.summary && <p style={{ fontSize: 12, color: '#78909c', lineHeight: 1.5, marginBottom: 8 }}>{post.summary}</p>}
                <div style={{ fontSize: 11, color: '#90a4ae', marginBottom: 12 }}>
                  {post.author_name} • {new Date(post.created_at).toLocaleDateString()}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="vivora-btn vivora-btn-secondary" onClick={() => openEditor(post)} style={{ padding: '6px 12px', fontSize: 11 }}>
                    <Edit3 size={12} /> Edit
                  </button>
                  <button className="vivora-btn vivora-btn-secondary" onClick={() => togglePublish(post)} style={{ padding: '6px 12px', fontSize: 11 }}>
                    {post.is_published ? <><EyeOff size={12} /> Unpublish</> : <><Eye size={12} /> Publish</>}
                  </button>
                  <button className="vivora-del-btn" onClick={() => handleDelete(post.id)} style={{ width: 28, height: 28 }}>
                    <Trash2 size={11} />
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
