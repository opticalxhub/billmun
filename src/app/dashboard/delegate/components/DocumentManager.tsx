'use client';

import React, { useState, useCallback } from 'react';
import { Card, Badge } from '@/components/ui';
import { Button } from '@/components/button';
import { supabase } from '@/lib/supabase';
// Note: We'll implement real Uploadthing later, using standard input for now
export function DocumentManager({ user, documents: initialDocs }: { user: any, documents: any[] }) {
  const [documents, setDocuments] = useState<any[]>(initialDocs || []);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file || file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const interval = setInterval(() => {
        setUploadProgress(p => Math.min(p + 10, 90));
      }, 100);

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const { error } = await supabase.storage
        .from('documents')
        .upload(fileName, file);

      clearInterval(interval);

      if (error) {
        throw error;
      }

      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName);

      const newDoc = {
        title: file.name,
        file_url: urlData.publicUrl,
        type: 'POSITION_PAPER',
        user_id: user.id,
      };

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert([newDoc])
        .select()
        .single();

      if (dbError) throw dbError;

      setDocuments(prev => [dbData, ...prev]);
      setUploadProgress(100);
      setTimeout(() => setIsUploading(false), 500);

    } catch (err: any) {
      console.error(err);
      alert('Upload failed: ' + err.message);
      setIsUploading(false);
    }
  }, [user.id]);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
      <div className={`col-span-1 lg:col-span-${selectedDoc ? '2' : '3'} flex flex-col gap-6`}>
        {/* Upload Zone */}
        <Card 
          className={`border-2 border-dashed flex flex-col items-center justify-center p-8 transition-colors ${
            isDragging ? 'border-primary bg-primary/5' : 'border-border-subtle bg-bg-base/50 hover:bg-bg-card'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <div className="text-center">
            <svg className="mx-auto h-12 w-12 text-text-tertiary mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-text-primary">Drag and drop PDF here</p>
            <p className="text-sm text-text-secondary mt-1">Maximum file size 10MB</p>
            
            {isUploading && (
              <div className="w-full max-w-xs mx-auto mt-4">
                <div className="h-2 bg-bg-raised rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs mt-2">{uploadProgress}% uploaded</p>
              </div>
            )}
            
            <div className="mt-4">
              <input 
                type="file" 
                id="file-upload" 
                className="hidden" 
                accept=".pdf"
                onChange={(e) => e.target.files && handleFileUpload(e.target.files[0])}
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                Browse Files
              </Button>
            </div>
          </div>
        </Card>

        {/* Documents Table */}
        <Card className="flex-1 overflow-hidden flex flex-col">
          <h3 className="font-jotia text-xl uppercase mb-4">My Documents</h3>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary text-xs uppercase tracking-widest sticky top-0 bg-bg-card z-10">
                  <th className="pb-3 font-medium">Title</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {documents.map((doc) => (
                  <tr 
                    key={doc.id} 
                    className="hover:bg-bg-raised/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedDoc(doc)}
                  >
                    <td className="py-3 text-sm font-medium">{doc.title}</td>
                    <td className="py-3">
                      <Badge className="text-[10px]">{doc.type || 'DOCUMENT'}</Badge>
                    </td>
                    <td className="py-3 text-sm text-text-secondary">
                      {new Date(doc.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <Badge
                        className={`text-[10px] ${
                          doc.status === 'APPROVED'
                            ? 'bg-status-approved-bg text-status-approved-text border border-status-approved-border'
                            : 'bg-bg-raised text-text-secondary border border-border-subtle'
                        }`}
                      >
                        {doc.status || 'SUBMITTED'}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-text-tertiary">
                      No documents uploaded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {/* Right Side Drawer Preview */}
      {selectedDoc && (
        <Card className="col-span-1 flex flex-col overflow-hidden animate-fade-in border-l-primary border-l-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-jotia text-xl uppercase truncate pr-4">{selectedDoc.title}</h3>
            <button onClick={() => setSelectedDoc(null)} className="text-text-tertiary hover:text-text-primary">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="h-[55%] w-full bg-bg-raised mb-4 rounded overflow-hidden">
            {selectedDoc.file_url ? (
              <iframe src={`${selectedDoc.file_url}#view=FitH`} className="w-full h-full border-0" />
            ) : (
              <div className="flex items-center justify-center h-full text-text-tertiary">
                Preview not available
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-y-2">
              <span className="text-text-tertiary">Type:</span>
              <span>{selectedDoc.type}</span>
              <span className="text-text-tertiary">Uploaded:</span>
              <span>{new Date(selectedDoc.uploaded_at).toLocaleString()}</span>
              <span className="text-text-tertiary">Status:</span>
              <Badge className="w-max text-[10px]">{selectedDoc.status || 'SUBMITTED'}</Badge>
            </div>

            <div className="border-t border-border-subtle pt-4">
              <h4 className="font-bold text-text-secondary uppercase text-xs tracking-widest mb-2">Status History</h4>
              <div className="space-y-3 relative before:absolute before:inset-y-0 before:left-[5px] before:w-[2px] before:bg-border-subtle ml-2">
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-3 h-3 rounded-full bg-primary -ml-[5px] ring-4 ring-bg-card" />
                  <p className="text-xs font-medium text-text-primary">Submitted</p>
                  <p className="text-[10px] text-text-tertiary">{new Date(selectedDoc.uploaded_at).toLocaleString()}</p>
                </div>
              </div>
            </div>

            {selectedDoc.feedback && (
              <div className="border-t border-border-subtle pt-4">
                <h4 className="font-bold text-text-secondary uppercase text-xs tracking-widest mb-2">Feedback</h4>
                <blockquote className="border-l-2 border-primary pl-3 text-text-secondary italic">
                  &quot;{selectedDoc.feedback}&quot;
                </blockquote>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-border-subtle flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => window.open(selectedDoc.file_url, '_blank')}>
              Download
            </Button>
            {selectedDoc.status === 'SUBMITTED' && (
              <Button variant="destructive" className="flex-1">
                Delete
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}