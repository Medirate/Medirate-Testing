"use client";

import { useState, useEffect, useMemo } from 'react';
import Modal from './modal';
import { FaBookmark, FaTrash, FaTimes, FaDownload, FaSave, FaSearch } from 'react-icons/fa';

interface ServiceData {
  state_name: string;
  service_category: string;
  service_code: string;
  modifier_1?: string;
  modifier_1_details?: string;
  modifier_2?: string;
  modifier_2_details?: string;
  modifier_3?: string;
  modifier_3_details?: string;
  modifier_4?: string;
  modifier_4_details?: string;
  rate: string;
  rate_effective_date: string;
  program: string;
  location_region: string;
  rate_per_hour?: string;
  duration_unit?: string;
  service_description?: string;
  provider_type?: string;
}

interface HistoricalRatesTemplate {
  id: string;
  template_name: string;
  template_data: {
    selections: Record<string, string | null>;
    selectedEntries?: ServiceData[];
  };
  created_at: string;
  updated_at: string;
}

interface HistoricalRatesTemplatesIconProps {
  onLoadTemplate: (template: HistoricalRatesTemplate['template_data']) => void;
  currentSelections: Record<string, string | null>;
  currentSelectedEntries?: ServiceData[];
}

const HistoricalRatesTemplatesIcon = ({
  onLoadTemplate,
  currentSelections,
  currentSelectedEntries = [],
}: HistoricalRatesTemplatesIconProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [templates, setTemplates] = useState<HistoricalRatesTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch templates on mount and when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  // Filter templates based on search term
  const filteredTemplates = useMemo(() => {
    if (!searchTerm.trim()) {
      return templates;
    }
    const searchLower = searchTerm.toLowerCase().trim();
    return templates.filter(template =>
      template.template_name.toLowerCase().includes(searchLower)
    );
  }, [templates, searchTerm]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/dashboard-templates?page=historical-rates');
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
        selectedEntries: currentSelectedEntries || [],
      };

      const response = await fetch('/api/dashboard-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_name: newTemplateName.trim(),
          template_data: templateData,
          page_name: 'historical-rates',
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

  const handleLoadTemplate = (template: HistoricalRatesTemplate) => {
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

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{ top: '10rem' }}
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
          setSearchTerm('');
        }}
        width="max-w-2xl"
        className="z-[1001]"
      >
        <div className="p-6 flex flex-col h-[80vh]">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-[#012C61] uppercase font-lemonMilkRegular">
              Historical Rates Templates
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Save and load your filter configurations and selected entry
            </p>
            <p className="text-xs text-gray-500 mt-2 italic">
              💡 Tip: Templates save your current filters and selected entries. Click "Load" to instantly restore a saved configuration.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Search Bar */}
          {templates.length > 0 && (
            <div className="mb-4">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#012C61] focus:border-transparent"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes className="h-4 w-4" />
                  </button>
                )}
              </div>
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
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No templates found matching "{searchTerm}"
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
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
                          className="px-4 py-2 bg-[#012C61] text-white rounded-md hover:bg-[#001a3d] transition-colors text-sm font-medium"
                        >
                          Load
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

export default HistoricalRatesTemplatesIcon;

