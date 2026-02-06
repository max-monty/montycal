import { useState } from 'react';
import { useCategoryStore } from '../../stores/category-store';
import { ColorPicker } from '../ui/ColorPicker';

export function CategoryManager() {
  const { categories, addCategory, updateCategory, deleteCategory } = useCategoryStore();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string | undefined>('#3b82f6');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColorId, setEditColorId] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newName.trim() || !newColor) return;
    await addCategory(newName.trim(), newColor);
    setNewName('');
    setNewColor('#3b82f6');
  };

  const saveEditName = (id: string) => {
    if (editName.trim()) {
      updateCategory(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-cal-text-muted uppercase tracking-wider">Categories</h3>

      <div className="space-y-1">
        {categories.map((cat) => (
          <div key={cat.id}>
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-cal-surface-hover group">
              {/* Color dot — click to change color */}
              <button
                className="w-4 h-4 rounded-full shrink-0 ring-2 ring-transparent hover:ring-white/30 transition-all"
                style={{ backgroundColor: cat.color }}
                onClick={() => setEditColorId(editColorId === cat.id ? null : cat.id)}
                title="Change color"
              />

              {/* Name — click to edit */}
              {editingId === cat.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => saveEditName(cat.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditName(cat.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="flex-1 bg-cal-bg border border-cal-border rounded px-2 py-0.5 text-sm focus:outline-none focus:border-cal-accent"
                  autoFocus
                />
              ) : (
                <span
                  className="flex-1 text-sm cursor-pointer hover:text-cal-accent transition-colors"
                  onClick={() => {
                    setEditingId(cat.id);
                    setEditName(cat.name);
                  }}
                  title="Click to rename"
                >
                  {cat.name}
                </span>
              )}

              {/* Delete button */}
              <button
                onClick={() => {
                  if (editColorId === cat.id) setEditColorId(null);
                  deleteCategory(cat.id);
                }}
                className="text-xs text-red-400 opacity-0 group-hover:opacity-100 hover:text-red-300 transition-opacity px-1"
                title="Delete category"
              >
                ✕
              </button>
            </div>

            {/* Inline color picker when editing color */}
            {editColorId === cat.id && (
              <div className="px-2 py-2 ml-6">
                <ColorPicker
                  value={cat.color}
                  onChange={(c) => {
                    if (c) updateCategory(cat.id, { color: c });
                  }}
                  allowClear={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new category */}
      <div className="border-t border-cal-border pt-3 space-y-2">
        <div className="text-xs text-cal-text-dim mb-1">Add new category</div>
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Category name..."
          className="w-full bg-cal-bg border border-cal-border rounded-lg px-3 py-1.5 text-sm text-cal-text placeholder:text-cal-text-dim focus:outline-none focus:border-cal-accent"
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
        />
        <ColorPicker value={newColor} onChange={setNewColor} allowClear={false} />
        <button
          onClick={handleAdd}
          disabled={!newName.trim() || !newColor}
          className="w-full bg-cal-accent hover:bg-cal-accent/90 disabled:opacity-40 text-white text-sm font-medium py-1.5 rounded-lg transition-colors"
        >
          Add Category
        </button>
      </div>
    </div>
  );
}
