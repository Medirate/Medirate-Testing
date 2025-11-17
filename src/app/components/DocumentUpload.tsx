"use client";

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DocumentUpload() {
  const auth = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [folderPath, setFolderPath] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string | null>(null);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folderPath', folderPath);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(`✅ File uploaded successfully! Path: ${result.blob.pathname}`);
        setFile(null);
        setFolderPath('');
      } else {
        setUploadResult(`❌ Upload failed: ${result.error}`);
      }
    } catch (error) {
      setUploadResult(`❌ Upload error: ${error}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Only show for admin users
  const adminEmails = ['dev@metasysconsulting.com', 'gnersess@medirate.net'];
  if (!auth.userEmail || !adminEmails.includes(auth.userEmail)) {
    return null;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Upload Documents to Blob Storage</h2>
      
      <form onSubmit={handleUpload} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Folder Path (e.g., MEDIRATE_DOCUMENTS/ALABAMA/ABA)
          </label>
          <input
            type="text"
            value={folderPath}
            onChange={(e) => setFolderPath(e.target.value)}
            placeholder="MEDIRATE_DOCUMENTS/ALABAMA/ABA"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select File
          </label>
          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
        </div>

        <button
          type="submit"
          disabled={!file || isUploading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? 'Uploading...' : 'Upload Document'}
        </button>
      </form>

      {uploadResult && (
        <div className={`mt-4 p-3 rounded-md ${
          uploadResult.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {uploadResult}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium mb-2">Folder Structure Examples:</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• MEDIRATE_DOCUMENTS/ALABAMA/ABA/document.pdf</li>
          <li>• MEDIRATE_DOCUMENTS/ALABAMA/BH/document.pdf</li>
          <li>• MEDIRATE_DOCUMENTS/ALABAMA/BILLING_MANUALS/document.pdf</li>
          <li>• MEDIRATE_DOCUMENTS/ALABAMA/IDD/document.pdf</li>
          <li>• MEDIRATE_DOCUMENTS/CALIFORNIA/ABA/document.pdf</li>
        </ul>
      </div>
    </div>
  );
}
