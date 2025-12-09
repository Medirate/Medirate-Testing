import { NextRequest, NextResponse } from 'next/server';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { list } from '@vercel/blob';

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: number;
  modifiedTime?: string;
  parentId?: string;
  children?: FileNode[];
}

// Build hierarchical tree from flat list of paths
function buildTreeFromPaths(blobs: any[]): FileNode[] {
  const nodeMap = new Map<string, FileNode>();
  const roots: FileNode[] = [];

  // First pass: create all nodes
  blobs.forEach(blob => {
    const pathname = blob.pathname || '';
    const pathParts = pathname.split('/').filter((part: string) => part && part !== '');
    
    if (pathParts.length === 0) return;

    // Create folder nodes for each path segment
    let currentPath = '';
    pathParts.forEach((part: string, index: number) => {
      const isLast = index === pathParts.length - 1;
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!nodeMap.has(currentPath)) {
        const node: FileNode = {
          id: currentPath,
          name: part,
          type: isLast ? 'file' : 'folder',
          path: currentPath,
          parentId: parentPath || undefined,
          children: isLast ? undefined : [],
          size: isLast ? blob.size : undefined,
          modifiedTime: isLast ? blob.uploadedAt.toISOString() : undefined,
        };
        nodeMap.set(currentPath, node);

        if (!parentPath) {
          roots.push(node);
        } else {
          const parent = nodeMap.get(parentPath);
          if (parent && parent.children) {
            parent.children.push(node);
          }
        }
      }
    });
  });

  // Sort children
  const sortNodes = (nodes: FileNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) {
        return a.type === 'folder' ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
    nodes.forEach(node => {
      if (node.children) {
        sortNodes(node.children);
      }
    });
  };

  sortNodes(roots);
  return roots;
}

export async function GET(request: NextRequest) {
  try {
    const { getUser } = await getKindeServerSession();
    const user = await getUser();
    
    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const adminEmails = ['dev@metasysconsulting.com', 'gnersess@medirate.net'];
    if (!adminEmails.includes(user.email)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get all files from Vercel Blob
    const { blobs } = await list();
    
    // Filter out metadata, archives, and billing manuals
    const documentBlobs = blobs.filter(blob => {
      const p = (blob.pathname || '');
      if (p.startsWith('_metadata/')) return false;
      if (p.toLowerCase().endsWith('.json')) return false;
      const pathParts = p.split('/').filter(part => part && part !== '');
      const hasArchiveFolder = pathParts.some(part => 
        part.toUpperCase().includes('ARCHIVE') || 
        part.toUpperCase().endsWith('_ARCHIVE')
      );
      if (hasArchiveFolder) return false;
      const hasBillingManuals = pathParts.some(part => {
        const normalized = part.toUpperCase().replace(/[_\s-]/g, '');
        return normalized === 'BILLINGMANUALS' || 
               (part.toUpperCase().includes('BILLING') && part.toUpperCase().includes('MANUAL'));
      });
      if (hasBillingManuals) return false;
      return true;
    });

    // Build tree structure
    const tree = buildTreeFromPaths(documentBlobs);

    return NextResponse.json({ 
      success: true, 
      tree 
    });
  } catch (error: any) {
    console.error('Get tree error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json({ 
      error: 'Failed to get folder tree',
      details: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
}

