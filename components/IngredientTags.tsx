"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  ingredients: string[];
  onChange: (updated: string[]) => void;
}

export default function IngredientTags({ ingredients, onChange }: Props) {
  const [input, setInput] = useState("");

  function remove(index: number) {
    onChange(ingredients.filter((_, i) => i !== index));
  }

  function add() {
    const value = input.trim();
    if (!value || ingredients.includes(value)) return;
    onChange([...ingredients, value]);
    setInput("");
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {ingredients.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-sm font-medium"
          >
            {item}
            <button
              onClick={() => remove(i)}
              className="ml-1 text-emerald-500 hover:text-red-500 transition-colors leading-none"
              aria-label={`${item} 삭제`}
            >
              ×
            </button>
          </span>
        ))}
        {ingredients.length === 0 && (
          <p className="text-sm text-gray-400">인식된 재료가 없습니다. 직접 추가해주세요.</p>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="재료 직접 추가 (Enter)"
          className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <button
          onClick={add}
          className="px-4 py-2 text-sm bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
        >
          추가
        </button>
      </div>
    </div>
  );
}
