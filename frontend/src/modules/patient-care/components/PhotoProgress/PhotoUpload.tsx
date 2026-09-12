import React from 'react';

interface PhotoUploadProps {
  patientId: string;
  onUploadComplete: () => void;
}

export default function PhotoUpload({ patientId, onUploadComplete }: PhotoUploadProps) {
  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 text-center">
      <p className="text-gray-500">Photo Upload Component Placeholder</p>
      <button 
        onClick={onUploadComplete}
        className="mt-2 px-4 py-2 bg-primary-600 text-white rounded"
      >
        Simulate Upload
      </button>
    </div>
  );
}
