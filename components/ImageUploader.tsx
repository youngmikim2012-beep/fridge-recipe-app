"use client";

import { useRef, useState } from "react";

interface Props {
  onImageSelect: (base64: string, preview: string) => void;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 10 * 1024 * 1024;

export default function ImageUploader({ onImageSelect }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function handleFile(file: File) {
    setError("");
    if (!ACCEPTED.includes(file.type)) {
      setError("JPG, PNG, WEBP 형식만 지원합니다.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("파일 크기는 10MB 이하여야 합니다.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      onImageSelect(result, result);
    };
    reader.readAsDataURL(file);
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`w-full max-w-lg h-56 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors
          ${dragging ? "border-emerald-400 bg-emerald-50" : "border-gray-300 bg-gray-50 hover:border-emerald-400 hover:bg-emerald-50"}`}
      >
        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 9l-4-4m0 0L8 9m4-4v12" />
        </svg>
        <p className="text-sm font-medium text-gray-600">클릭하거나 사진을 여기에 드래그하세요</p>
        <p className="text-xs text-gray-400 mt-1">JPG · PNG · WEBP · 최대 10MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        onChange={onInputChange}
        className="hidden"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
