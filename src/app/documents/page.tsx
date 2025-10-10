"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText,
  Download,
  Calendar,
  User,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react";

interface Document {
  id: string;
  title: string;
  type: 'state_note' | 'policy' | 'guideline' | 'form' | 'report';
  state?: string;
  category: string;
  description: string;
  uploadDate: string;
  lastModified: string;
  fileSize: string;
  downloadUrl: string;
  tags: string[];
  isPublic: boolean;
}

export default function Documents() {
  const auth = useProtectedPage();
  const router = useRouter();
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedState, setSelectedState] = useState<string>('all');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['state_notes', 'policies']));
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch documents from API

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/documents');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const data = await response.json();
        setDocuments(data.documents || []);
      } catch (err) {
        setError('Failed to load documents');
        console.error('Error fetching documents:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesState = selectedState === 'all' || doc.state === selectedState || !doc.state;
    
    return matchesSearch && matchesCategory && matchesState;
  });

  // Group documents by type
  const groupedDocuments = filteredDocuments.reduce((acc, doc) => {
    if (!acc[doc.type]) {
      acc[doc.type] = [];
    }
    acc[doc.type].push(doc);
    return acc;
  }, {} as Record<string, Document[]>);

  const documentTypes = [
    { key: 'state_note', label: 'State Notes', icon: FileText, description: 'State-specific notes and updates' },
    { key: 'policy', label: 'Policies', icon: FileText, description: 'Policy documents and guidelines' },
    { key: 'guideline', label: 'Guidelines', icon: FileText, description: 'Implementation guidelines' },
    { key: 'form', label: 'Forms', icon: FileText, description: 'Application and reporting forms' },
    { key: 'report', label: 'Reports', icon: FileText, description: 'Analysis and research reports' }
  ];

  const categories = Array.from(new Set(documents.map(doc => doc.category)));
  const states = Array.from(new Set(documents.map(doc => doc.state).filter(Boolean)));

  const toggleSection = (sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleFileUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setUploading(true);
    
    try {
      const formData = new FormData(event.currentTarget);
      
      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        // Refresh documents list
        const fetchResponse = await fetch('/api/documents');
        const data = await fetchResponse.json();
        setDocuments(data.documents || []);
        setShowUploadForm(false);
        // Reset form
        (event.target as HTMLFormElement).reset();
      } else {
        setError('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'state_note':
        return <FileText className="h-4 w-4 text-blue-600" />;
      case 'policy':
        return <FileText className="h-4 w-4 text-green-600" />;
      case 'guideline':
        return <FileText className="h-4 w-4 text-purple-600" />;
      case 'form':
        return <FileText className="h-4 w-4 text-orange-600" />;
      case 'report':
        return <FileText className="h-4 w-4 text-red-600" />;
      default:
        return <File className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'state_note':
        return 'bg-blue-100 text-blue-800';
      case 'policy':
        return 'bg-green-100 text-green-800';
      case 'guideline':
        return 'bg-purple-100 text-purple-800';
      case 'form':
        return 'bg-orange-100 text-orange-800';
      case 'report':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (auth.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AppLayout activeTab="documents">
      <div className="p-4 sm:p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Documents & State Notes</h1>
            <p className="text-gray-600">
              Access policy documents, state notes, guidelines, and other important resources
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Category Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* State Filter */}
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <select
                    value={selectedState}
                    onChange={(e) => setSelectedState(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                  >
                    <option value="all">All States</option>
                    {states.map(state => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upload Section */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Upload Documents</CardTitle>
                  <CardDescription>Upload new documents to the repository</CardDescription>
                </div>
                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {showUploadForm ? 'Cancel' : 'Upload Document'}
                </button>
              </div>
            </CardHeader>
            {showUploadForm && (
              <CardContent>
                <form onSubmit={handleFileUpload} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        name="title"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Document title"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        name="type"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="state_note">State Note</option>
                        <option value="policy">Policy</option>
                        <option value="guideline">Guideline</option>
                        <option value="form">Form</option>
                        <option value="report">Report</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">State (Optional)</label>
                      <input
                        type="text"
                        name="state"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Texas, California"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        type="text"
                        name="category"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., Rate Information"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Document description"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                    <input
                      type="text"
                      name="tags"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., rates, texas, medicaid"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
                    <input
                      type="file"
                      name="file"
                      required
                      accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
                    >
                      {uploading ? 'Uploading...' : 'Upload'}
                    </button>
                  </div>
                </form>
              </CardContent>
            )}
          </Card>

          {/* Loading State */}
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading documents...</span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  <span>{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents by Type */}
          {!isLoading && !error && (
            <div className="space-y-6">
              {documentTypes.map(typeInfo => {
                const typeDocs = groupedDocuments[typeInfo.key] || [];
                const isExpanded = expandedSections.has(typeInfo.key);
                
                if (typeDocs.length === 0) return null;

                return (
                  <Card key={typeInfo.key}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSection(typeInfo.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <typeInfo.icon className="h-5 w-5 mr-3 text-gray-600" />
                          <div>
                            <CardTitle className="text-lg">{typeInfo.label}</CardTitle>
                            <CardDescription>{typeInfo.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">{typeDocs.length} documents</span>
                          {isExpanded ? (
                            <ChevronDown className="h-5 w-5 text-gray-400" />
                          ) : (
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    
                    {isExpanded && (
                      <CardContent>
                        <div className="space-y-4">
                          {typeDocs.map(doc => (
                            <div key={doc.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center mb-2">
                                    {getTypeIcon(doc.type)}
                                    <h3 className="text-lg font-semibold text-gray-900 ml-2">{doc.title}</h3>
                                    <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                                      {doc.type.replace('_', ' ')}
                                    </span>
                                  </div>
                                  
                                  <p className="text-gray-600 mb-3">{doc.description}</p>
                                  
                                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                                    <div className="flex items-center">
                                      <Calendar className="h-4 w-4 mr-1" />
                                      <span>Uploaded: {formatDate(doc.uploadDate)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      <span>Modified: {formatDate(doc.lastModified)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <File className="h-4 w-4 mr-1" />
                                      <span>{doc.fileSize}</span>
                                    </div>
                                    {doc.state && (
                                      <div className="flex items-center">
                                        <span className="font-medium">{doc.state}</span>
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex flex-wrap gap-2">
                                    {doc.tags.map(tag => (
                                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                                        #{tag}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                
                                <div className="ml-4">
                                  <button
                                    onClick={async () => {
                                      try {
                                        // Use the download API route
                                        const response = await fetch(`/api/documents/download?url=${encodeURIComponent(doc.downloadUrl)}`);
                                        if (response.ok) {
                                          const blob = await response.blob();
                                          const url = window.URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.download = doc.title;
                                          link.click();
                                          window.URL.revokeObjectURL(url);
                                        } else {
                                          console.error('Download failed');
                                        }
                                      } catch (error) {
                                        console.error('Download error:', error);
                                      }
                                    }}
                                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                  >
                                    <Download className="h-4 w-4 mr-2" />
                                    Download
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredDocuments.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
