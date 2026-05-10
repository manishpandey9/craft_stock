// src/components/CSVImportModal.tsx
"use client";

import { useState, useRef } from "react";
import { downloadComponentTemplate, importComponents, type CSVImportResult } from "@/lib/api";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CSVImportModal({ open, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<CSVImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (!selected.name.endsWith('.csv') && !selected.name.endsWith('.xlsx')) {
        setError("Please select a CSV or Excel (.xlsx) file");
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    setResult(null);
    
    try {
      const res = await importComponents(file);
      setResult(res);
      if (res.success) {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || "Failed to import CSV");
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadComponentTemplate();
    } catch (err) {
      setError("Failed to download template");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-surface-variant/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface rounded-2xl shadow-2xl max-w-[42rem] w-full border border-outline-variant overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-lg border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
          <h3 className="font-h3 text-h3 text-on-surface">Import Components</h3>
          <button 
            onClick={onClose} 
            className="text-on-surface-variant hover:bg-surface-variant/50 p-1 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-lg overflow-y-auto flex-1 flex flex-col gap-lg">
          
          <div className="flex justify-end mb-sm">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-xs px-md py-sm bg-surface-container text-primary border border-outline-variant rounded-xl font-button hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Template
            </button>
          </div>

          {error && (
            <div className="p-md bg-error-container text-on-error-container rounded-xl flex items-center gap-sm">
              <span className="material-symbols-outlined text-error">error</span>
              <p className="font-body-md flex-1">{error}</p>
              <button onClick={() => setError(null)}>
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
          )}

          {result?.success && (
            <div className="p-md bg-primary-container/30 border border-primary-container text-on-surface rounded-xl flex flex-col gap-xs">
              <p className="font-h3 text-h3 text-primary flex items-center gap-xs">
                <span className="material-symbols-outlined">check_circle</span>
                Imported {result.imported_count} components
              </p>
              {result.error_count > 0 && (
                <p className="font-body-sm text-error flex items-center gap-xs mt-xs">
                  <span className="material-symbols-outlined text-sm">warning</span>
                  {result.error_count} rows had errors (see below)
                </p>
              )}
            </div>
          )}

          {/* File Upload Box */}
          <div className="border border-outline-variant bg-surface-container-lowest rounded-xl p-lg flex items-center justify-between gap-md">
            <div className="flex items-center gap-md">
              <div className="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center text-on-primary-container">
                <span className="material-symbols-outlined">description</span>
              </div>
              <div className="flex flex-col">
                <p className="font-body-lg font-bold text-on-surface">
                  {file ? file.name : "No file selected"}
                </p>
                <p className="font-body-sm text-on-surface-variant">
                  CSV or Excel file with columns: name, sku, component_type, unit, on_hand, threshold...
                </p>
              </div>
            </div>
            <div>
              <input
                type="file"
                accept=".csv,.xlsx"
                onChange={handleFileChange}
                className="hidden"
                ref={fileInputRef}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-md py-sm bg-surface-container-high border border-outline text-on-surface rounded-xl font-button hover:bg-surface-variant transition-colors whitespace-nowrap"
              >
                Choose File
              </button>
            </div>
          </div>

          {/* Import Results */}
          {result?.errors && result.errors.length > 0 && (
            <div className="flex flex-col gap-sm">
              <h4 className="font-h3 text-error">Errors:</h4>
              <div className="border border-error-container rounded-xl overflow-hidden bg-surface-container-lowest">
                <div className="max-h-[200px] overflow-y-auto">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx} className="p-md border-b border-outline-variant flex gap-md">
                      <span className="font-body-sm text-on-surface-variant whitespace-nowrap">Row {err.row}:</span>
                      <span className="font-body-sm text-error">{err.error}</span>
                    </div>
                  ))}
                  {result.errors.length > 5 && (
                    <div className="p-md text-center bg-surface-container-low">
                      <span className="font-body-sm text-on-surface-variant">
                        + {result.errors.length - 5} more errors...
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="flex flex-col gap-sm mt-md bg-surface-container p-md rounded-xl">
            <h4 className="font-h3 text-on-surface">Instructions:</h4>
            <ul className="flex flex-col gap-sm">
              <li className="flex items-center gap-sm text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                Download the template CSV first
              </li>
              <li className="flex items-center gap-sm text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                Fill in your component data (keep headers)
              </li>
              <li className="flex items-center gap-sm text-on-surface-variant font-body-md">
                <span className="material-symbols-outlined text-primary text-sm">info</span>
                Upload the file and review results
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-md border-t border-outline-variant bg-surface-container-low flex justify-end gap-sm">
          <button 
            onClick={onClose} 
            className="px-md py-sm rounded-xl font-button text-on-surface-variant hover:bg-surface-container transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
          <button 
            onClick={handleUpload}
            className="px-lg py-sm rounded-xl font-button bg-primary text-on-primary hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center gap-xs shadow-md"
            disabled={!file || uploading}
          >
            {uploading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
            {uploading ? "Importing..." : "Import"}
          </button>
        </div>

      </div>
    </div>
  );
}