"use client";

import { useState, useEffect } from 'react';
import Modal from './modal';
import { FaBookmark, FaTrash, FaEdit, FaCheck, FaTimes, FaDownload, FaSave } from 'react-icons/fa';

interface DashboardTemplate {
  id: string;
  template_name: string;
  template_data: {
    selections: Record<string, string | null>;
    startDate?: string | null;
    endDate?: string | null;
    sortConfig?: Array<{ key: string; direction: 'asc' | 'desc' }>;
    displayedItems?: number;
  };
  created_at: string;
  updated_at: string;
}

interface TemplatesIconProps {
  onLoadTemplate: (template: DashboardTemplate['template_data']) => void;
  currentSelections: Record<string, string | null>;
  currentStartDate: Date | null;
  currentEndDate: Date | null;
  currentSortConfig: Array<{ key: string; direction: 'asc' | 'desc' }>;
  currentDisplayedItems: number;
}

const TemplatesIcon = ({
  onLoadTemplate,
  currentSelections,
  currentStartDate,
  currentEndDate,
  currentSortConfig,
  currentDisplayedItems,
}: TemplatesIconProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<DashboardTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch templates on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard-templates?page=dashboard');
      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setTemplates(data.templates || []);
      }
    } catch (err) {
      setError('Failed to load templates');
      console.error('Error fetching templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplateName.trim()) {
      setError('Template name is required');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const templateData = {
        selections: currentSelections,
        startDate: currentStartDate ? currentStartDate.toISOString() : null,
        endDate: currentEndDate ? currentEndDate.toISOString() : null,
        sortConfig: currentSortConfig,
        displayedItems: currentDisplayedItems,
      };

      const response = await fetch('/api/dashboard-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: newTemplateName.trim(),
          template_data: templateData,
          page_name: 'dashboard',
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setNewTemplateName('');
        await fetchTemplates();
      }
    } catch (err) {
      setError('Failed to save template');
      console.error('Error saving template:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleLoadTemplate = (template: DashboardTemplate) => {
    onLoadTemplate(template.template_data);
    setIsOpen(false);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      const response = await fetch(`/api/dashboard-templates?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        await fetchTemplates();
      }
    } catch (err) {
      setError('Failed to delete template');
      console.error('Error deleting template:', err);
    }
  };

  const handleStartRename = (template: DashboardTemplate) => {
    setEditingId(template.id);
    setEditingName(template.template_name);
  };

  const handleCancelRename = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleSaveRename = async (id: string) => {
    if (!editingName.trim()) {
      setError('Template name is required');
      return;
    }

    try {
      const response = await fetch('/api/dashboard-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          template_name: editingName.trim(),
        }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else {
        setEditingId(null);
        setEditingName('');
        await fetchTemplates();
      }
    } catch (err) {
      setError('Failed to rename template');
      console.error('Error renaming template:', err);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ top: '8.5rem' }}
        className="fixed right-4 z-[1000] px-4 py-2 bg-[#012C61] text-white rounded-lg shadow-lg hover:bg-[#001a3d] transition-colors flex items-center space-x-2"
        aria-label="View Templates"
      >
        <FaBookmark className="h-5 w-5" />
        <span>Templates</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false);
          setNewTemplateName('');
          setError(null);
          setEditingId(null);
        }}
        width="max-w-2xl"
        className="z-[1001]"
      >
        <div className="p-6 flex flex-col h-[80vh]">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular">
              Dashboard Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Save and load your filter configurations
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Save New Template */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-[#012C61] mb-2">Save Current Configuration</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
                placeholder="Enter template name..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSaveTemplate();
                  }
                }}
              />
              <button
                onClick={handleSaveTemplate}
                disabled={saving || !newTemplateName.trim()}
                className="px-4 py-2 bg-[#012C61] text-white rounded-md hover:bg-[#001a3d] transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaSave className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading templates...</div>
            ) : templates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No templates saved yet. Save your first template above!
              </div>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {editingId === template.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61]"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveRename(template.id);
                            } else if (e.key === 'Escape') {
                              handleCancelRename();
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveRename(template.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Save"
                        >
                          <FaCheck className="h-4 w-4" />
                        </button>
                        <button
                          onClick={handleCancelRename}
                          className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Cancel"
                        >
                          <FaTimes className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{template.template_name}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            Saved {new Date(template.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleLoadTemplate(template)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Load Template"
                          >
                            <FaDownload className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleStartRename(template)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title="Rename"
                          >
                            <FaEdit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <FaTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
};

export default TemplatesIcon;

