import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, Clock, Trash2, Copy, ExternalLink, MoreVertical, 
  FolderOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';

interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: 'vite' | 'html';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsSectionProps {
  projects: Project[];
  loading: boolean;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onForkProject: (id: string) => void;
  onNewProject: () => void;
}

export const ProjectsSection: React.FC<ProjectsSectionProps> = ({
  projects,
  loading,
  onOpenProject,
  onDeleteProject,
  onForkProject,
  onNewProject,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const { t, isRTL } = useLanguage();

  if (loading) {
    return (
      <div className="py-16 flex justify-center">
        <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (projects.length === 0) {
    return null;
  }

  return (
    <section className="relative z-10 px-6 pb-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className={`flex items-center justify-between mb-8 ${isRTL ? 'flex-row' : ''}`}>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewProject}
            className={`flex items-center gap-2 px-4 py-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white hover:bg-white/20 transition-colors ${isRTL ? 'flex-row' : ''}`}
          >
            <Plus className="w-4 h-4" />
            {t('projects.newProject')}
          </motion.button>

          <div className={`flex items-center gap-3 ${isRTL ? 'flex-row' : ''}`}>
            <div className={isRTL ? 'text-right' : 'text-left'}>
              <h2 className="text-xl md:text-2xl font-bold text-white whitespace-nowrap">{t('projects.title')}</h2>
              <p className="text-white/60 text-sm">
                {t('projects.count', { count: projects.length, s: projects.length !== 1 ? 's' : '' })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.slice(0, 6).map((project, index) => (
            <motion.div
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group cursor-pointer"
              onClick={() => onOpenProject(project.id)}
            >
              <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden hover:bg-white/15 hover:border-white/20 transition-all duration-300">
                {/* Preview Thumbnail */}
                <div className="aspect-[16/10] bg-gradient-to-br from-pink-500/20 to-purple-500/20 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                  {/* Project type icon */}
                  <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
                    {project.projectType === 'vite' ? (
                      <svg className="w-7 h-7 text-cyan-400" viewBox="0 0 256 257"><defs><linearGradient id="logosVitejs0" x1="-.828%" x2="57.636%" y1="7.652%" y2="78.411%"><stop offset="0%" stopColor="#41D1FF"/><stop offset="100%" stopColor="#BD34FE"/></linearGradient></defs><path fill="url(#logosVitejs0)" d="M255.153 37.938L134.897 252.976c-2.483 4.44-8.862 4.466-11.382.048L.875 37.958c-2.746-4.814 1.371-10.646 6.827-9.67l120.385 21.517a6.5 6.5 0 0 0 2.322-.004l117.867-21.483c5.438-.991 9.574 4.796 6.877 9.62Z"/></svg>
                    ) : (
                      <svg className="w-7 h-7 text-orange-500" viewBox="0 0 128 128"><path fill="#E44D26" d="M19.037 113.876L9.032 1.661h109.936l-10.016 112.198-45.019 12.48z"/><path fill="#F16529" d="M64 116.8l36.378-10.086 8.559-95.878H64z"/><path fill="#EBEBEB" d="M64 52.455H45.788L44.53 38.361H64V24.599H29.489l.33 3.692 3.382 37.927H64zm0 35.743l-.061.017-15.327-4.14-.979-10.975H33.816l1.928 21.609 28.193 7.826.063-.017z"/><path fill="#fff" d="M63.952 52.455v13.763h16.947l-1.597 17.849-15.35 4.143v14.319l28.215-7.82.207-2.325 3.234-36.233.335-3.696h-3.708zm0-27.856v13.762h33.244l.276-3.092.628-6.978.329-3.692z"/></svg>
                    )}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="px-4 py-2 bg-white rounded-lg text-gray-900 font-medium text-sm">
                      {t('projects.openProject')}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <div className={`flex-1 min-w-0 ${isRTL ? 'text-right' : 'text-left'}`}>
                      <h3 className="font-semibold text-white truncate">
                        {project.name}
                      </h3>
                      <div className={`flex items-center gap-2 mt-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <span className="inline-block text-xs px-2 py-0.5 bg-white/10 text-white/70 rounded-full">
                          {project.projectType === 'vite' ? 'React' : 'HTML'}
                        </span>
                        {project.isPublished && (
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 bg-green-500/20 text-green-400 rounded-full ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <ExternalLink className="w-3 h-3" />
                            Live
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpenId(menuOpenId === project.id ? null : project.id);
                        }}
                        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-white/60" />
                      </button>

                      {menuOpenId === project.id && (
                        <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} bottom-full mb-1 w-36 bg-gray-900 border border-white/10 rounded-xl shadow-xl overflow-hidden z-[100]`}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onForkProject(project.id);
                              setMenuOpenId(null);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-white/10 transition-colors text-sm text-white/80 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <Copy className="w-4 h-4" />
                            {t('projects.fork')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteProject(project.id);
                              setMenuOpenId(null);
                            }}
                            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-red-500/20 text-red-400 transition-colors text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            {t('projects.delete')}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className={`flex items-center gap-2 text-xs text-white/50 ${isRTL ? 'flex-row-reverse' : ''}`}>
                    <Clock className="w-3 h-3" />
                    <span>
                      {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* View All Link */}
        {projects.length > 6 && (
          <div className="mt-8 text-center">
            <a
              href="/dashboard"
              className="text-white/60 hover:text-white transition-colors text-sm underline underline-offset-4"
            >
              {t('projects.viewAll', { count: projects.length })} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
};
