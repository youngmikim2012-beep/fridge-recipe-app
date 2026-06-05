"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploader from "@/components/ImageUploader";
import IngredientTags from "@/components/IngredientTags";

type Stage = "upload" | "preview" | "loading" | "result" | "error";

export default function Step1Page() {
  const router = useRouter();

  const [stage, setStage] = useState<Stage>("upload");
  const [preview, setPreview] = useState("");
  const [base64, setBase64] = useState("");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  function handleImageSelect(b64: string, prev: string) {
    setBase64(b64);
    setPreview(prev);
    setStage("preview");
  }

  function resetUpload() {
    setStage("upload");
    setPreview("");
    setBase64("");
    setIngredients([]);
    setErrorMsg("");
  }

  async function analyzeImage() {
    setStage("loading");
    try {
      const res = await fetch("/api/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? "분석 중 오류가 발생했습니다.");
        setStage("error");
        return;
      }
      setIngredients(data.ingredients ?? []);
      setStage("result");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "네트워크 오류가 발생했습니다.");
      setStage("error");
    }
  }

  function goToStep2() {
    const query = encodeURIComponent(JSON.stringify(ingredients));
    router.push(`/recipe?ingredients=${query}`);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 9.75A2.25 2.25 0 015.25 7.5h13.5A2.25 2.25 0 0121 9.75v8.25A2.25 2.25 0 0118.75 20.25H5.25A2.25 2.25 0 013 18V9.75zM8.25 7.5V6a2.25 2.25 0 014.5 0v1.5" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">냉장고 재료 인식</h1>
          <p className="text-gray-500 mt-2">냉장고 사진을 올리면 AI가 재료를 찾아드려요</p>

          {/* 단계 표시 */}
          <div className="flex items-center justify-center gap-2 mt-6 text-sm">
            <span className="px-3 py-1 rounded-full bg-emerald-500 text-white font-semibold">1 재료 인식</span>
            <span className="text-gray-300">›</span>
            <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-400">2 레시피 생성</span>
            <span className="text-gray-300">›</span>
            <span className="px-3 py-1 rounded-full bg-gray-200 text-gray-400">3 저장</span>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">

          {stage === "upload" && (
            <ImageUploader onImageSelect={handleImageSelect} />
          )}

          {stage === "preview" && (
            <div className="flex flex-col items-center gap-6">
              <div className="relative w-full max-w-md">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="업로드된 이미지" className="w-full rounded-2xl object-cover max-h-72" />
                <button
                  onClick={resetUpload}
                  className="absolute top-2 right-2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center text-sm transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="flex gap-3 w-full">
                <button onClick={resetUpload} className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                  다시 선택
                </button>
                <button onClick={analyzeImage} className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-colors">
                  분석 시작
                </button>
              </div>
            </div>
          )}

          {stage === "loading" && (
            <div className="flex flex-col items-center gap-6 py-10">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-100" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-medium">이미지를 분석하는 중...</p>
                <p className="text-sm text-gray-400 mt-1">Gemma 비전 모델이 사진을 분석하고 있어요</p>
              </div>
            </div>
          )}

          {stage === "result" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-start gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="분석된 이미지" className="w-24 h-24 rounded-xl object-cover flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-gray-800 mb-1">인식된 재료 ({ingredients.length}개)</h2>
                  <p className="text-sm text-gray-500">잘못 인식된 재료는 ×를 눌러 삭제하고, 빠진 재료는 직접 추가해주세요.</p>
                </div>
              </div>

              <IngredientTags ingredients={ingredients} onChange={setIngredients} />

              <div className="flex gap-3 pt-2">
                <button onClick={resetUpload} className="px-5 py-3 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm">
                  처음부터
                </button>
                <button
                  onClick={goToStep2}
                  disabled={ingredients.length === 0}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold transition-colors"
                >
                  레시피 추천받기 →
                </button>
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="flex flex-col items-center gap-5 py-6">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-800">분석 실패</p>
                <p className="text-sm text-red-500 mt-1">{errorMsg}</p>
              </div>
              <button onClick={resetUpload} className="px-6 py-2.5 rounded-xl bg-gray-800 text-white hover:bg-gray-700 transition-colors text-sm">
                다시 시도
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          이미지는 분석 목적으로만 사용되며 저장되지 않습니다.
        </p>
      </div>
    </main>
  );
}
