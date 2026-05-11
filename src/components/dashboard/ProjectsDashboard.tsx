import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Clock, Trash2, Copy, ExternalLink, Code2, Globe, 
  Sparkles, FolderOpen, MoreVertical, Search, ChevronRight,
  ArrowLeft, ArrowRight
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import { VivoraLogo } from '../shared/VivoraLogo';

interface Project {
  id: string;
  name: string;
  description?: string;
  projectType: 'vite' | 'html';
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsDashboardProps {
  projects: Project[];
  onNewProject: () => void;
  onOpenProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onForkProject: (id: string) => void;
}

export const ProjectsDashboard: React.FC<ProjectsDashboardProps> = ({
  projects,
  onNewProject,
  onOpenProject,
  onDeleteProject,
  onForkProject,
}) => {
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'projects' | 'templates'>('projects');
  const { t, isRTL } = useLanguage();

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className={`max-w-7xl mx-auto flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
          <button 
            onClick={onNewProject}
            className={`flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
          >
            {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
            <span>{isRTL ? 'رجوع' : 'Back'}</span>
          </button>

          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
            <VivoraLogo size="sm" showText={true} />
          </div>

          <div className="w-20" />
        </div>
      </header>

      <div className={`max-w-7xl mx-auto px-6 py-8 flex gap-8 ${isRTL ? 'flex-row-reverse' : ''}`}>
        {/* Sidebar */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('projects')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${
                activeTab === 'projects' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full bg-gray-900 ${isRTL ? 'ml-0 mr-1' : ''}`} />
              {t('projects.title')}
            </button>
            
            <div className="border-t border-dashed border-gray-300 my-2" />
            
            <button
              onClick={() => setActiveTab('templates')}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${isRTL ? 'flex-row-reverse text-right' : 'text-left'} ${
                activeTab === 'templates' 
                  ? 'text-gray-900 font-medium' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              {isRTL ? 'القوالب' : 'Templates'}
            </button>
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Search */}
          <div className="mb-6">
            <div className={`relative max-w-md ${isRTL ? 'mr-0' : ''}`}>
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isRTL ? 'بحث' : 'Search'}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 text-gray-800 placeholder-gray-500`}
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
          </div>

          {/* Projects Grid */}
          {filteredProjects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-20"
            >
              <div className="w-20 h-20 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-6">
                <FolderOpen className="w-10 h-10 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('projects.empty')}</h2>
              <p className="text-gray-600 mb-6">
                {isRTL ? 'أنشئ أول مشروع لك للبدء' : 'Create your first AI-generated project to get started'}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onNewProject}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('projects.newProject')}
              </motion.button>
            </motion.div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence mode="popLayout">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-200 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => onOpenProject(project.id)}
                  >
                    {/* Preview */}
                    <div className="aspect-[4/3] bg-gray-100 border-b border-gray-200 flex items-center justify-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg" />
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <div className={`flex items-start justify-between mb-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <div className={isRTL ? 'text-right' : 'text-left'}>
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {project.name}
                          </h3>
                          <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            {project.projectType === 'vite' ? 'Website' : 'HTML'}
                          </span>
                        </div>

                        {/* Actions Menu */}
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === project.id ? null : project.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>

                          <AnimatePresence>
                            {menuOpenId === project.id && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className={`absolute ${isRTL ? 'left-0' : 'right-0'} top-full mt-1 w-40 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50`}
                              >
                                <button
                                  onClick={() => {
                                    onForkProject(project.id);
                                    setMenuOpenId(null);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                >
                                  <Copy className="w-4 h-4" />
                                  {t('projects.fork')}
                                </button>
                                {project.isPublished && (
                                  <button
                                    className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 transition-colors text-sm text-gray-700 ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                    {isRTL ? 'عرض مباشر' : 'View Live'}
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    onDeleteProject(project.id);
                                    setMenuOpenId(null);
                                  }}
                                  className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-600 transition-colors text-sm ${isRTL ? 'flex-row-reverse text-right' : ''}`}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {t('projects.delete')}
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <div className={`flex items-center gap-2 text-xs text-gray-500 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <Clock className="w-3 h-3" />
                        <span>
                          {isRTL ? 'تم التعديل منذ ' : 'Edited '}
                          {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false })}
                          {isRTL ? '' : ' ago'}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
