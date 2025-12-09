"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useRouter } from "next/navigation";
import AppLayout from "@/app/components/applayout";
import { 
  Folder, 
  File, 
  FolderOpen, 
  Scissors, 
  Copy, 
  Clipboard, 
  Trash2, 
  Edit2, 
  Plus, 
  Upload,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Loader2
} from "lucide-react";

interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  size?: string;
  modifiedTime?: string;
  parentId?: string;
  children?: FileNode[];
  expanded?: boolean;
}

interface ClipboardItem {
  type: 'cut' | 'copy';
  item: FileNode;
}

export default function AdminDocumentLibrary() {
  const auth = useRequireAuth();
  const router = useRouter();
  const [tree, setTree] = useState<FileNode[]>([]);
  const [rootFolderId, setRootFolderId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileNode } | null>(null);
  const [renamingItem, setRenamingItem] = useState<FileNode | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState<{ parentId: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);

  // Load folder tree
  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/documents/tree');
      if (!response.ok) {
        throw new Error('Failed to load folder tree');
      }
      const data = await response.json();
      setRootFolderId(data.rootFolderId);
      // Convert flat tree to hierarchical structure
      const hierarchical = buildHierarchicalTree(data.tree, data.rootFolderId);
      setTree(hierarchical);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Convert flat tree to hierarchical structure
  const buildHierarchicalTree = (flatTree: any[], rootId: string): FileNode[] => {
    const map = new Map<string, FileNode>();
    const roots: FileNode[] = [];

    // First pass: create all nodes
    flatTree.forEach(item => {
      const node: FileNode = {
        id: item.id,
        name: item.name,
        type: item.type === 'folder' ? 'folder' : 'file',
        path: item.path,
        size: item.size,
        modifiedTime: item.modifiedTime,
        parentId: item.parentId,
        children: [],
        expanded: false,
      };
      map.set(item.id, node);
    });

    // Second pass: build hierarchy
    flatTree.forEach(item => {
      const node = map.get(item.id)!;
      if (item.parentId && item.parentId !== rootId) {
        const parent = map.get(item.parentId);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(node);
        }
      } else {
        roots.push(node);
      }
    });

    return roots;
  };

  useEffect(() => {
    loadTree();
  }, []);

  // Toggle folder expansion
  const toggleFolder = (item: FileNode) => {
    if (item.type === 'folder') {
      const updateTree = (nodes: FileNode[]): FileNode[] => {
        return nodes.map(node => {
          if (node.id === item.id) {
            return { ...node, expanded: !node.expanded };
          }
          if (node.children) {
            return { ...node, children: updateTree(node.children) };
          }
          return node;
        });
      };
      setTree(updateTree(tree));
    }
  };

  // Find item in tree
  const findItemInTree = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children) {
        const found = findItemInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  // Get parent folder ID for an item
  const getParentId = (item: FileNode): string => {
    if (item.parentId) return item.parentId;
    // If no parentId, find it in the tree
    const findParent = (nodes: FileNode[], targetId: string, parent: FileNode | null = null): FileNode | null => {
      for (const node of nodes) {
        if (node.id === targetId) return parent;
        if (node.children) {
          const found = findParent(node.children, targetId, node);
          if (found) return found;
        }
      }
      return null;
    };
    const parent = findParent(tree, item.id);
    return parent?.id || rootFolderId;
  };

  // Cut item
  const handleCut = (item: FileNode) => {
    setClipboard({ type: 'cut', item });
    setContextMenu(null);
  };

  // Copy item
  const handleCopy = (item: FileNode) => {
    setClipboard({ type: 'copy', item });
    setContextMenu(null);
  };

  // Paste item
  const handlePaste = async (targetFolderId: string) => {
    if (!clipboard) return;

    try {
      if (clipboard.type === 'cut') {
        // Move file/folder
        const response = await fetch('/api/documents/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: clipboard.item.id,
            newParentId: targetFolderId,
            removeFromOldParent: true,
          }),
        });
        if (!response.ok) throw new Error('Failed to move');
      } else {
        // Copy file (folders can't be copied via API easily)
        if (clipboard.item.type === 'file') {
          const response = await fetch('/api/documents/copy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileId: clipboard.item.id,
              newParentId: targetFolderId,
            }),
          });
          if (!response.ok) throw new Error('Failed to copy');
        } else {
          alert('Copying folders is not supported. Please move the folder instead.');
          return;
        }
      }
      setClipboard(null);
      await loadTree(); // Reload tree
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Delete item
  const handleDelete = async (item: FileNode) => {
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      const response = await fetch('/api/documents/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: item.id }),
      });
      if (!response.ok) throw new Error('Failed to delete');
      await loadTree();
      setContextMenu(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Rename item
  const handleRename = async (item: FileNode, newName: string) => {
    if (!newName.trim()) return;

    try {
      const response = await fetch('/api/documents/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: item.id,
          newName: newName.trim(),
        }),
      });
      if (!response.ok) throw new Error('Failed to rename');
      await loadTree();
      setRenamingItem(null);
      setNewName('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Create folder
  const handleCreateFolder = async (parentId: string, folderName: string) => {
    if (!folderName.trim()) return;

    try {
      const response = await fetch('/api/documents/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId,
          folderName: folderName.trim(),
        }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      await loadTree();
      setCreatingFolder(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Upload file
  const handleUpload = async (folderId: string, file: File) => {
    try {
      setUploadingTo(folderId);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderId', folderId); // Use folderId directly

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Failed to upload');
      await loadTree();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setUploadingTo(null);
    }
  };

  // Context menu handler
  const handleContextMenu = (e: React.MouseEvent, item: FileNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
    setSelectedItem(item);
  };

  // Render tree node
  const renderTreeNode = (node: FileNode, level: number = 0): React.ReactElement => {
    const isFolder = node.type === 'folder';
    const isExpanded = node.expanded || false;
    const hasChildren = node.children && node.children.length > 0;
    const indent = level * 24;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center py-1 px-2 hover:bg-gray-100 cursor-pointer group ${
            selectedItem?.id === node.id ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${indent + 8}px` }}
          onClick={() => {
            if (isFolder) toggleFolder(node);
            setSelectedItem(node);
          }}
          onContextMenu={(e) => handleContextMenu(e, node)}
          onDoubleClick={() => {
            if (isFolder) toggleFolder(node);
          }}
          onDragOver={(e) => {
            if (isFolder && clipboard) {
              e.preventDefault();
              e.currentTarget.classList.add('bg-blue-100');
            }
          }}
          onDragLeave={(e) => {
            e.currentTarget.classList.remove('bg-blue-100');
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('bg-blue-100');
            if (isFolder && clipboard) {
              handlePaste(node.id);
            }
          }}
        >
          <div className="flex items-center flex-1 min-w-0">
            {isFolder ? (
              <>
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 mr-1 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 mr-1 text-gray-500" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-5 h-5 mr-2 text-blue-500" />
                ) : (
                  <Folder className="w-5 h-5 mr-2 text-blue-500" />
                )}
              </>
            ) : (
              <>
                <div className="w-6 mr-2" />
                <File className="w-5 h-5 mr-2 text-gray-500" />
              </>
            )}
            <span className="flex-1 truncate">{node.name}</span>
            {node.size && (
              <span className="text-xs text-gray-500 ml-2">{node.size}</span>
            )}
          </div>
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
            {isFolder && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCreatingFolder({ parentId: node.id, name: '' });
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Create folder"
                >
                  <Plus className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                    setUploadingTo(node.id);
                  }}
                  className="p-1 hover:bg-gray-200 rounded"
                  title="Upload file"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleContextMenu(e, node);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>
        {isFolder && isExpanded && hasChildren && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <AppLayout activeTab="adminDashboard">
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeTab="adminDashboard">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-[#012C61]">Document Library Management</h1>
          <div className="flex items-center gap-2">
            {clipboard && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                {clipboard.type === 'cut' ? (
                  <Scissors className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {clipboard.type === 'cut' ? 'Cut' : 'Copy'}: {clipboard.item.name}
                </span>
                <button
                  onClick={() => setClipboard(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            )}
            <button
              onClick={() => {
                setCreatingFolder({ parentId: rootFolderId, name: '' });
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New Folder
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
            {tree.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No files or folders found
              </div>
            ) : (
              tree.map(node => renderTreeNode(node))
            )}
          </div>
        </div>

        {/* Context Menu */}
        {contextMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setContextMenu(null)}
            />
            <div
              className="fixed z-20 bg-white border rounded-lg shadow-lg py-2 min-w-[200px]"
              style={{ left: contextMenu.x, top: contextMenu.y }}
            >
              <button
                onClick={() => {
                  handleCut(contextMenu.item);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Cut
              </button>
              <button
                onClick={() => {
                  handleCopy(contextMenu.item);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              {clipboard && (
                <button
                  onClick={() => {
                    const parentId = getParentId(contextMenu.item);
                    handlePaste(parentId);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
                >
                  <Clipboard className="w-4 h-4" />
                  Paste Here
                </button>
              )}
              <button
                onClick={() => {
                  setRenamingItem(contextMenu.item);
                  setNewName(contextMenu.item.name);
                  setContextMenu(null);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Rename
              </button>
              <button
                onClick={() => {
                  handleDelete(contextMenu.item);
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </>
        )}

        {/* Rename Dialog */}
        {renamingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Rename</h3>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRename(renamingItem, newName);
                  } else if (e.key === 'Escape') {
                    setRenamingItem(null);
                    setNewName('');
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setRenamingItem(null);
                    setNewName('');
                  }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRename(renamingItem, newName)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Rename
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Folder Dialog */}
        {creatingFolder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
            <div className="bg-white rounded-lg p-6 w-96">
              <h3 className="text-lg font-semibold mb-4">Create Folder</h3>
              <input
                type="text"
                value={creatingFolder.name}
                onChange={(e) => setCreatingFolder({ ...creatingFolder, name: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder(creatingFolder.parentId, creatingFolder.name);
                  } else if (e.key === 'Escape') {
                    setCreatingFolder(null);
                  }
                }}
                placeholder="Folder name"
                className="w-full px-3 py-2 border rounded-lg mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCreatingFolder(null)}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCreateFolder(creatingFolder.parentId, creatingFolder.name)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file && uploadingTo) {
              handleUpload(uploadingTo, file);
            }
            e.target.value = '';
          }}
        />
      </div>
    </AppLayout>
  );
}

