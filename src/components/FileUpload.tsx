import { useRef, useState, type DragEvent } from 'react';
import { Upload, FileIcon, X } from './Icons';
import { uploadFile } from '../services/api';
import type { UploadedFile } from '../types';

interface Props {
  kind: string;
  accept?: string;
  multiple?: boolean;
  files: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  title?: string;
  hint?: string;
  maxSizeMB?: number;
}

const isImage = (f: UploadedFile) => f.contentType.startsWith('image/');

export function FileUpload({
  kind,
  accept = 'image/*,application/pdf',
  multiple = false,
  files,
  onChange,
  title = 'Click or drag file to upload',
  hint = 'PNG, JPG or PDF · up to 5MB',
  maxSizeMB = 5,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    setError(null);
    const picked = Array.from(list).slice(0, multiple ? 8 : 1);

    for (const file of picked) {
      if (file.size > maxSizeMB * 1024 * 1024) {
        setError(`"${file.name}" is larger than ${maxSizeMB}MB.`);
        continue;
      }
      const key = `${file.name}-${file.size}`;
      setProgress((p) => ({ ...p, [key]: 0 }));
      try {
        const uploaded = await uploadFile(file, kind, (pct) => setProgress((p) => ({ ...p, [key]: pct })));
        onChange(multiple ? [...files, uploaded] : [uploaded]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Upload failed. Please retry.');
      } finally {
        setProgress((p) => {
          const { [key]: _drop, ...rest } = p;
          return rest;
        });
      }
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const remove = (blobName: string) => onChange(files.filter((f) => f.blobName !== blobName));
  const uploading = Object.keys(progress);
  const showDrop = multiple || files.length === 0;

  return (
    <div>
      {(files.length > 0 || uploading.length > 0) && (
        <div style={{ display: 'grid', gap: 10, marginBottom: showDrop ? 12 : 0 }}>
          {files.map((f) => (
            <div className="upload-preview" key={f.blobName}>
              {isImage(f) ? <img src={f.url} alt={f.fileName} /> : <span className="upload-preview__thumb"><FileIcon /></span>}
              <div className="upload-preview__meta">
                <div className="upload-preview__name">{f.fileName}</div>
                <div className="upload-preview__size">{(f.size / 1024).toFixed(0)} KB · uploaded</div>
              </div>
              <button type="button" className="upload-preview__remove" onClick={() => remove(f.blobName)} aria-label="Remove">
                <X size={18} />
              </button>
            </div>
          ))}
          {uploading.map((key) => (
            <div className="upload-preview" key={key}>
              <span className="upload-preview__thumb"><FileIcon /></span>
              <div className="upload-preview__meta">
                <div className="upload-preview__name">{key.split('-')[0]}</div>
                <div className="upload-preview__progress"><i style={{ width: `${progress[key]}%` }} /></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDrop && (
        <div
          className={`uploader ${dragging ? 'uploader--drag' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          role="button"
          tabIndex={0}
        >
          <div className="uploader__icon"><Upload /></div>
          <div className="uploader__title">{title}</div>
          <div className="uploader__hint">{hint}</div>
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            hidden
            onChange={(e) => handleFiles(e.target.files)}
          />
        </div>
      )}
      {error && <div className="field__error" style={{ marginTop: 8 }}>{error}</div>}
    </div>
  );
}
