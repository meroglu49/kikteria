import { Octokit } from '@octokit/rest';
import * as fs from 'fs';
import * as path from 'path';

let connectionSettings: any;

async function getAccessToken() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;
  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    { headers: { 'Accept': 'application/json', 'X-Replit-Token': xReplitToken! } }
  ).then(res => res.json()).then(data => data.items?.[0]);
  return connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;
}

const IGNORE_DIRS = new Set(['node_modules', '.git', '.cache', '.local', 'dist', '.config', '.upm', '__pycache__', 'tmp', '/tmp']);
const IGNORE_FILES = new Set(['.replit', 'replit.nix', '.replit.nix']);

function getAllFiles(dir: string, base: string = ''): { path: string; fullPath: string }[] {
  const results: { path: string; fullPath: string }[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const relPath = base ? `${base}/${entry.name}` : entry.name;
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      results.push(...getAllFiles(fullPath, relPath));
    } else {
      if (IGNORE_FILES.has(entry.name)) continue;
      try {
        const stat = fs.statSync(fullPath);
        if (stat.size > 1024 * 1024) continue;
        results.push({ path: relPath, fullPath });
      } catch {}
    }
  }
  return results;
}

function isBinaryFile(filePath: string): boolean {
  const binaryExts = new Set(['.png', '.jpg', '.jpeg', '.gif', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.svg', '.mp3', '.wav', '.ogg', '.mp4', '.webm', '.zip', '.tar', '.gz']);
  const ext = path.extname(filePath).toLowerCase();
  return binaryExts.has(ext);
}

async function main() {
  const token = await getAccessToken();
  const octokit = new Octokit({ auth: token });
  
  const owner = 'meroglu49';
  const repo = 'kikteria';
  
  console.log('Collecting files...');
  const files = getAllFiles('/home/runner/workspace');
  console.log(`Found ${files.length} files to push`);
  
  const treeItems: { path: string; mode: '100644'; type: 'blob'; sha: string }[] = [];
  
  let count = 0;
  const batchSize = 5;
  
  for (let i = 0; i < files.length; i += batchSize) {
    const batch = files.slice(i, i + batchSize);
    const promises = batch.map(async (file) => {
      try {
        if (isBinaryFile(file.fullPath)) {
          const content = fs.readFileSync(file.fullPath).toString('base64');
          const { data } = await octokit.git.createBlob({
            owner, repo,
            content,
            encoding: 'base64',
          });
          return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: data.sha };
        } else {
          const content = fs.readFileSync(file.fullPath, 'utf-8');
          const { data } = await octokit.git.createBlob({
            owner, repo,
            content,
            encoding: 'utf-8',
          });
          return { path: file.path, mode: '100644' as const, type: 'blob' as const, sha: data.sha };
        }
      } catch (err: any) {
        console.error(`Failed to create blob for ${file.path}: ${err.message}`);
        return null;
      }
    });
    
    const results = await Promise.all(promises);
    for (const r of results) {
      if (r) treeItems.push(r);
    }
    count += batch.length;
    if (count % 50 === 0) console.log(`  Uploaded ${count}/${files.length} files...`);
  }
  
  console.log(`Creating tree with ${treeItems.length} blobs...`);
  const { data: tree } = await octokit.git.createTree({
    owner, repo,
    tree: treeItems,
  });
  
  console.log('Creating commit...');
  const { data: commit } = await octokit.git.createCommit({
    owner, repo,
    message: 'Kikteria v10.1 - Full source code deploy\n\nUI redesign with performance optimizations, AnimatePresence transitions,\nmemoized HUD components, and snappier button interactions.',
    tree: tree.sha,
  });
  
  console.log('Updating main branch...');
  try {
    await octokit.git.updateRef({
      owner, repo,
      ref: 'heads/main',
      sha: commit.sha,
      force: true,
    });
  } catch {
    try {
      await octokit.git.createRef({
        owner, repo,
        ref: 'refs/heads/main',
        sha: commit.sha,
      });
    } catch {
      await octokit.git.updateRef({
        owner, repo,
        ref: 'heads/master',
        sha: commit.sha,
        force: true,
      });
    }
  }
  
  console.log(`\nDone! Code pushed to: https://github.com/${owner}/${repo}`);
}

main().catch(console.error);
