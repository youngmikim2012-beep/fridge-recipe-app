"use client";

import { useState } from "react";
import type { Recipe } from "./RecipeCard";

export interface SavedRecipe {
  id: string;
  recipe: Recipe;
  tags: string[];
  memo: string;
  savedAt: string;
}

interface Props {
  item: SavedRecipe;
  onDelete: (id: string) => void;
  onUpdate: (id: string, memo: string, tags: string[]) => void;
}

const TAG_PRESETS = ["간단", "아침식사", "점심", "저녁", "간식", "건강식", "다이어트"];

export default function SavedRecipeCard({ item, onDelete, onUpdate }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [editingMemo, setEditingMemo] = useState(false);
  const [memo, setMemo] = useState(item.memo);
  const [tags, setTags] = useState<string[]>(item.tags);
  const [saving, setSaving] = useState(false);

  async function saveMemo() {
    setSaving(true);
    await onUpdate(item.id, memo, tags);
    setSaving(false);
    setEditingMemo(false);
  }

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 truncate">{item.recipe.name}</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(item.savedAt).toLocaleDateString("ko-KR")} 저장
            </p>
          </div>
          <div className="flex gap-1.5">
            <button onClick={() => setExpanded(!expanded)}
              className="px-2.5 py-1 text-xs rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors">
              {expanded ? "접기" : "보기"}
            </button>
            <button onClick={() => onDelete(item.id)}
              className="px-2.5 py-1 text-xs rounded-lg bg-red-50 text-red-400 hover:bg-red-100 transition-colors">
              삭제
            </button>
          </div>
        </div>

        {/* 배지 */}
        <div className="flex gap-2 mt-3 flex-wrap">
          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs">⏱ {item.recipe.time}</span>
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{item.recipe.difficulty}</span>
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs">#{tag}</span>
          ))}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-50 p-5 space-y-4">
          {/* 재료 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">재료</p>
            <div className="flex flex-wrap gap-1.5">
              {item.recipe.ingredients.map((ing, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">{ing}</span>
              ))}
            </div>
          </div>

          {/* 조리법 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">조리법</p>
            <ol className="space-y-1.5">
              {item.recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-2 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {/* 태그 편집 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">태그</p>
            <div className="flex flex-wrap gap-1.5">
              {TAG_PRESETS.map((tag) => (
                <button key={tag} onClick={() => toggleTag(tag)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                    tags.includes(tag)
                      ? "bg-emerald-500 text-white border-emerald-500"
                      : "bg-white text-gray-500 border-gray-200 hover:border-emerald-400"
                  }`}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 메모 */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">메모</p>
            {editingMemo ? (
              <div className="flex flex-col gap-2">
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="나만의 조리 팁을 적어보세요"
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => setEditingMemo(false)}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50">
                    취소
                  </button>
                  <button onClick={saveMemo} disabled={saving}
                    className="px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50">
                    {saving ? "저장 중..." : "저장"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-600 flex-1">
                  {memo || <span className="text-gray-400 italic">메모 없음</span>}
                </p>
                <button onClick={() => setEditingMemo(true)}
                  className="text-xs text-emerald-600 hover:underline flex-shrink-0">
                  {memo ? "편집" : "추가"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
