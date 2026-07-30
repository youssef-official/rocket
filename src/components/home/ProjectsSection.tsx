import { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock3, Copy, ExternalLink, FolderOpen, MoreVertical, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import type { Project } from '@/types';

interface ProjectsSectionProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onForkProject: (id: string) => void;
}

export const ProjectsSection = ({
  projects,
  loading,
  onOpenProject,
  onDeleteProject,
  onForkProject,
}: ProjectsSectionProps) => {
  const { language, isRTL } = useLanguage();
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const ar = language === 'ar';

  if (loading) {
    return (
      <section className="relative z-10 flex justify-center px-4 pb-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/25 border-t-pink-400" />
      </section>
    );
  }

  if (projects.length === 0) return null;

  return (
    <section className="relative z-10 px-4 pb-16 md:px-6 md:pb-24" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-pink-300">
              <FolderOpen className="h-4 w-4" />
              <span className="text-xs font-bold uppercase tracking-[0.18em]">{ar ? 'مساحة العمل' : 'Workspace'}</span>
            </div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">{ar ? 'مشاريعك' : 'Your projects'}</h2>
            <p className="mt-1 text-sm text-white/55">{ar ? `${projects.length} مشروع محفوظ` : `${projects.length} saved project${projects.length === 1 ? '' : 's'}`}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <motion.article
              key={project.id}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(index, 5) * 0.04 }}
              onClick={() => onOpenProject(project.id)}
              className="group relative cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-[#0b1020]/75 p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-pink-400/35 hover:bg-[#11172a]/85"
            >
              <div className="mb-8 flex items-start justify-between gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-pink-500/25 to-indigo-500/20">
                  <FolderOpen className="h-5 w-5 text-pink-200" />
                </div>
                <div className="relative" onClick={event => event.stopPropagation()}>
                  <button
                    type="button"
                    aria-label={ar ? 'إجراءات المشروع' : 'Project actions'}
                    onClick={() => setMenuOpenId(current => current === project.id ? null : project.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-white/55 transition hover:bg-white/10 hover:text-white"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>
                  {menuOpenId === project.id && (
                    <div className={`absolute top-10 z-20 w-36 overflow-hidden rounded-xl border border-white/10 bg-[#111522] p-1 shadow-2xl ${isRTL ? 'left-0' : 'right-0'}`}>
                      <button type="button" onClick={() => { onForkProject(project.id); setMenuOpenId(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/75 hover:bg-white/10 hover:text-white">
                        <Copy className="h-4 w-4" />{ar ? 'نسخ' : 'Duplicate'}
                      </button>
                      <button type="button" onClick={() => { onDeleteProject(project.id); setMenuOpenId(null); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-300 hover:bg-rose-500/10">
                        <Trash2 className="h-4 w-4" />{ar ? 'حذف' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="truncate text-lg font-semibold text-white">{project.name}</h3>
              <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-white/50">{project.description || (ar ? 'مشروع موقع إلكتروني' : 'Website project')}</p>
              <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-white/45">
                <span className="flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" />{formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}</span>
                {project.isPublished && <span className="flex items-center gap-1 text-emerald-300"><ExternalLink className="h-3.5 w-3.5" />{ar ? 'منشور' : 'Live'}</span>}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};
