import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { SEOHead } from '@/components/shared/SEOHead';
import { ArrowLeft, Share2, Clock, Calendar, ChevronRight, Twitter, Facebook, Linkedin, Link2, Check } from 'lucide-react';
import { motion } from 'framer-motion';

interface Post {
  id: string;
  title: string;
  slug: string;
  content: string;
  summary: string | null;
  cover_image: string | null;
  category: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedPosts, setRelatedPosts] = useState<any[]>([]);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      if (!slug) return;
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single();
      if (data) {
        setPost(data);
        const { data: related } = await supabase
          .from('blog_posts')
          .select('id, title, slug, cover_image, summary')
          .eq('is_published', true)
          .neq('id', data.id)
          .limit(3);
        if (related) setRelatedPosts(related);
      }
      setLoading(false);
    };
    fetchPost();
    window.scrollTo(0, 0);
  }, [slug]);

  const readingTime = post ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : 0;
  const publishDate = post ? new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '';

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareTitle = post?.title || '';

  const shareLinks = [
    { name: 'Twitter / X', icon: Twitter, url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(currentUrl)}`, color: '#1DA1F2' },
    { name: 'Facebook', icon: Facebook, url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`, color: '#1877F2' },
    { name: 'LinkedIn', icon: Linkedin, url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(currentUrl)}`, color: '#0A66C2' },
  ];

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold">Post not found</h1>
        <Link to="/blog" className="text-primary hover:underline flex items-center gap-1">
          <ArrowLeft size={14} /> Back to Blog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEOHead
        title={post.title}
        description={post.summary || `Read "${post.title}" on the Vivora X blog`}
        ogImage={post.cover_image || undefined}
        canonical={`https://vivorax.online/blog/${post.slug}`}
        ogType="article"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": post.summary || '',
          "image": post.cover_image || '',
          "author": { "@type": "Person", "name": post.author_name },
          "datePublished": post.published_at || post.created_at,
          "publisher": { "@type": "Organization", "name": "Vivora X", "logo": { "@type": "ImageObject", "url": "https://vivorax.online/favicon.svg" } },
          "mainEntityOfPage": `https://vivorax.online/blog/${post.slug}`
        }}
      />
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VivoraLogo size="sm" />
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
              <ArrowLeft size={14} /> Blog
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-24">
        {/* Breadcrumb */}
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight size={10} />
            <span className="text-foreground/70 truncate max-w-[200px]">{post.title}</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 flex gap-12">
          {/* Main Content - Left */}
          <motion.article
            className="flex-1 min-w-0"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Category badge */}
            <span className="inline-block text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-full mb-5">
              {post.category}
            </span>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight">
              {post.title}
            </h1>

            {/* Summary */}
            {post.summary && (
              <p className="text-lg text-muted-foreground leading-relaxed mb-6">
                {post.summary}
              </p>
            )}

            {/* Author & meta */}
            <div className="flex flex-wrap items-center gap-5 text-sm text-muted-foreground mb-10 pb-8 border-b border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                  {post.author_name.charAt(0)}
                </div>
                <span className="font-medium text-foreground">{post.author_name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                <span>{publishDate}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={13} />
                <span>{readingTime} min read</span>
              </div>
            </div>

            {/* Cover image */}
            {post.cover_image && (
              <div className="rounded-2xl overflow-hidden mb-10 border border-border/20">
                <img src={post.cover_image} alt={post.title} className="w-full" />
              </div>
            )}

            {/* Content */}
            <style>{`
              .blog-content pre {
                background: hsl(var(--card));
                border: 1px solid hsl(var(--border) / 0.3);
                border-radius: 12px;
                padding: 20px 24px;
                overflow-x: auto;
                margin: 24px 0;
              }
              .blog-content pre code {
                font-family: 'Geist Mono', 'Fira Code', monospace;
                font-size: 13px;
                line-height: 1.7;
                color: hsl(var(--primary));
                background: none;
                padding: 0;
                border-radius: 0;
              }
              .blog-content code:not(pre code) {
                background: hsl(var(--primary) / 0.1);
                color: hsl(var(--primary));
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.875em;
                font-family: 'Geist Mono', monospace;
              }
              .blog-content blockquote {
                border-left: 3px solid hsl(var(--primary));
                background: hsl(var(--primary) / 0.05);
                padding: 16px 24px;
                border-radius: 0 12px 12px 0;
                margin: 24px 0;
                font-style: normal;
              }
              .blog-content h2 {
                font-size: 1.5rem;
                font-weight: 700;
                margin-top: 48px;
                margin-bottom: 16px;
                letter-spacing: -0.02em;
                color: hsl(var(--foreground));
              }
              .blog-content p {
                line-height: 1.8;
                color: hsl(var(--muted-foreground));
                margin-bottom: 16px;
              }
              .blog-content strong {
                color: hsl(var(--foreground));
                font-weight: 600;
              }
              .blog-content img {
                border-radius: 12px;
                border: 1px solid hsl(var(--border) / 0.2);
                margin: 24px 0;
                max-width: 100%;
              }
              .blog-content a {
                color: hsl(var(--primary));
                text-decoration: none;
              }
              .blog-content a:hover {
                text-decoration: underline;
              }
            `}</style>
            <div
              className="blog-content text-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </motion.article>

          {/* Right Sidebar - Share */}
          <aside className="w-64 shrink-0 hidden lg:block">
            <div className="sticky top-24">
              <div className="rounded-2xl border border-border/40 bg-card p-5">
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                  <Share2 size={14} /> Share this post
                </h3>
                <div className="flex flex-col gap-2">
                  {shareLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <a
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
                      >
                        <Icon size={16} style={{ color: link.color }} />
                        {link.name}
                      </a>
                    );
                  })}
                  <button
                    onClick={copyLink}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-all w-full text-left"
                  >
                    {linkCopied ? <Check size={16} className="text-green-500" /> : <Link2 size={16} />}
                    {linkCopied ? 'Link copied!' : 'Copy link'}
                  </button>
                </div>
              </div>

              {/* Author card */}
              <div className="rounded-2xl border border-border/40 bg-card p-5 mt-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {post.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{post.author_name}</p>
                    <p className="text-xs text-muted-foreground">Author</p>
                  </div>
                </div>
              </div>

              {/* Related Posts in sidebar */}
              {relatedPosts.length > 0 && (
                <div className="rounded-2xl border border-border/40 bg-card p-5 mt-4">
                  <h3 className="text-sm font-semibold mb-4">More posts</h3>
                  <div className="flex flex-col gap-3">
                    {relatedPosts.map(rp => (
                      <Link
                        key={rp.id}
                        to={`/blog/${rp.slug}`}
                        className="group block"
                      >
                        <h4 className="text-sm font-medium line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</h4>
                        {rp.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{rp.summary}</p>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default BlogPost;
