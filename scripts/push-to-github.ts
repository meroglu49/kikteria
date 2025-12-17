// Script to push project to GitHub using Contents API
// Usage: npx tsx scripts/push-to-github.ts <version>

import { getGitHubClient, getAuthenticatedUser } from '../server/github';
import * as fs from 'fs';
import * as path from 'path';

const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  'dist',
  '.replit',
  '.cache',
  '.config',
  '.upm',
  'generated-icon.png',
  '.breakpoints',
  'replit.nix',
  '.gitignore',
  'package-lock.json',
];

function shouldIgnore(filePath: string): boolean {
  return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function getAllFiles(dir: string, baseDir: string = dir): string[] {
  const files: string[] = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (shouldIgnore(relativePath)) continue;
    
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      files.push(relativePath);
    }
  }
  
  return files;
}

async function pushToGitHub(version: string) {
  console.log(`Pushing Kikteria ${version} to GitHub...`);
  
  try {
    const octokit = await getGitHubClient();
    const user = await getAuthenticatedUser();
    console.log(`Authenticated as: ${user.login}`);
    
    const repoName = 'kikteria';
    
    // Get or create repository
    let repo;
    try {
      const existingRepo = await octokit.repos.get({
        owner: user.login,
        repo: repoName,
      });
      repo = existingRepo.data;
      console.log(`Using existing repository: ${repo.html_url}`);
    } catch (e) {
      const response = await octokit.repos.createForAuthenticatedUser({
        name: repoName,
        description: 'Kikteria - A colorful bacteria placement puzzle game',
        private: false,
        auto_init: false,
      });
      repo = response.data;
      console.log(`Created new repository: ${repo.html_url}`);
    }
    
    const projectDir = process.cwd();
    const files = getAllFiles(projectDir);
    console.log(`Found ${files.length} files to upload`);
    
    // Upload README first to initialize the repo
    console.log('Initializing repository with README...');
    const readmeContent = fs.readFileSync(path.join(projectDir, 'replit.md'), 'utf-8');
    try {
      await octokit.repos.createOrUpdateFileContents({
        owner: user.login,
        repo: repoName,
        path: 'README.md',
        message: 'Initial commit - Add README',
        content: Buffer.from(readmeContent).toString('base64'),
      });
    } catch (e: any) {
      // File might already exist, update it
      if (e.status === 422) {
        const existing = await octokit.repos.getContent({
          owner: user.login,
          repo: repoName,
          path: 'README.md',
        });
        await octokit.repos.createOrUpdateFileContents({
          owner: user.login,
          repo: repoName,
          path: 'README.md',
          message: `${version}: Update README`,
          content: Buffer.from(readmeContent).toString('base64'),
          sha: (existing.data as any).sha,
        });
      }
    }
    
    // Wait for repo to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now use Git Data API
    console.log('Getting main branch...');
    const mainRef = await octokit.git.getRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
    });
    const mainSha = mainRef.data.object.sha;
    
    // Create blobs for all files
    console.log('Creating file blobs...');
    const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
    
    let count = 0;
    for (const file of files) {
      const filePath = path.join(projectDir, file);
      const content = fs.readFileSync(filePath);
      const base64Content = content.toString('base64');
      
      const blob = await octokit.git.createBlob({
        owner: user.login,
        repo: repoName,
        content: base64Content,
        encoding: 'base64',
      });
      
      treeItems.push({
        path: file,
        mode: '100644',
        type: 'blob',
        sha: blob.data.sha,
      });
      
      count++;
      if (count % 10 === 0) {
        process.stdout.write(`\r${count}/${files.length} files uploaded`);
      }
    }
    console.log(`\n${count} blobs created`);
    
    // Create tree
    console.log('Creating tree...');
    const tree = await octokit.git.createTree({
      owner: user.login,
      repo: repoName,
      tree: treeItems,
    });
    
    // Create commit
    console.log('Creating commit...');
    const commitMessage = `${version}: Kikteria bacteria puzzle game\n\nFeatures:\n- Unique sound effects for each bacteria type\n- Retro Bomberman-style bomb explosion\n- 8-bit victory fanfare\n- Quick START button\n- 7-level progression system`;
    const commit = await octokit.git.createCommit({
      owner: user.login,
      repo: repoName,
      message: commitMessage,
      tree: tree.data.sha,
      parents: [mainSha],
    });
    
    // Update main branch reference
    console.log('Updating main branch...');
    await octokit.git.updateRef({
      owner: user.login,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.data.sha,
      force: true,
    });
    
    // Create version tag
    console.log(`Creating tag ${version}...`);
    try {
      await octokit.git.deleteRef({
        owner: user.login,
        repo: repoName,
        ref: `tags/${version}`,
      });
    } catch (e) {
      // Tag might not exist
    }
    
    await octokit.git.createRef({
      owner: user.login,
      repo: repoName,
      ref: `refs/tags/${version}`,
      sha: commit.data.sha,
    });
    
    console.log(`\n========================================`);
    console.log(`Successfully pushed ${version} to GitHub!`);
    console.log(`Repository: ${repo.html_url}`);
    console.log(`Tag: ${version}`);
    console.log(`========================================`);
    
  } catch (error) {
    console.error('Error pushing to GitHub:', error);
    throw error;
  }
}

const version = process.argv[2] || 'v0.5';
pushToGitHub(version);
