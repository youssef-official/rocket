import type { ProjectFile } from '@/types';

interface GitHubRepo {
  name: string;
  html_url: string;
  clone_url: string;
  full_name: string;
}

export async function createGitHubRepo(
  token: string,
  projectName: string,
  description?: string
): Promise<GitHubRepo | null> {
  try {
    const repoName = projectName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    const response = await fetch('https://api.github.com/user/repos', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: repoName,
        description: description || `Built with Rocket - ${projectName}`,
        private: false,
        auto_init: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('GitHub API error:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating GitHub repo:', error);
    return null;
  }
}

export async function uploadFilesToGitHub(
  token: string,
  repoFullName: string,
  files: Record<string, ProjectFile>,
  commitMessage: string = 'Initial commit from Rocket 🚀'
): Promise<boolean> {
  try {
    // Get the user's default branch ref
    const refResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    let baseSha: string | null = null;
    let baseTreeSha: string | null = null;

    if (refResponse.ok) {
      const refData = await refResponse.json();
      baseSha = refData.object.sha;
      
      // Get the tree
      const commitResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/commits/${baseSha}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (commitResponse.ok) {
        const commitData = await commitResponse.json();
        baseTreeSha = commitData.tree.sha;
      }
    }

    // Create blobs for each file
    const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

    for (const [path, file] of Object.entries(files)) {
      const blobResponse = await fetch(
        `https://api.github.com/repos/${repoFullName}/git/blobs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: btoa(unescape(encodeURIComponent(file.content))),
            encoding: 'base64',
          }),
        }
      );

      if (!blobResponse.ok) continue;

      const blobData = await blobResponse.json();
      treeItems.push({
        path: path.startsWith('/') ? path.substring(1) : path,
        mode: '100644',
        type: 'blob',
        sha: blobData.sha,
      });
    }

    // Add README.md
    const readmeContent = generateReadme(repoFullName.split('/')[1]);
    const readmeBlobResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/blobs`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: btoa(unescape(encodeURIComponent(readmeContent))),
          encoding: 'base64',
        }),
      }
    );

    if (readmeBlobResponse.ok) {
      const readmeBlobData = await readmeBlobResponse.json();
      treeItems.push({
        path: 'README.md',
        mode: '100644',
        type: 'blob',
        sha: readmeBlobData.sha,
      });
    }

    // Create tree
    const treeResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/trees`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          base_tree: baseTreeSha,
          tree: treeItems,
        }),
      }
    );

    if (!treeResponse.ok) return false;

    const treeData = await treeResponse.json();

    // Create commit
    const commitPayload: any = {
      message: commitMessage,
      tree: treeData.sha,
    };
    if (baseSha) {
      commitPayload.parents = [baseSha];
    }

    const commitResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitPayload),
      }
    );

    if (!commitResponse.ok) return false;

    const newCommit = await commitResponse.json();

    // Update or create ref
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/refs/heads/main`,
      {
        method: baseSha ? 'PATCH' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: newCommit.sha,
          force: true,
        }),
      }
    );

    if (!updateRefResponse.ok && !baseSha) {
      // Try creating the ref
      await fetch(
        `https://api.github.com/repos/${repoFullName}/git/refs`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ref: 'refs/heads/main',
            sha: newCommit.sha,
          }),
        }
      );
    }

    return true;
  } catch (error) {
    console.error('Error uploading files to GitHub:', error);
    return false;
  }
}

function generateReadme(projectName: string): string {
  return `# ${projectName}

<div align="center">
  <img src="https://img.shields.io/badge/Built%20with-Rocket%20🚀-6366f1?style=for-the-badge" alt="Built with Rocket" />
  <img src="https://img.shields.io/badge/Framework-Vite%20+%20React-61dafb?style=for-the-badge" alt="Vite + React" />
  <img src="https://img.shields.io/badge/Styling-Tailwind%20CSS-38bdf8?style=for-the-badge" alt="Tailwind CSS" />
</div>

## 🚀 About

This project was built using **Rocket** - the AI-powered code builder that transforms your ideas into beautiful, functional web applications.

## 🛠️ Tech Stack

- ⚡ **Vite** - Lightning fast build tool
- ⚛️ **React** - UI component library
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📦 **TypeScript** - Type-safe JavaScript

## 📦 Getting Started

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
\`\`\`

## 🔄 Sync

This repository is synced with Rocket. Any changes made here will be reflected in your Rocket project, and vice versa.

---

<div align="center">
  <p>Built with ❤️ using <strong>Rocket</strong></p>
  <p>Thank you for using Rocket to build amazing things! 🚀</p>
</div>
`;
}

export async function syncToGitHub(
  token: string,
  repoFullName: string,
  files: Record<string, ProjectFile>,
  commitMessage: string
): Promise<boolean> {
  return uploadFilesToGitHub(token, repoFullName, files, commitMessage);
}
