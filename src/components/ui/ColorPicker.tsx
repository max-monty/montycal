import { memo, useState } from 'react';

const PRESET_COLORS = [
  '#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b',
  '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#84cc16',
  '#06b6d4', '#e11d48', '#a855f7', '#22c55e', '#eab308',
];

interface ColorPickerProps {
  value: string | undefined;
  onChange: (color: string | undefined) => void;
  allowClear?: boolean;
}

export const ColorPicker = memo(function ColorPicker({ value, onChange, allowClear = true }: ColorPickerProps) {
  const [customOpen, setCustomOpen] = useState(false);

  return (
    <div className="flex flex-wrap gap-1.5 items-center">
      {allowClear && (
        <button
          onClick={() => onChange(undefined)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] ${
            !value ? 'border-cal-accent' : 'border-cal-border'
          }`}
          title="No color"
        >
          ✕
        </button>
      )}
      {PRESET_COLORS.map((color) => (
        <button
          key={color}
          onClick={() => onChange(color)}
          className={`w-6 h-6 rounded-full border-2 transition-transform ${
            value === color ? 'border-white scale-125' : 'border-transparent'
          }`}
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
      <button
        onClick={() => setCustomOpen(!customOpen)}
        className="w-6 h-6 rounded-full border-2 border-cal-border bg-gradient-to-br from-red-500 via-green-500 to-blue-500 text-[8px] flex items-center justify-center"
        title="Custom color"
      />
      {customOpen && (
        <input
          type="color"
          value={value || '#3b82f6'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-6 cursor-pointer bg-transparent border-0"
        />
      )}
    </div>
  );
});
