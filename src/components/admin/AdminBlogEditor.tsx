import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  Plus, Trash2, Eye, EyeOff, Edit3, Save, X, GripVertical,
  Image as ImageIcon, Type, AlignLeft, Globe, FileText, ChevronDown
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
  type: 'heading' | 'paragraph' | 'image' | 'quote';
  content: string;
}

export const AdminBlogEditor: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('general');
  const [authorName, setAuthorName] = useState('Vivora Team');
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  useEffect(() => {
    fetchPosts();
    fetchCategories();
  }, []);

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('blog_posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('blog_categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCategories(data);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const parseContentToBlocks = (html: string): ContentBlock[] => {
    if (!html) return [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const blocks: ContentBlock[] = [];
    doc.body.childNodes.forEach(node => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        const tag = el.tagName.toLowerCase();
        if (['h1', 'h2', 'h3', 'h4'].includes(tag)) {
          blocks.push({ id: crypto.randomUUID(), type: 'heading', content: el.textContent || '' });
        } else if (tag === 'img') {
          blocks.push({ id: crypto.randomUUID(), type: 'image', content: (el as HTMLImageElement).src });
        } else if (tag === 'blockquote') {
          blocks.push({ id: crypto.randomUUID(), type: 'quote', content: el.textContent || '' });
        } else {
          blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: el.innerHTML || el.textContent || '' });
        }
      } else if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
        blocks.push({ id: crypto.randomUUID(), type: 'paragraph', content: node.textContent.trim() });
      }
    });
    return blocks.length > 0 ? blocks : [{ id: crypto.randomUUID(), type: 'paragraph', content: '' }];
  };

  const blocksToHtml = (blocks: ContentBlock[]): string => {
    return blocks.map(b => {
      switch (b.type) {
        case 'heading': return `<h2>${b.content}</h2>`;
        case 'image': return `<img src="${b.content}" alt="" style="width:100%;border-radius:12px;margin:24px 0" />`;
        case 'quote': return `<blockquote>${b.content}</blockquote>`;
        default: return `<p>${b.content}</p>`;
      }
    }).join('\n');
  };

  const openEditor = (post?: BlogPost) => {
    if (post) {
      setEditing(post);
      setIsNew(false);
      setTitle(post.title);
      setSlug(post.slug);
      setSummary(post.summary || '');
      setCoverImage(post.cover_image || '');
      setCategory(post.category);
      setAuthorName(post.author_name);
      setContentBlocks(parseContentToBlocks(post.content));
    } else {
      setEditing({ id: '', title: '', slug: '', summary: null, content: '', cover_image: null, category: 'general', is_published: false, author_name: 'Vivora Team', published_at: null, created_at: '' });
      setIsNew(true);
      setTitle('');
      setSlug('');
      setSummary('');
      setCoverImage('');
      setCategory('general');
      setAuthorName('Vivora Team');
      setContentBlocks([{ id: crypto.randomUUID(), type: 'paragraph', content: '' }]);
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setIsNew(false);
  };

  const addBlock = (type: ContentBlock['type']) => {
    setContentBlocks(prev => [...prev, { id: crypto.randomUUID(), type, content: '' }]);
  };

  const updateBlock = (id: string, content: string) => {
    setContentBlocks(prev => prev.map(b => b.id === id ? { ...b, content } : b));
  };

  const removeBlock = (id: string) => {
    setContentBlocks(prev => prev.filter(b => b.id !== id));
  };

  // Drag and drop
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
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSave = async (publish: boolean) => {
    if (!title.trim()) return;
    setSaving(true);
    const finalSlug = slug || generateSlug(title);
    const content = blocksToHtml(contentBlocks);
    const payload = {
      title,
      slug: finalSlug,
      summary: summary || null,
      content,
      cover_image: coverImage || null,
      category,
      author_name: authorName,
      is_published: publish,
      published_at: publish ? new Date().toISOString() : null,
    };

    if (isNew) {
      await supabase.from('blog_posts').insert(payload);
    } else if (editing) {
      await supabase.from('blog_posts').update(payload).eq('id', editing.id);
    }
    await fetchPosts();
    closeEditor();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    await fetchPosts();
  };

  const togglePublish = async (post: BlogPost) => {
    const newState = !post.is_published;
    await supabase.from('blog_posts').update({
      is_published: newState,
      published_at: newState ? new Date().toISOString() : null,
    }).eq('id', post.id);
    await fetchPosts();
  };

  // ── Editor View ──
  if (editing) {
    return (
      <div>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="vivora-icon-btn" onClick={closeEditor}><X size={16} /></button>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>{isNew ? 'New Post' : 'Edit Post'}</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => handleSave(false)} disabled={saving}>
              <Save size={14} /> Save Draft
            </button>
            <button className="vivora-btn vivora-btn-primary" onClick={() => handleSave(true)} disabled={saving}>
              <Globe size={14} /> {saving ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Meta Fields */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div className="vivora-field">
            <label className="vivora-field-label">Title *</label>
            <input
              className="vivora-field-input"
              value={title}
              onChange={e => { setTitle(e.target.value); if (isNew) setSlug(generateSlug(e.target.value)); }}
              placeholder="Post title..."
            />
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
            <label className="vivora-field-label">Author Name</label>
            <input className="vivora-field-input" value={authorName} onChange={e => setAuthorName(e.target.value)} />
          </div>
        </div>

        {/* Cover Preview */}
        {coverImage && (
          <div style={{ marginBottom: 20, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,105,92,0.1)' }}>
            <img src={coverImage} alt="Cover" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
          </div>
        )}

        {/* Content Blocks */}
        <div style={{ marginBottom: 16 }}>
          <label className="vivora-field-label" style={{ marginBottom: 12 }}>Content Blocks</label>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => addBlock('heading')}><Type size={14} /> Heading</button>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => addBlock('paragraph')}><AlignLeft size={14} /> Paragraph</button>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => addBlock('image')}><ImageIcon size={14} /> Image</button>
            <button className="vivora-btn vivora-btn-secondary" onClick={() => addBlock('quote')}><FileText size={14} /> Quote</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {contentBlocks.map((block, idx) => (
              <div
                key={block.id}
                draggable
                onDragStart={() => handleDragStart(idx)}
                onDragOver={e => handleDragOver(e, idx)}
                onDragEnd={handleDragEnd}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                  padding: 12,
                  background: dragOverIdx === idx ? 'rgba(0,131,143,0.08)' : '#fff',
                  border: '1px solid rgba(0,105,92,0.1)',
                  borderRadius: 10,
                  transition: 'background 0.15s',
                }}
              >
                <div style={{ cursor: 'grab', color: '#90a4ae', paddingTop: 8 }}>
                  <GripVertical size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#00838f', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {block.type}
                    </span>
                  </div>
                  {block.type === 'image' ? (
                    <div>
                      <input
                        className="vivora-field-input"
                        value={block.content}
                        onChange={e => updateBlock(block.id, e.target.value)}
                        placeholder="Image URL..."
                        style={{ marginBottom: 8 }}
                      />
                      {block.content && (
                        <img src={block.content} alt="" style={{ maxHeight: 120, borderRadius: 8, objectFit: 'cover' }} />
                      )}
                    </div>
                  ) : block.type === 'heading' ? (
                    <input
                      className="vivora-field-input"
                      value={block.content}
                      onChange={e => updateBlock(block.id, e.target.value)}
                      placeholder="Heading text..."
                      style={{ fontWeight: 700, fontSize: 16 }}
                    />
                  ) : (
                    <textarea
                      className="vivora-field-input vivora-textarea"
                      value={block.content}
                      onChange={e => updateBlock(block.id, e.target.value)}
                      placeholder={block.type === 'quote' ? 'Quote text...' : 'Write your content...'}
                      style={{ minHeight: block.type === 'quote' ? 60 : 80 }}
                    />
                  )}
                </div>
                <button
                  onClick={() => removeBlock(block.id)}
                  style={{ color: '#c62828', background: 'none', border: 'none', cursor: 'pointer', paddingTop: 8 }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
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
        <div className="vivora-table-card">
          <table className="vivora-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 120 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {post.cover_image && (
                        <img src={post.cover_image} alt="" style={{ width: 40, height: 28, borderRadius: 6, objectFit: 'cover' }} />
                      )}
                      <span className="td-strong">{post.title}</span>
                    </div>
                  </td>
                  <td><span className="vivora-badge badge-blue">{post.category}</span></td>
                  <td>
                    <span className={`vivora-badge ${post.is_published ? 'badge-green' : 'badge-gray'}`}>
                      {post.is_published ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="td-muted">{new Date(post.created_at).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="vivora-icon-btn" onClick={() => openEditor(post)} title="Edit">
                        <Edit3 size={14} />
                      </button>
                      <button className="vivora-icon-btn" onClick={() => togglePublish(post)} title={post.is_published ? 'Unpublish' : 'Publish'}>
                        {post.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button className="vivora-del-btn" onClick={() => handleDelete(post.id)} title="Delete">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
