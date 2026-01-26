import type { ProjectFile } from '@/types';

interface GitHubFile {
  path: string;
  sha: string;
  content?: string;
}

interface SyncResult {
  success: boolean;
  message: string;
  updatedFiles?: Record<string, ProjectFile>;
  hasConflicts?: boolean;
}

// Fetch files from GitHub repository
export async function fetchGitHubFiles(
  token: string,
  repoFullName: string
): Promise<GitHubFile[]> {
  try {
    // Get the default branch
    const repoResponse = await fetch(`https://api.github.com/repos/${repoFullName}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!repoResponse.ok) {
      throw new Error('Failed to fetch repository info');
    }

    const repoData = await repoResponse.json();
    const defaultBranch = repoData.default_branch || 'main';

    // Get the tree (all files)
    const treeResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/trees/${defaultBranch}?recursive=1`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!treeResponse.ok) {
      throw new Error('Failed to fetch repository tree');
    }

    const treeData = await treeResponse.json();
    
    // Filter only files (not directories)
    const files = treeData.tree
      .filter((item: any) => item.type === 'blob')
      .map((item: any) => ({
        path: item.path,
        sha: item.sha,
      }));

    return files;
  } catch (error) {
    console.error('Error fetching GitHub files:', error);
    return [];
  }
}

// Fetch content of a specific file from GitHub
export async function fetchGitHubFileContent(
  token: string,
  repoFullName: string,
  filePath: string
): Promise<string | null> {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${repoFullName}/contents/${filePath}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    // Decode base64 content
    if (data.content) {
      return decodeURIComponent(escape(atob(data.content.replace(/\n/g, ''))));
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching file content:', error);
    return null;
  }
}

// Pull changes from GitHub to local project
export async function pullFromGitHub(
  token: string,
  repoFullName: string,
  localFiles: Record<string, ProjectFile>
): Promise<SyncResult> {
  try {
    const githubFiles = await fetchGitHubFiles(token, repoFullName);
    
    if (githubFiles.length === 0) {
      return { success: false, message: 'No files found in repository' };
    }

    const updatedFiles: Record<string, ProjectFile> = { ...localFiles };
    let changedCount = 0;

    // Fetch content for each file
    for (const file of githubFiles) {
      // Skip certain files
      if (file.path === 'README.md' || file.path.startsWith('.git')) {
        continue;
      }

      const content = await fetchGitHubFileContent(token, repoFullName, file.path);
      
      if (content !== null) {
        const localFile = localFiles[file.path];
        
        // Only update if content is different
        if (!localFile || localFile.content !== content) {
          updatedFiles[file.path] = {
            name: file.path.split('/').pop() || file.path,
            path: file.path,
            content,
            language: getLanguageFromPath(file.path),
          };
          changedCount++;
        }
      }
    }

    if (changedCount === 0) {
      return { success: true, message: 'Already up to date', updatedFiles };
    }

    return {
      success: true,
      message: `Pulled ${changedCount} file${changedCount > 1 ? 's' : ''} from GitHub`,
      updatedFiles,
    };
  } catch (error) {
    console.error('Error pulling from GitHub:', error);
    return { success: false, message: 'Failed to pull from GitHub' };
  }
}

// Push changes from local project to GitHub
export async function pushToGitHub(
  token: string,
  repoFullName: string,
  localFiles: Record<string, ProjectFile>,
  commitMessage: string = 'Sync from Rocket 🚀'
): Promise<SyncResult> {
  try {
    // Get current ref
    const refResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/refs/heads/main`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!refResponse.ok) {
      return { success: false, message: 'Repository not initialized' };
    }

    const refData = await refResponse.json();
    const baseSha = refData.object.sha;

    // Get the base tree
    const commitResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/commits/${baseSha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!commitResponse.ok) {
      return { success: false, message: 'Failed to get base commit' };
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create blobs and tree items
    const treeItems: { path: string; mode: string; type: string; sha: string }[] = [];

    for (const [path, file] of Object.entries(localFiles)) {
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

    // Create new tree
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

    if (!treeResponse.ok) {
      return { success: false, message: 'Failed to create tree' };
    }

    const treeData = await treeResponse.json();

    // Create commit
    const newCommitResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/commits`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: commitMessage,
          tree: treeData.sha,
          parents: [baseSha],
        }),
      }
    );

    if (!newCommitResponse.ok) {
      return { success: false, message: 'Failed to create commit' };
    }

    const newCommit = await newCommitResponse.json();

    // Update ref
    const updateRefResponse = await fetch(
      `https://api.github.com/repos/${repoFullName}/git/refs/heads/main`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sha: newCommit.sha,
          force: false,
        }),
      }
    );

    if (!updateRefResponse.ok) {
      return { success: false, message: 'Failed to update reference' };
    }

    return {
      success: true,
      message: `Pushed ${treeItems.length} file${treeItems.length > 1 ? 's' : ''} to GitHub`,
    };
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    return { success: false, message: 'Failed to push to GitHub' };
  }
}

// Detect file language from path
function getLanguageFromPath(path: string): string {
  const ext = path.split('.').pop()?.toLowerCase();
  const langMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    css: 'css',
    html: 'html',
    json: 'json',
    md: 'markdown',
    svg: 'xml',
  };
  return langMap[ext || ''] || 'text';
}

// Check if there are differences between local and remote
export async function checkSyncStatus(
  token: string,
  repoFullName: string,
  localFiles: Record<string, ProjectFile>
): Promise<{ needsPull: boolean; needsPush: boolean; message: string }> {
  try {
    const githubFiles = await fetchGitHubFiles(token, repoFullName);
    
    const localPaths = new Set(Object.keys(localFiles));
    const remotePaths = new Set(githubFiles.map(f => f.path));

    // Check for files only in local
    const localOnly = [...localPaths].filter(p => !remotePaths.has(p));
    
    // Check for files only in remote (excluding README)
    const remoteOnly = [...remotePaths].filter(p => !localPaths.has(p) && p !== 'README.md' && !p.startsWith('.git'));

    const needsPush = localOnly.length > 0;
    const needsPull = remoteOnly.length > 0;

    let message = 'Synced';
    if (needsPush && needsPull) {
      message = 'Changes on both sides';
    } else if (needsPush) {
      message = `${localOnly.length} local change${localOnly.length > 1 ? 's' : ''} to push`;
    } else if (needsPull) {
      message = `${remoteOnly.length} remote change${remoteOnly.length > 1 ? 's' : ''} to pull`;
    }

    return { needsPull, needsPush, message };
  } catch (error) {
    console.error('Error checking sync status:', error);
    return { needsPull: false, needsPush: false, message: 'Unable to check sync status' };
  }
}
