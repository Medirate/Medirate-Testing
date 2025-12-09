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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clipboard, setClipboard] = useState<ClipboardItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<FileNode | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: FileNode } | null>(null);
  const [renamingItem, setRenamingItem] = useState<FileNode | null>(null);
  const [newName, setNewName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState<{ parentPath: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingTo, setUploadingTo] = useState<string | null>(null);

  // Load folder tree
  const loadTree = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/documents/tree');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load folder tree');
      }
      const data = await response.json();
      // Tree is already hierarchical from the API
      setTree(data.tree || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  // Get parent folder path for an item
  const getParentPath = (item: FileNode): string => {
    if (item.parentId) return item.parentId;
    // Extract parent path from item path
    const pathParts = item.path.split('/').filter(p => p);
    if (pathParts.length > 1) {
      pathParts.pop(); // Remove the item name
      return pathParts.join('/');
    }
    return ''; // Root level
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
  const handlePaste = async (targetFolderPath: string) => {
    if (!clipboard) return;

    try {
      const oldPath = clipboard.item.path;
      const fileName = clipboard.item.name;
      const newPath = targetFolderPath ? `${targetFolderPath}/${fileName}` : fileName;

      if (clipboard.type === 'cut') {
        // Move file/folder
        const response = await fetch('/api/documents/move', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPath,
            newPath,
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || 'Failed to move');
        }
      } else {
        // Copy file/folder
        const response = await fetch('/api/documents/copy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            oldPath,
            newPath,
          }),
        });
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.details || 'Failed to copy');
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
        body: JSON.stringify({ pathname: item.path }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to delete');
      }
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
      const oldPath = item.path;
      const pathParts = oldPath.split('/').filter(p => p);
      pathParts[pathParts.length - 1] = newName.trim();
      const newPath = pathParts.join('/');

      const response = await fetch('/api/documents/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oldPath,
          newPath,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to rename');
      }
      await loadTree();
      setRenamingItem(null);
      setNewName('');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Create folder
  const handleCreateFolder = async (parentPath: string, folderName: string) => {
    if (!folderName.trim()) return;

    try {
      const response = await fetch('/api/documents/create-folder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentPath: parentPath || '',
          folderName: folderName.trim(),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to create folder');
      }
      await loadTree();
      setCreatingFolder(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Upload file
  const handleUpload = async (folderPath: string, file: File) => {
    try {
      setUploadingTo(folderPath);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('parentPath', folderPath || '');

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to upload');
      }
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
              handlePaste(node.path);
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
                    setCreatingFolder({ parentPath: node.path, name: '' });
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
                    setUploadingTo(node.path);
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
                setCreatingFolder({ parentPath: '', name: '' });
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
                    const parentPath = getParentPath(contextMenu.item);
                    handlePaste(parentPath);
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
                    handleCreateFolder(creatingFolder.parentPath, creatingFolder.name);
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
                  onClick={() => handleCreateFolder(creatingFolder.parentPath, creatingFolder.name)}
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
            if (file && uploadingTo !== null) {
              handleUpload(uploadingTo, file);
            }
            e.target.value = '';
            setUploadingTo(null);
          }}
        />
      </div>
    </AppLayout>
  );
}

