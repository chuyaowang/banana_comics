
import React, { ChangeEvent } from 'react';
import { UploadCloud, FileText } from 'lucide-react';

interface FileUploaderProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, selectedFile }) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/50 bg-slate-50 dark:bg-slate-900 border-slate-300 dark:border-slate-700 hover:border-yellow-500 transition-all duration-300 group">
        <div className="flex flex-col items-center justify-center pt-5 pb-6">
          {selectedFile ? (
            <>
              <FileText className="w-12 h-12 mb-3 text-yellow-500 transition-colors duration-300" />
              <p className="mb-2 text-sm text-slate-700 dark:text-gray-300 font-semibold transition-colors duration-300">{selectedFile.name}</p>
              <p className="text-xs text-slate-500 dark:text-gray-500 transition-colors duration-300">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 mb-3 text-slate-400 dark:text-gray-400 group-hover:text-yellow-500 transition-colors duration-300" />
              <p className="mb-2 text-sm text-slate-500 dark:text-gray-400 transition-colors duration-300">
                <span className="font-semibold text-yellow-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-slate-400 dark:text-gray-500 transition-colors duration-300">TXT, MD, PDF, DOCX (Text content only)</p>
            </>
          )}
        </div>
        <input 
          type="file" 
          className="hidden" 
          accept=".txt,.md,.docx,.pdf" 
          onChange={handleFileChange}
        />
      </label>
    </div>
  );
};

export default FileUploader;
