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
  Loader2,
  ArrowLeft,
  Home
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
  items: FileNode[];
}

export default function AdminDocumentLibrary() {
  const auth = useRequireAuth();
  const router = useRouter();
  const [allFiles, setAllFiles] = useState<FileNode[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [currentFolderContents, setCurrentFolderContents] = useState<FileNode[]>([]);
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Load all files and navigate to current path
  const loadFiles = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/documents/tree');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.details || 'Failed to load folder tree');
      }
      const data = await response.json();
      // Flatten the tree to get all files
      const flattened = flattenTree(data.tree || []);
      setAllFiles(flattened);
      
      // Navigate to current path (or restore from sessionStorage)
      const savedPath = sessionStorage.getItem('documentLibraryPath') || '';
      navigateToPath(savedPath, flattened);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Flatten tree structure to get all files
  const flattenTree = (nodes: FileNode[]): FileNode[] => {
    const result: FileNode[] = [];
    const traverse = (nodes: FileNode[], parentPath: string = '') => {
      nodes.forEach(node => {
        const fullPath = parentPath ? `${parentPath}/${node.name}` : node.name;
        result.push({
          ...node,
          path: fullPath,
          parentId: parentPath || undefined,
        });
        if (node.children) {
          traverse(node.children, fullPath);
        }
      });
    };
    traverse(nodes);
    return result;
  };

  // Navigate to a specific path
  const navigateToPath = (path: string, files: FileNode[] = allFiles) => {
    setCurrentPath(path);
    sessionStorage.setItem('documentLibraryPath', path);
    
    // Get files/folders in current directory
    const pathParts = path ? path.split('/').filter(p => p) : [];
    const contents = files.filter(file => {
      const filePathParts = file.path.split('/').filter(p => p);
      // Check if file is directly in current path
      if (pathParts.length === 0) {
        // Root level - files with only one path part
        return filePathParts.length === 1;
      } else {
        // Check if file is in this folder (same parent, one level deeper)
        return filePathParts.length === pathParts.length + 1 &&
               filePathParts.slice(0, -1).join('/') === path;
      }
    });
    
    // Separate folders and files, sort them
    // Show ALL folders and files - no filtering
    const folders = contents.filter(f => f.type === 'folder').sort((a, b) => a.name.localeCompare(b.name));
    const filesList = contents.filter(f => f.type === 'file').sort((a, b) => a.name.localeCompare(b.name));
    
    setCurrentFolderContents([...folders, ...filesList]);
  };

  // Navigate into a folder
  const navigateIntoFolder = (folderPath: string) => {
    navigateToPath(folderPath, allFiles);
  };

  // Navigate up one level
  const navigateUp = () => {
    const pathParts = currentPath.split('/').filter(p => p);
    if (pathParts.length > 0) {
      pathParts.pop();
      navigateToPath(pathParts.join('/'), allFiles);
    } else {
      navigateToPath('', allFiles);
    }
  };

  // Navigate to breadcrumb path
  const navigateToBreadcrumb = (index: number) => {
    if (index === 0) {
      // Root
      navigateToPath('', allFiles);
    } else {
      // Get the path from breadcrumbs
      const breadcrumbs = getBreadcrumbs();
      const targetCrumb = breadcrumbs[index];
      if (targetCrumb) {
        navigateToPath(targetCrumb.path, allFiles);
      }
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  // Reload files after operations
  const reloadFiles = async () => {
    await loadFiles();
  };

  // Double-click or click to navigate into folder
  const handleFolderClick = (item: FileNode) => {
    if (item.type === 'folder') {
      navigateIntoFolder(item.path);
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

  // Cut item(s)
  const handleCut = (items: FileNode[]) => {
    if (items.length === 0) return;
    setClipboard({ type: 'cut', items });
    setContextMenu(null);
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Copy item(s)
  const handleCopy = (items: FileNode[]) => {
    if (items.length === 0) return;
    setClipboard({ type: 'copy', items });
    setContextMenu(null);
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Toggle item selection
  const toggleSelection = (itemPath: string) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemPath)) {
      newSelection.delete(itemPath);
    } else {
      newSelection.add(itemPath);
    }
    setSelectedItems(newSelection);
  };

  // Select all in current folder
  const selectAll = () => {
    const allPaths = new Set(currentFolderContents.map(item => item.path));
    setSelectedItems(allPaths);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedItems(new Set());
    setSelectionMode(false);
  };

  // Get selected items as FileNode array
  const getSelectedItems = (): FileNode[] => {
    return currentFolderContents.filter(item => selectedItems.has(item.path));
  };

  // Paste item(s)
  const handlePaste = async (targetFolderPath: string) => {
    if (!clipboard || clipboard.items.length === 0) return;

    try {
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // Process each item
      for (const item of clipboard.items) {
        try {
          const oldPath = item.path;
          const fileName = item.name;
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
            successCount++;
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
            successCount++;
          }
        } catch (err: any) {
          errorCount++;
          errors.push(`${item.name}: ${err.message}`);
        }
      }

      // Show results
      if (errorCount > 0) {
        alert(`Completed: ${successCount} successful, ${errorCount} failed.\n\nErrors:\n${errors.join('\n')}`);
      } else {
        // Only clear clipboard if all succeeded
        setClipboard(null);
      }

      await reloadFiles(); // Reload files
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
      await reloadFiles();
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
      await reloadFiles();
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
      await reloadFiles();
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
      await reloadFiles();
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

  // Get breadcrumb path parts
  const getBreadcrumbs = () => {
    if (!currentPath) return [{ name: 'Root', path: '' }];
    const parts = currentPath.split('/').filter(p => p);
    const breadcrumbs = [{ name: 'Root', path: '' }];
    let current = '';
    parts.forEach(part => {
      current = current ? `${current}/${part}` : part;
      breadcrumbs.push({ name: part, path: current });
    });
    return breadcrumbs;
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
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <h1 className="text-3xl font-bold text-[#012C61]">Document Library Management</h1>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selection Mode Toggle */}
            {!selectionMode ? (
              <button
                onClick={() => setSelectionMode(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
              >
                <Copy className="w-4 h-4" />
                Select
              </button>
            ) : (
              <>
                <button
                  onClick={selectAll}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
                >
                  Select All
                </button>
                <button
                  onClick={clearSelection}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                >
                  Cancel
                </button>
                {selectedItems.size > 0 && (
                  <>
                    <button
                      onClick={() => handleCut(getSelectedItems())}
                      className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm"
                    >
                      <Scissors className="w-4 h-4" />
                      Cut ({selectedItems.size})
                    </button>
                    <button
                      onClick={() => handleCopy(getSelectedItems())}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Copy className="w-4 h-4" />
                      Copy ({selectedItems.size})
                    </button>
                  </>
                )}
              </>
            )}

            {/* Clipboard indicator */}
            {clipboard && !selectionMode && (
              <div className="flex items-center gap-2 px-3 py-1 bg-blue-100 rounded-lg">
                {clipboard.type === 'cut' ? (
                  <Scissors className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {clipboard.type === 'cut' ? 'Cut' : 'Copy'}: {clipboard.items.length} item{clipboard.items.length !== 1 ? 's' : ''}
                  {clipboard.items.length === 1 && ` (${clipboard.items[0].name})`}
                </span>
                <button
                  onClick={() => setClipboard(null)}
                  className="ml-2 text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
            )}

            {/* Paste Here button - shows when clipboard has items */}
            {clipboard && !selectionMode && (
              <button
                onClick={() => handlePaste(currentPath)}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Clipboard className="w-4 h-4" />
                Paste Here
              </button>
            )}

            {!selectionMode && (
              <>
                <button
                  onClick={() => {
                    setCreatingFolder({ parentPath: currentPath, name: '' });
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  New Folder
                </button>
                <button
                  onClick={() => {
                    fileInputRef.current?.click();
                    setUploadingTo(currentPath);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Upload className="w-4 h-4" />
                  Upload File
                </button>
              </>
            )}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {/* Breadcrumb Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={navigateUp}
              disabled={!currentPath}
              className={`p-2 rounded-lg ${currentPath ? 'hover:bg-gray-100' : 'opacity-50 cursor-not-allowed'}`}
              title="Go up one level"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigateToPath('', allFiles)}
              className="p-2 rounded-lg hover:bg-gray-100"
              title="Go to root"
            >
              <Home className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1 flex-1 min-w-0">
              {getBreadcrumbs().map((crumb, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />}
                  <button
                    onClick={() => navigateToBreadcrumb(index)}
                    className={`px-2 py-1 rounded hover:bg-gray-100 truncate max-w-[200px] ${
                      index === getBreadcrumbs().length - 1 ? 'font-semibold text-blue-600' : ''
                    }`}
                    title={crumb.path || 'Root'}
                  >
                    {crumb.name}
                  </button>
                </React.Fragment>
              ))}
            </div>
            <div className="text-sm text-gray-500 px-2">
              {currentPath || 'Root'}
            </div>
          </div>
        </div>

        {/* Current Folder Contents */}
        <div className="bg-white rounded-xl shadow-lg p-4">
          <div className="border rounded-lg overflow-auto" style={{ maxHeight: '70vh' }}>
            {currentFolderContents.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                {loading ? 'Loading...' : 'This folder is empty'}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-1">
                {currentFolderContents.map((item) => {
                  const isFolder = item.type === 'folder';
                  const isSelected = selectedItems.has(item.path);
                  return (
                    <div
                      key={item.path}
                      className={`flex items-center py-2 px-3 hover:bg-gray-100 cursor-pointer group rounded ${
                        selectedItem?.path === item.path && !selectionMode ? 'bg-blue-50' : ''
                      } ${
                        isSelected ? 'bg-blue-100 border-2 border-blue-500' : ''
                      }`}
                      onClick={() => {
                        if (selectionMode) {
                          toggleSelection(item.path);
                        } else {
                          setSelectedItem(item);
                        }
                      }}
                      onDoubleClick={() => {
                        if (!selectionMode) {
                          handleFolderClick(item);
                        }
                      }}
                      onContextMenu={(e) => {
                        if (!selectionMode) {
                          handleContextMenu(e, item);
                        }
                      }}
                      onDragOver={(e) => {
                        if (isFolder && clipboard && !selectionMode) {
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
                        if (isFolder && clipboard && !selectionMode) {
                          handlePaste(item.path);
                        }
                      }}
                    >
                      {/* Checkbox in selection mode */}
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelection(item.path)}
                          onClick={(e) => e.stopPropagation()}
                          className="mr-3 w-4 h-4 cursor-pointer"
                        />
                      )}
                      <div className="flex items-center flex-1 min-w-0">
                        {isFolder ? (
                          <Folder className="w-6 h-6 mr-3 text-blue-500" />
                        ) : (
                          <File className="w-6 h-6 mr-3 text-gray-500" />
                        )}
                        <span className="flex-1 truncate font-medium">{item.name}</span>
                        {item.size && (
                          <span className="text-xs text-gray-500 ml-2">{item.size}</span>
                        )}
                        {item.modifiedTime && (
                          <span className="text-xs text-gray-400 ml-4">
                            {new Date(item.modifiedTime).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      {!selectionMode && (
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                          {isFolder && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCreatingFolder({ parentPath: item.path, name: '' });
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
                                  setUploadingTo(item.path);
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
                              handleContextMenu(e, item);
                            }}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
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
                  handleCut([contextMenu.item]);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Cut
              </button>
              <button
                onClick={() => {
                  handleCopy([contextMenu.item]);
                }}
                className="w-full text-left px-4 py-2 hover:bg-gray-100 flex items-center gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy
              </button>
              {clipboard && (
                <button
                  onClick={() => {
                    handlePaste(currentPath);
                    setContextMenu(null);
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

