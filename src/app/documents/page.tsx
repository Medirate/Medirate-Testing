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

  // Mock data - replace with actual API calls
  const mockDocuments: Document[] = [
    {
      id: '1',
      title: 'Texas Medicaid Rate Schedule 2024',
      type: 'state_note',
      state: 'Texas',
      category: 'Rate Information',
      description: 'Comprehensive rate schedule for Texas Medicaid services including all service categories and their corresponding rates.',
      uploadDate: '2024-01-15',
      lastModified: '2024-01-20',
      fileSize: '2.3 MB',
      downloadUrl: '/documents/texas-rates-2024.pdf',
      tags: ['rates', 'texas', 'medicaid', '2024'],
      isPublic: true
    },
    {
      id: '2',
      title: 'California Provider Guidelines',
      type: 'guideline',
      state: 'California',
      category: 'Provider Information',
      description: 'Guidelines for healthcare providers participating in California Medicaid program.',
      uploadDate: '2024-01-10',
      lastModified: '2024-01-18',
      fileSize: '1.8 MB',
      downloadUrl: '/documents/california-guidelines.pdf',
      tags: ['guidelines', 'california', 'providers'],
      isPublic: true
    },
    {
      id: '3',
      title: 'New York State Notes - Q1 2024',
      type: 'state_note',
      state: 'New York',
      category: 'State Updates',
      description: 'Quarterly state notes covering policy changes and rate updates for New York Medicaid.',
      uploadDate: '2024-03-01',
      lastModified: '2024-03-05',
      fileSize: '3.1 MB',
      downloadUrl: '/documents/ny-state-notes-q1-2024.pdf',
      tags: ['state-notes', 'new-york', 'q1-2024'],
      isPublic: true
    },
    {
      id: '4',
      title: 'Medicaid Policy Update - National',
      type: 'policy',
      category: 'Policy Updates',
      description: 'National policy updates affecting all Medicaid programs across states.',
      uploadDate: '2024-02-15',
      lastModified: '2024-02-20',
      fileSize: '4.2 MB',
      downloadUrl: '/documents/national-policy-update.pdf',
      tags: ['policy', 'national', 'medicaid'],
      isPublic: true
    },
    {
      id: '5',
      title: 'Provider Application Form',
      type: 'form',
      category: 'Forms',
      description: 'Standard application form for new Medicaid providers.',
      uploadDate: '2024-01-05',
      lastModified: '2024-01-08',
      fileSize: '0.8 MB',
      downloadUrl: '/documents/provider-application.pdf',
      tags: ['form', 'application', 'providers'],
      isPublic: true
    },
    {
      id: '6',
      title: 'Florida Rate Analysis Report',
      type: 'report',
      state: 'Florida',
      category: 'Analysis',
      description: 'Comprehensive analysis of Florida Medicaid rates compared to national averages.',
      uploadDate: '2024-02-01',
      lastModified: '2024-02-10',
      fileSize: '5.7 MB',
      downloadUrl: '/documents/florida-rate-analysis.pdf',
      tags: ['analysis', 'florida', 'rates', 'comparison'],
      isPublic: true
    }
  ];

  useEffect(() => {
    const fetchDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setDocuments(mockDocuments);
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
                                    onClick={() => {
                                      // Handle download
                                      const link = document.createElement('a');
                                      link.href = doc.downloadUrl;
                                      link.download = doc.title;
                                      link.click();
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
