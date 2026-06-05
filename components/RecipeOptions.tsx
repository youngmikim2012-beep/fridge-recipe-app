"use client";

export interface OptionsState {
  mealType: string;
  time: string;
  difficulty: string;
  dietary: string[];
}

interface Props {
  value: OptionsState;
  onChange: (next: OptionsState) => void;
}

const MEAL_TYPES = ["아침", "점심", "저녁", "간식"];
const TIMES = ["15분 이내", "30분 이내", "1시간 이내"];
const DIFFICULTIES = ["초보", "중급", "고급"];
const DIETARY = ["채식", "글루텐프리", "유제품 없음"];

function PillGroup({
  label,
  items,
  selected,
  onSelect,
}: {
  label: string;
  items: string[];
  selected: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <button
            key={item}
            onClick={() => onSelect(selected === item ? "" : item)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              selected === item
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-gray-600 border-gray-200 hover:border-emerald-400"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RecipeOptions({ value, onChange }: Props) {
  function toggleDietary(item: string) {
    const next = value.dietary.includes(item)
      ? value.dietary.filter((d) => d !== item)
      : [...value.dietary, item];
    onChange({ ...value, dietary: next });
  }

  return (
    <div className="flex flex-col gap-5">
      <PillGroup
        label="식사 유형"
        items={MEAL_TYPES}
        selected={value.mealType}
        onSelect={(v) => onChange({ ...value, mealType: v })}
      />
      <PillGroup
        label="조리 시간"
        items={TIMES}
        selected={value.time}
        onSelect={(v) => onChange({ ...value, time: v })}
      />
      <PillGroup
        label="난이도"
        items={DIFFICULTIES}
        selected={value.difficulty}
        onSelect={(v) => onChange({ ...value, difficulty: v })}
      />

      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">식이 제한</p>
        <div className="flex flex-wrap gap-2">
          {DIETARY.map((item) => {
            const checked = value.dietary.includes(item);
            return (
              <button
                key={item}
                onClick={() => toggleDietary(item)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                  checked
                    ? "bg-orange-100 text-orange-700 border-orange-300"
                    : "bg-white text-gray-600 border-gray-200 hover:border-orange-300"
                }`}
              >
                {checked ? "✓ " : ""}{item}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
