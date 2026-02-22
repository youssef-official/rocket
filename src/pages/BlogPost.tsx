import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Footer } from '@/components/shared/Footer';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { ArrowLeft, Share2, Clock } from 'lucide-react';
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
        // Fetch related posts
        const { data: related } = await supabase
          .from('blog_posts')
          .select('id, title, slug')
          .eq('is_published', true)
          .eq('category', data.category)
          .neq('id', data.id)
          .limit(6);
        if (related) setRelatedPosts(related);
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  const readingTime = post ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200)) : 0;

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
        <Link to="/blog" className="text-primary hover:underline">← Back to Blog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VivoraLogo size="sm" />
            <span className="text-lg font-bold">Vivora X</span>
          </Link>
          <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
            <ArrowLeft size={14} /> All Posts
          </Link>
        </div>
      </nav>

      <main className="pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-16">
            {/* Main Content */}
            <motion.article
              className="flex-1 max-w-3xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-2">
                  Author: <strong className="text-foreground">{post.author_name}</strong>
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <Clock size={12} />
                  <span>{readingTime} min read</span>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-8">{post.title}</h1>

              {post.cover_image && (
                <div className="rounded-2xl overflow-hidden mb-10">
                  <img src={post.cover_image} alt={post.title} className="w-full" />
                </div>
              )}

              {/* Render content as HTML */}
              <div
                className="prose prose-invert prose-lg max-w-none
                  prose-headings:font-bold prose-headings:text-foreground
                  prose-p:text-muted-foreground prose-p:leading-relaxed
                  prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                  prose-img:rounded-xl prose-img:my-8
                  prose-strong:text-foreground
                  prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </motion.article>

            {/* Right Sidebar */}
            <aside className="w-64 shrink-0 hidden lg:block sticky top-28 self-start">
              {relatedPosts.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-sm font-semibold mb-4">In this article</h3>
                  <nav className="flex flex-col gap-2">
                    {relatedPosts.map(rp => (
                      <Link
                        key={rp.id}
                        to={`/blog/${rp.slug}`}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors leading-snug"
                      >
                        {rp.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold mb-3">Share this</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(window.location.href)}`, '_blank')}
                    className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center hover:bg-accent transition-colors"
                  >
                    <Share2 size={14} />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BlogPost;
