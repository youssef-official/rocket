export type ViewType = 'chat' | 'code' | 'preview' | 'database';

export interface ProjectFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export interface ProjectData {
  id: string;
  name: string;
  description?: string;
  projectType: 'vite' | 'html';
  files: Record<string, ProjectFile>;
  isPublished: boolean;
  publishedSlug?: string;
  createdAt: string;
  updatedAt: string;
  generatedName?: string;
  buildingPlan?: string[];
  generationStatus?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  imageUrl?: string;
  imageUrls?: string[];
  actionsTaken?: FileActivity[];
  creditsUsed?: number;
  createdAt: string;
}

export interface User {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  projectType: 'vite' | 'html';
  files: Record<string, ProjectFile>;
  isPublished: boolean;
  publishedSlug?: string;
  createdAt: string;
  updatedAt: string;
  generatedName?: string;
  buildingPlan?: string[];
  generationStatus?: string;
}

export interface FileActivity {
  name: string;
  status: 'editing' | 'done';
  action: 'read' | 'edited' | 'created' | 'analyzed_image';
}
