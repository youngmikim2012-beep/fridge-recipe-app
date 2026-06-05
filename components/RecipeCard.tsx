"use client";

import { useState } from "react";

export interface Recipe {
  name: string;
  time: string;
  difficulty: string;
  description: string;
  ingredients: string[];
  steps: string[];
}

interface Props {
  recipe: Recipe;
  ownedIngredients: string[];
  onSave: (recipe: Recipe) => void;
  saved: boolean;
  saving?: boolean;
}

const DIFFICULTY_COLOR: Record<string, string> = {
  초보: "bg-green-100 text-green-700",
  중급: "bg-yellow-100 text-yellow-700",
  고급: "bg-red-100 text-red-700",
};

function isOwned(ingredient: string, owned: string[]): boolean {
  return owned.some((o) =>
    ingredient.toLowerCase().includes(o.toLowerCase()) ||
    o.toLowerCase().includes(ingredient.toLowerCase().split(" ")[0])
  );
}

export default function RecipeCard({ recipe, ownedIngredients, onSave, saved, saving }: Props) {
  const [stepsOpen, setStepsOpen] = useState(false);

  const diffColor = DIFFICULTY_COLOR[recipe.difficulty] ?? "bg-gray-100 text-gray-600";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* 헤더 */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{recipe.name}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{recipe.description}</p>
          </div>
          <button
            onClick={() => onSave(recipe)}
            disabled={saving}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-60 ${
              saved
                ? "bg-emerald-500 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-emerald-100 hover:text-emerald-700"
            }`}
          >
            {saved ? (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                저장됨
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 20 20">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
                </svg>
                저장
              </>
            )}
          </button>
        </div>

        {/* 배지 */}
        <div className="flex gap-2 mt-3">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {recipe.time}
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${diffColor}`}>
            {recipe.difficulty}
          </span>
        </div>
      </div>

      {/* 재료 */}
      <div className="px-6 pb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">필요 재료</p>
        <div className="flex flex-wrap gap-1.5">
          {recipe.ingredients.map((ing, i) => {
            const owned = isOwned(ing, ownedIngredients);
            return (
              <span
                key={i}
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  owned
                    ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {owned ? "✓ " : ""}{ing}
              </span>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          초록색 = 보유 재료 ({recipe.ingredients.filter((i) => isOwned(i, ownedIngredients)).length}/{recipe.ingredients.length}개 보유)
        </p>
      </div>

      {/* 조리법 토글 */}
      <div className="border-t border-gray-50">
        <button
          onClick={() => setStepsOpen(!stepsOpen)}
          className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>조리법 보기 ({recipe.steps.length}단계)</span>
          <svg
            className={`w-4 h-4 transition-transform ${stepsOpen ? "rotate-180" : ""}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {stepsOpen && (
          <ol className="px-6 pb-5 space-y-2">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
