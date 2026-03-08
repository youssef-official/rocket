import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X, MessageSquare, Code, Eye, User, Calendar, ChevronDown, ChevronRight, FileCode, Loader2 } from 'lucide-react';
import { PreviewView } from '@/components/editor/PreviewView';
import type { ProjectFile } from '@/types';

interface AdminProjectViewerProps {
  projectId: string;
  onClose: () => void;
}

export const AdminProjectViewer: React.FC<AdminProjectViewerProps> = ({ projectId, onClose }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [project, setProject] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [owner, setOwner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'code' | 'preview'>('chat');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      try {
        const { data: session } = await supabase.auth.getSession();
        if (!session?.session) { setError('Not authenticated'); setLoading(false); return; }

        const { data, error: fnErr } = await supabase.functions.invoke('admin-project-view', {
          body: { project_id: projectId },
          headers: { Authorization: `Bearer ${session.session.access_token}` },
        });

        if (fnErr) throw new Error(fnErr.message);
        if (data?.error) throw new Error(data.error);

        setProject(data.project);
        setMessages(data.messages || []);
        setVersions(data.versions || []);
        setOwner(data.owner);
      } catch (e: any) {
        setError(e.message || 'Failed to load project');
      } finally {
        setLoading(false);
      }
    })();
  }, [projectId]);

  const files: Record<string, ProjectFile> = project?.files || {};
  const fileKeys = Object.keys(files).sort();

  // Build folder tree
  const buildTree = () => {
    const tree: Record<string, any> = {};
    fileKeys.forEach(key => {
      const parts = key.split('/');
      let current = tree;
      parts.forEach((part, i) => {
        if (i === parts.length - 1) {
          current[part] = { __file: key };
        } else {
          if (!current[part]) current[part] = {};
          current = current[part];
        }
      });
    });
    return tree;
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };

  const renderTree = (node: any, path = '', depth = 0) => {
    return Object.keys(node).sort((a, b) => {
      const aIsFile = node[a].__file;
      const bIsFile = node[b].__file;
      if (aIsFile && !bIsFile) return 1;
      if (!aIsFile && bIsFile) return -1;
      return a.localeCompare(b);
    }).map(key => {
      if (key === '__file') return null;
      const fullPath = path ? `${path}/${key}` : key;
      const item = node[key];
      
      if (item.__file) {
        return (
          <button key={fullPath} onClick={() => setSelectedFile(item.__file)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 text-[12px] rounded transition-colors ${selectedFile === item.__file ? 'bg-[#dbeafe] text-[#1e40af]' : 'text-[#6b6b6b] hover:bg-[#f7f6f3]'}`}
            style={{ paddingLeft: `${(depth + 1) * 12}px` }}>
            <FileCode size={12} className="flex-shrink-0" />
            <span className="truncate">{key}</span>
          </button>
        );
      }

      const isExpanded = expandedFolders.has(fullPath);
      return (
        <div key={fullPath}>
          <button onClick={() => toggleFolder(fullPath)}
            className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[12px] font-medium text-[#191919] hover:bg-[#f7f6f3] rounded transition-colors"
            style={{ paddingLeft: `${depth * 12}px` }}>
            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>{key}</span>
          </button>
          {isExpanded && renderTree(item, fullPath, depth + 1)}
        </div>
      );
    });
  };

  if (loading) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 flex flex-col items-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#2383e2]" />
        <p className="text-[13px] text-[#6b6b6b]">Loading project...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-sm text-center">
        <p className="text-[14px] font-semibold text-[#991b1b] mb-3">{error}</p>
        <button onClick={onClose} className="px-4 py-2 bg-[#f7f6f3] rounded-lg text-[13px] font-medium hover:bg-[#e9e8e4]">Close</button>
      </div>
    </div>
  );

  const selectedFileData = selectedFile ? files[selectedFile] : null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex flex-col backdrop-blur-sm">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-[#e3e2de] px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-[#191919]">{project?.name || 'Untitled'}</h2>
            <div className="flex items-center gap-3 mt-0.5">
              {owner && (
                <span className="flex items-center gap-1.5 text-[11px] text-[#9b9a97]">
                  <User size={10} />
                  {owner.display_name || owner.email}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[11px] text-[#9b9a97]">
                <Calendar size={10} />
                {new Date(project?.created_at).toLocaleDateString()}
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#ede9fe] text-[#5b21b6]">
                {project?.project_type} • {fileKeys.length} files • {messages.length} messages
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs */}
          {(['chat', 'code', 'preview'] as const).map(t => {
            const Icon = t === 'chat' ? MessageSquare : t === 'code' ? Code : Eye;
            return (
              <button key={t} onClick={() => setActiveTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${activeTab === t ? 'bg-[#2383e2] text-white' : 'text-[#6b6b6b] hover:bg-[#f7f6f3]'}`}>
                <Icon size={13} />
                {t === 'chat' ? 'Chat' : t === 'code' ? 'Code' : 'Preview'}
              </button>
            );
          })}
          <button onClick={onClose} className="ml-3 w-8 h-8 rounded-lg flex items-center justify-center text-[#9b9a97] hover:bg-[#f7f6f3] hover:text-[#191919] transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-[#fafaf9]">
        {/* Chat Tab */}
        {activeTab === 'chat' && (
          <div className="h-full overflow-y-auto p-6 max-w-3xl mx-auto space-y-3">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <MessageSquare size={32} className="text-[#c4c3bf] mb-3" />
                <p className="text-[14px] font-semibold text-[#6b6b6b]">No messages</p>
              </div>
            ) : messages.map((m: any) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.role === 'user' ? 'bg-[#2383e2] text-white' : 'bg-white border border-[#e3e2de] text-[#191919]'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase ${m.role === 'user' ? 'text-white/70' : 'text-[#9b9a97]'}`}>{m.role}</span>
                    <span className={`text-[10px] ${m.role === 'user' ? 'text-white/50' : 'text-[#c4c3bf]'}`}>{new Date(m.created_at).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words">{m.content?.slice(0, 2000)}{m.content?.length > 2000 ? '…' : ''}</p>
                  {m.image_url && (
                    <img src={m.image_url} alt="" className="mt-2 rounded-lg max-w-[200px] max-h-[150px] object-cover" />
                  )}
                  {m.credits_used > 0 && (
                    <span className={`inline-block mt-1.5 text-[10px] px-1.5 py-0.5 rounded ${m.role === 'user' ? 'bg-white/20 text-white/80' : 'bg-[#ede9fe] text-[#5b21b6]'}`}>
                      {m.credits_used} credits
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Code Tab */}
        {activeTab === 'code' && (
          <div className="h-full flex">
            {/* File tree */}
            <div className="w-[240px] flex-shrink-0 border-r border-[#e3e2de] bg-white overflow-y-auto p-2">
              <p className="text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wide px-2 mb-2">Files ({fileKeys.length})</p>
              {renderTree(buildTree())}
            </div>
            {/* File content */}
            <div className="flex-1 overflow-auto bg-[#1e1e1e]">
              {selectedFileData ? (
                <div>
                  <div className="sticky top-0 bg-[#2d2d2d] border-b border-[#404040] px-4 py-2 flex items-center gap-2">
                    <FileCode size={12} className="text-[#9b9a97]" />
                    <span className="text-[12px] text-[#cccccc] font-mono">{selectedFile}</span>
                  </div>
                  <pre className="p-4 text-[13px] text-[#d4d4d4] font-mono leading-relaxed whitespace-pre overflow-x-auto">
                    {selectedFileData.content}
                  </pre>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-[#6b6b6b] text-[13px]">Select a file to view</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preview Tab - iframe with sandboxed HTML */}
        {activeTab === 'preview' && (
          <div className="h-full flex items-center justify-center p-6">
            <div className="bg-white rounded-xl border border-[#e3e2de] p-8 text-center max-w-md">
              <Eye size={32} className="text-[#c4c3bf] mx-auto mb-3" />
              <p className="text-[14px] font-semibold text-[#191919] mb-2">Preview</p>
              <p className="text-[12px] text-[#9b9a97] mb-4">
                View this project's live preview by checking the code tab for the full source. 
                The project has {fileKeys.length} files and is {project?.is_published ? 'published' : 'a draft'}.
              </p>
              {project?.vercel_url && (
                <a href={project.vercel_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#2383e2] text-white rounded-lg text-[12px] font-semibold hover:bg-[#1a6ec2] transition-colors">
                  <Eye size={13} /> Open Live Site
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom bar - versions */}
      {versions.length > 0 && (
        <div className="flex-shrink-0 bg-white border-t border-[#e3e2de] px-5 py-2 flex items-center gap-3 overflow-x-auto">
          <span className="text-[10px] font-semibold text-[#9b9a97] uppercase tracking-wide flex-shrink-0">Versions:</span>
          {versions.slice(0, 10).map((v: any) => (
            <span key={v.id} className="flex-shrink-0 px-2.5 py-1 bg-[#f7f6f3] border border-[#e3e2de] rounded text-[11px] text-[#6b6b6b] font-medium">
              v{v.version_number} {v.name ? `— ${v.name}` : ''} 
              <span className="text-[#c4c3bf] ml-1">{new Date(v.created_at).toLocaleDateString()}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
