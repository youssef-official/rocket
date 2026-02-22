import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { VivoraLogo } from '@/components/shared/VivoraLogo';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  cover_image: string | null;
  category: string;
  author_name: string;
  published_at: string | null;
  created_at: string;
}

interface BlogCategory {
  id: string;
  name: string;
  slug: string;
}

const Blog: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'latest';

  useEffect(() => {
    const fetchData = async () => {
      const [postsRes, catsRes] = await Promise.all([
        supabase.from('blog_posts').select('id, title, slug, summary, cover_image, category, author_name, published_at, created_at').eq('is_published', true).order('published_at', { ascending: false }),
        supabase.from('blog_categories').select('*').order('sort_order', { ascending: true }),
      ]);
      if (postsRes.data) setPosts(postsRes.data);
      if (catsRes.data) setCategories(catsRes.data);
      setLoading(false);
    };
    fetchData();
  }, []);

  // Get categories that actually have posts
  const activeCategorySlugs = new Set(posts.map(p => p.category));
  const visibleCategories = categories.filter(
    c => c.slug === 'latest' || activeCategorySlugs.has(c.slug)
  );

  const filteredPosts = activeCategory === 'latest'
    ? posts
    : posts.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <VivoraLogo size="sm" />
            <span className="text-base font-bold">Vivora X</span>
          </Link>
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
            <ArrowLeft size={14} /> Home
          </Link>
        </div>
      </nav>

      <main className="pt-20 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-16">
            {/* Sidebar */}
            <aside className="w-48 shrink-0 hidden lg:block sticky top-24 self-start">
              <h1 className="text-3xl font-bold mb-2">Blog</h1>
              <p className="text-sm text-muted-foreground mb-8">Notes from the Vivora team</p>
              <div className="w-8 h-px bg-border mb-6" />
              <nav className="flex flex-col gap-1">
                {visibleCategories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSearchParams(cat.slug === 'latest' ? {} : { category: cat.slug })}
                    className={`text-left text-sm py-1.5 transition-colors ${
                      activeCategory === cat.slug
                        ? 'text-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </nav>
            </aside>

            {/* Posts Grid */}
            <div className="flex-1">
              {/* Mobile title */}
              <div className="lg:hidden mb-8">
                <h1 className="text-3xl font-bold mb-2">Blog</h1>
                <p className="text-sm text-muted-foreground">Notes from the Vivora team</p>
                <div className="flex gap-2 mt-4 flex-wrap">
                  {visibleCategories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSearchParams(cat.slug === 'latest' ? {} : { category: cat.slug })}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                        activeCategory === cat.slug
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:border-foreground'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl bg-muted animate-pulse aspect-[4/3]" />
                  ))}
                </div>
              ) : filteredPosts.length === 0 ? (
                <div className="text-center py-20">
                  <p className="text-muted-foreground">No posts yet in this category.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {filteredPosts.map((post, i) => (
                    <motion.div
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Link
                        to={`/blog/${post.slug}`}
                        className="group block rounded-2xl overflow-hidden bg-card border border-border/40 hover:border-border transition-all hover:shadow-lg"
                      >
                        {post.cover_image ? (
                          <div className="aspect-[16/10] overflow-hidden">
                            <img
                              src={post.cover_image}
                              alt={post.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          </div>
                        ) : (
                          <div className="aspect-[16/10] bg-gradient-to-br from-primary/30 via-accent/30 to-secondary/30" />
                        )}
                        <div className="p-5">
                          <span className="text-xs text-muted-foreground">{post.category}</span>
                          <h2 className="text-lg font-semibold mt-1 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                            {post.title}
                          </h2>
                          {post.summary && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.summary}</p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{post.author_name}</span>
                            <span>•</span>
                            <span>{new Date(post.published_at || post.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Blog;
