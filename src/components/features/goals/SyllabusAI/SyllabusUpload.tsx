import React, { useRef } from "react";

interface SyllabusUploadProps {
  onFileSelected: (file: File) => void;
  uploading: boolean;
  fileName: string | null;
}

const SyllabusUpload: React.FC<SyllabusUploadProps> = ({
  onFileSelected,
  uploading,
  fileName,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={e => {
          if (e.target.files && e.target.files[0]) {
            onFileSelected(e.target.files[0]);
          }
        }}
        disabled={uploading}
      />
      <button
        type="button"
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? "Uploading..." : "Upload Syllabus PDF"}
      </button>
      {fileName && (
        <span className="text-sm text-gray-700 dark:text-gray-200">
          {fileName}
        </span>
      )}
    </div>
  );
};

export default SyllabusUpload;