"use client";

import { useEffect, useState } from "react";
import AppLayout from "@/app/components/applayout";
import { useProtectedPage } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import DocumentUpload from "@/app/components/DocumentUpload";
import { 
  FileText,
  Download,
  Calendar,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  Folder,
  File,
  AlertCircle
} from "lucide-react";
import LoaderOverlay from "@/app/components/LoaderOverlay";

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
  const [stateLinks, setStateLinks] = useState<Record<string, Array<string | { title: string; url: string }>>>({});
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
        setStateLinks(data.stateLinks || {});
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
    description: `${Object.keys(subfolders).length} categories • ${Object.values(subfolders).flat().length} documents${stateLinks[state]?.length ? ` • ${stateLinks[state].length} links` : ''}`,
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
    return <LoaderOverlay />;
  }

  return (
    <AppLayout activeTab="documents">
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Header Section */}
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#012C61]/10 via-blue-500/10 to-indigo-500/10 rounded-3xl blur-3xl"></div>
            <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-8 md:p-12">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-lemonMilkRegular text-[#012C61] mb-4 tracking-tight">
                    Document Library
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Access comprehensive policy documents, state notes, guidelines, and essential resources
                    for Medicaid rate analysis and program administration
                  </p>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#012C61]">{documents.length}</div>
                    <div className="text-sm text-gray-500">Total Documents</div>
                  </div>
                  <div className="h-12 w-px bg-gray-300"></div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-[#012C61]">{states.length}</div>
                    <div className="text-sm text-gray-500">States</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <div className="mb-8">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#012C61] h-5 w-5" />
                    <input
                      type="text"
                      placeholder="Search documents, keywords, tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#012C61] focus:border-[#012C61] transition-all bg-white/50 backdrop-blur-sm text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </div>

                {/* Category Filter */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#012C61] h-5 w-5 z-10" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#012C61] focus:border-[#012C61] transition-all bg-white/50 backdrop-blur-sm text-gray-700 appearance-none cursor-pointer"
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>

                {/* State Filter */}
                <div className="relative group">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="relative">
                    <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#012C61] h-5 w-5 z-10" />
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#012C61] focus:border-[#012C61] transition-all bg-white/50 backdrop-blur-sm text-gray-700 appearance-none cursor-pointer"
                    >
                      <option value="all">All States</option>
                      {states.map(state => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Loading State */}
          {isLoading && <LoaderOverlay label="Loading documents..." />}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 mb-6 shadow-sm">
              <div className="flex items-center text-red-600">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">{error}</span>
              </div>
            </div>
          )}

          {/* Documents by State */}
          {!isLoading && !error && (
            <div className="space-y-6">
              {documentTypes.map((stateInfo, index) => {
                const isExpanded = expandedSections.has(stateInfo.key);
                const totalDocs = stateInfo.subfolders.reduce((total, sub) => total + sub.count, 0);
                
                return (
                  <div 
                    key={stateInfo.key}
                    className="group relative overflow-hidden"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#012C61]/5 via-blue-500/5 to-indigo-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                      <div 
                        className="cursor-pointer p-6 hover:bg-gradient-to-r hover:from-[#012C61]/5 hover:to-blue-500/5 transition-all duration-300"
                        onClick={() => toggleSection(stateInfo.key)}
                      >
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div className="flex items-center gap-4">
                            <div className="p-2.5 bg-[#012C61]/10 rounded-lg border border-[#012C61]/20">
                              <stateInfo.icon className="h-5 w-5 text-[#012C61]" />
                            </div>
                            <div>
                              <h2 className="text-xl md:text-2xl font-bold text-[#012C61] mb-1 font-lemonMilkRegular">
                                {stateInfo.label}
                              </h2>
                              <p className="text-sm text-gray-600">{stateInfo.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-right">
                              <div className="text-2xl font-bold text-[#012C61]">{totalDocs}</div>
                              <div className="text-xs text-gray-500">documents</div>
                            </div>
                            <div className={`p-2 rounded-lg transition-transform duration-300 ${isExpanded ? 'bg-[#012C61]/10 rotate-180' : 'bg-gray-100'}`}>
                              <ChevronDown className="h-5 w-5 text-[#012C61]" />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="px-6 pb-6 border-t border-gray-100">
                          <div className="space-y-4 pt-6">
                            {stateLinks[stateInfo.key]?.length ? (
                              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-5 shadow-sm">
                                <div className="flex items-center gap-2 mb-3">
                                  <FileText className="h-5 w-5 text-[#012C61]" />
                                  <h3 className="text-lg font-semibold text-[#012C61]">External Manuals & Billing Links</h3>
                                </div>
                                <ul className="space-y-2">
                                  {stateLinks[stateInfo.key].map((item, idx) => {
                                    const linkObj = typeof item === 'string' ? { title: item, url: item } : item;
                                    return (
                                      <li key={idx} className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#012C61]"></div>
                                        <a 
                                          href={linkObj.url} 
                                          target="_blank" 
                                          rel="noopener noreferrer" 
                                          className="text-blue-600 hover:text-[#012C61] hover:underline break-all transition-colors font-medium"
                                        >
                                          {linkObj.title || linkObj.url}
                                        </a>
                                      </li>
                                    );
                                  })}
                                </ul>
                              </div>
                            ) : null}
                            {stateInfo.subfolders.map((subfolderInfo, subIndex) => {
                              const isSubfolderExpanded = expandedSections.has(subfolderInfo.key);
                              
                              return (
                                <div 
                                  key={subfolderInfo.key} 
                                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                                  style={{ animationDelay: `${(index * 50) + (subIndex * 30)}ms` }}
                                >
                                  <div 
                                    className="p-4 cursor-pointer hover:bg-gradient-to-r hover:from-[#012C61]/5 hover:to-blue-500/5 transition-all duration-300"
                                    onClick={() => toggleSection(subfolderInfo.key)}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-3">
                                        <div className="p-1.5 bg-gray-100 rounded-md border border-gray-200">
                                          <FileText className="h-4 w-4 text-gray-600" />
                                        </div>
                                        <div>
                                          <h3 className="text-base font-semibold text-gray-900">{subfolderInfo.label}</h3>
                                          <p className="text-sm text-gray-500">{subfolderInfo.count} document{subfolderInfo.count !== 1 ? 's' : ''}</p>
                                        </div>
                                      </div>
                                      <div className={`p-2 rounded-lg transition-all duration-300 ${isSubfolderExpanded ? 'bg-[#012C61]/10 rotate-180' : 'bg-gray-100'}`}>
                                        <ChevronDown className="h-4 w-4 text-[#012C61]" />
                                      </div>
                                    </div>
                                  </div>
                                  
                                  {isSubfolderExpanded && (
                                    <div className="px-4 pb-4 border-t border-gray-100 bg-white">
                                      <div className="space-y-3 pt-4">
                                        {subfolderInfo.documents.map((doc, docIndex) => (
                                          <div 
                                            key={doc.id} 
                                            className="group relative bg-gradient-to-r from-white to-gray-50 border-2 border-gray-100 rounded-xl p-4 hover:border-[#012C61]/30 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                                            style={{ animationDelay: `${(index * 50) + (subIndex * 30) + (docIndex * 20)}ms` }}
                                          >
                                            <div className="flex items-start justify-between gap-4">
                                              <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-3 flex-wrap">
                                                  <div className="p-1 bg-gray-100 rounded border border-gray-200">
                                                    {getTypeIcon(doc.type)}
                                                  </div>
                                                  <h4 className="text-sm font-semibold text-gray-900 truncate">{doc.title}</h4>
                                                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${getTypeColor(doc.type)} whitespace-nowrap`}>
                                                    .{doc.type}
                                                  </span>
                                                </div>
                                                
                                                <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                                                  <div className="flex items-center gap-1.5">
                                                    <Calendar className="h-3.5 w-3.5" />
                                                    <span>{formatDate(doc.uploadDate)}</span>
                                                  </div>
                                                  <div className="flex items-center gap-1.5">
                                                    <File className="h-3.5 w-3.5" />
                                                    <span>{doc.fileSize}</span>
                                                  </div>
                                                </div>
                                              </div>
                                              
                                              <button
                                                onClick={async (e) => {
                                                  e.stopPropagation();
                                                  try {
                                                    // downloadUrl is now the Google Drive file ID
                                                    const fileId = doc.downloadUrl || (doc as any).googleDriveFileId;
                                                    const response = await fetch(`/api/documents/download?fileId=${encodeURIComponent(fileId)}`);
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
                                                      alert('Failed to download file. Please try again.');
                                                    }
                                                  } catch (error) {
                                                    console.error('Download error:', error);
                                                    alert('Error downloading file. Please try again.');
                                                  }
                                                }}
                                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#012C61] to-blue-600 text-white rounded-lg text-sm font-medium hover:from-[#014085] hover:to-blue-700 transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105 whitespace-nowrap"
                                              >
                                                <Download className="h-4 w-4" />
                                                Download
                                              </button>
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
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* No Results */}
          {!isLoading && !error && filteredDocuments.length === 0 && (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full mb-6">
                <FileText className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3 font-lemonMilkRegular">No documents found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                Try adjusting your search terms or filters to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
