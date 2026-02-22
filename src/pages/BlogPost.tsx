import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { ArrowLeft, Share2, Clock, Calendar, User, ChevronRight } from 'lucide-react';
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
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VivoraLogo size="sm" />
            <span className="text-base font-bold">Vivora X</span>
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
        <div className="max-w-3xl mx-auto px-6 mb-8">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
            <ChevronRight size={10} />
            <Link to="/blog" className="hover:text-foreground transition-colors">Blog</Link>
            <ChevronRight size={10} />
            <span className="text-foreground/70 truncate max-w-[200px]">{post.title}</span>
          </div>
        </div>

        {/* Article */}
        <motion.article
          className="max-w-3xl mx-auto px-6"
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
            <p className="text-lg text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              {post.summary}
            </p>
          )}

          {/* Author & meta */}
          <div className="flex items-center gap-5 text-sm text-muted-foreground mb-10 pb-8 border-b border-border/40">
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
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
              }}
              className="ml-auto flex items-center gap-1.5 hover:text-foreground transition-colors"
              title="Copy link"
            >
              <Share2 size={13} /> Share
            </button>
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
              position: relative;
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

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="max-w-3xl mx-auto px-6 mt-20 pt-12 border-t border-border/40">
            <h3 className="text-lg font-bold mb-6">More from the blog</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {relatedPosts.map(rp => (
                <Link
                  key={rp.id}
                  to={`/blog/${rp.slug}`}
                  className="group block rounded-xl border border-border/40 overflow-hidden hover:border-border hover:shadow-md transition-all"
                >
                  {rp.cover_image ? (
                    <div className="aspect-video overflow-hidden">
                      <img src={rp.cover_image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10" />
                  )}
                  <div className="p-3">
                    <h4 className="text-sm font-semibold line-clamp-2 group-hover:text-primary transition-colors">{rp.title}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default BlogPost;
