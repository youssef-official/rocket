import type { ProjectFile } from '@/types';

interface VercelDeployment {
  id: string;
  url: string;
  readyState: string;
  alias?: string[];
}

interface VercelProject {
  id: string;
  name: string;
}

export async function createVercelProject(
  token: string,
  projectName: string
): Promise<VercelProject | null> {
  try {
    const safeName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const response = await fetch('https://api.vercel.com/v9/projects', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        framework: 'vite',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      // If project exists, try to get it
      if (error.error?.code === 'project_already_exists') {
        return getVercelProject(token, safeName);
      }
      console.error('Vercel API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating Vercel project:', error);
    return null;
  }
}

async function getVercelProject(
  token: string,
  projectName: string
): Promise<VercelProject | null> {
  try {
    const response = await fetch(
      `https://api.vercel.com/v9/projects/${projectName}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export async function deployToVercel(
  token: string,
  projectName: string,
  files: Record<string, ProjectFile>
): Promise<VercelDeployment | null> {
  try {
    const safeName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // Create project first (or get existing)
    const project = await createVercelProject(token, projectName);
    if (!project) {
      console.error('Failed to create/get Vercel project');
      return null;
    }

    // Convert files to Vercel format
    const vercelFiles = Object.entries(files).map(([path, file]) => ({
      file: path.startsWith('/') ? path.substring(1) : path,
      data: file.content,
    }));

    // Add or fix package.json to include all required dependencies
    const pkgIdx = vercelFiles.findIndex(f => f.file === 'package.json');
    const basePkg = {
      name: safeName,
      private: true,
      version: '0.0.0',
      type: 'module',
      scripts: {
        dev: 'vite',
        build: 'vite build',
        preview: 'vite preview',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
        'framer-motion': '^11.0.0',
        'lucide-react': '^0.400.0',
        clsx: '^2.1.0',
        'tailwind-merge': '^2.2.0',
      },
      devDependencies: {
        '@types/react': '^18.2.0',
        '@types/react-dom': '^18.2.0',
        '@vitejs/plugin-react': '^4.0.0',
        typescript: '^5.0.0',
        vite: '^5.0.0',
        tailwindcss: '^3.4.0',
        postcss: '^8.4.0',
        autoprefixer: '^10.4.0',
      },
    };

    if (pkgIdx === -1) {
      vercelFiles.push({ file: 'package.json', data: JSON.stringify(basePkg, null, 2) });
    } else {
      // Merge missing deps into existing package.json
      try {
        const existing = JSON.parse(vercelFiles[pkgIdx].data);
        existing.dependencies = { ...basePkg.dependencies, ...(existing.dependencies || {}) };
        existing.devDependencies = { ...basePkg.devDependencies, ...(existing.devDependencies || {}) };
        vercelFiles[pkgIdx].data = JSON.stringify(existing, null, 2);
      } catch {
        vercelFiles[pkgIdx].data = JSON.stringify(basePkg, null, 2);
      }
    }

    // Add vite.config if not exists
    const hasViteConfig = vercelFiles.some(f => 
      f.file === 'vite.config.ts' || f.file === 'vite.config.js'
    );
    if (!hasViteConfig) {
      vercelFiles.push({
        file: 'vite.config.ts',
        data: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`,
      });
    }

    // Create deployment
    const response = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: safeName,
        files: vercelFiles,
        projectSettings: {
          framework: 'vite',
          buildCommand: 'npm run build',
          outputDirectory: 'dist',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Vercel deployment error:', error);
      return null;
    }

    const deployment = await response.json();
    return {
      id: deployment.id,
      url: `https://${deployment.url}`,
      readyState: deployment.readyState,
      alias: deployment.alias,
    };
  } catch (error) {
    console.error('Error deploying to Vercel:', error);
    return null;
  }
}

export async function getDeploymentStatus(
  token: string,
  deploymentId: string
): Promise<VercelDeployment | null> {
  try {
    const response = await fetch(
      `https://api.vercel.com/v13/deployments/${deploymentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) return null;

    const data = await response.json();
    return {
      id: data.id,
      url: `https://${data.url}`,
      readyState: data.readyState,
      alias: data.alias,
    };
  } catch {
    return null;
  }
}
