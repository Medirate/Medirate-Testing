"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import DocumentUpload from "@/app/components/DocumentUpload";
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
  type: string; // Now shows actual file extension
  folder: string; // Actual folder path in storage
  subfolder?: string; // Subfolder like ABA, BH, BILLING_MANUALS, IDD
  state?: string;
  category: string;
  description: string;
  uploadDate: string;
  lastModified: string;
  fileSize: string;
  downloadUrl: string;
  tags: string[];
  isPublic: boolean;
  filePath: string; // Full path in storage
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
        console.log('📄 Documents API response:', data);
        console.log('📄 Documents count:', data.documents?.length || 0);
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

  // Group documents by state first, then by subfolder
  const groupedByState = filteredDocuments.reduce((acc, doc) => {
    const state = doc.state || 'Other';
    if (!acc[state]) {
      acc[state] = {};
    }
    
    // Extract subfolder from folder path (e.g., "ALABAMA/ABA" -> "ABA")
    const folderParts = doc.folder.split('/');
    const subfolder = folderParts.length > 1 ? folderParts[folderParts.length - 1] : 'Root';
    
    if (!acc[state][subfolder]) {
      acc[state][subfolder] = [];
    }
    acc[state][subfolder].push(doc);
    return acc;
  }, {} as Record<string, Record<string, Document[]>>);

  // Generate document types dynamically from states and their subfolders
  const documentTypes = Object.entries(groupedByState).map(([state, subfolders]) => ({
    key: state,
    label: state,
    icon: Folder,
    description: `${Object.keys(subfolders).length} categories • ${Object.values(subfolders).flat().length} documents`,
    subfolders: Object.entries(subfolders).map(([subfolder, docs]) => ({
      key: `${state}/${subfolder}`,
      label: subfolder,
      count: docs.length,
      documents: docs
    }))
  }));

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

          {/* Documents by State */}
          {!isLoading && !error && (
            <div className="space-y-6">
              {documentTypes.map(stateInfo => {
                const isExpanded = expandedSections.has(stateInfo.key);
                
                return (
                  <Card key={stateInfo.key}>
                    <CardHeader 
                      className="cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => toggleSection(stateInfo.key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <stateInfo.icon className="h-5 w-5 mr-3 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{stateInfo.label}</CardTitle>
                            <CardDescription>{stateInfo.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-500">
                            {stateInfo.subfolders.reduce((total, sub) => total + sub.count, 0)} documents
                          </span>
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
                        <div className="space-y-6">
                          {stateInfo.subfolders.map(subfolderInfo => {
                            const isSubfolderExpanded = expandedSections.has(subfolderInfo.key);
                            
                            return (
                              <div key={subfolderInfo.key} className="border border-gray-200 rounded-lg">
                                <div 
                                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => toggleSection(subfolderInfo.key)}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                      <FileText className="h-4 w-4 mr-3 text-gray-600" />
                                      <div>
                                        <h3 className="text-md font-semibold text-gray-900">{subfolderInfo.label}</h3>
                                        <p className="text-sm text-gray-500">{subfolderInfo.count} documents</p>
                                      </div>
                                    </div>
                                    {isSubfolderExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-gray-400" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-gray-400" />
                                    )}
                                  </div>
                                </div>
                                
                                {isSubfolderExpanded && (
                                  <div className="px-4 pb-4">
                                    <div className="space-y-3">
                                      {subfolderInfo.documents.map(doc => (
                                        <div key={doc.id} className="border border-gray-100 rounded-lg p-3 hover:shadow-sm transition-shadow bg-gray-50">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center mb-2">
                                                {getTypeIcon(doc.type)}
                                                <h4 className="text-sm font-medium text-gray-900 ml-2">{doc.title}</h4>
                                                <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)}`}>
                                                  .{doc.type}
                                                </span>
                                              </div>
                                              
                                              <div className="flex items-center space-x-3 text-xs text-gray-500 mb-2">
                                                <div className="flex items-center">
                                                  <Calendar className="h-3 w-3 mr-1" />
                                                  <span>{formatDate(doc.uploadDate)}</span>
                                                </div>
                                                <div className="flex items-center">
                                                  <File className="h-3 w-3 mr-1" />
                                                  <span>{doc.fileSize}</span>
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <div className="ml-4">
                                              <button
                                                onClick={async () => {
                                                  try {
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
                                                className="flex items-center px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                                              >
                                                <Download className="h-3 w-3 mr-1" />
                                                Download
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
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
