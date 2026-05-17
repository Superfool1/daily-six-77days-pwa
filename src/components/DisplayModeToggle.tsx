import type { DisplayMode } from "../types";

type DisplayModeToggleProps = {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
};

const OPTIONS: Array<{ value: DisplayMode; label: string }> = [
  { value: "both", label: "中英都显示" },
  { value: "hideChinese", label: "隐藏中文" },
  { value: "hideEnglish", label: "隐藏英文" },
];

export function DisplayModeToggle({ value, onChange }: DisplayModeToggleProps) {
  return (
    <div className="segmented-control" aria-label="显示模式">
      {OPTIONS.map((option) => (
        <button
          className={value === option.value ? "active" : ""}
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
