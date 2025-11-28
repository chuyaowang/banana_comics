import React from 'react';
import { LayoutType } from '../types';
import { LayoutGrid, RectangleVertical, StretchHorizontal, Maximize } from 'lucide-react';

interface LayoutSelectorProps {
  currentLayout: LayoutType;
  onChange: (layout: LayoutType) => void;
}

const LayoutSelector: React.FC<LayoutSelectorProps> = ({ currentLayout, onChange }) => {
  const options: { id: LayoutType; icon: React.ReactNode; label: string }[] = [
    { id: 'DYNAMIC', icon: <LayoutGrid className="w-4 h-4" />, label: 'Dynamic' },
    { id: 'GRID', icon: <StretchHorizontal className="w-4 h-4" />, label: 'Grid' },
    { id: 'VERTICAL', icon: <RectangleVertical className="w-4 h-4" />, label: 'Stack' },
    { id: 'SPLASH', icon: <Maximize className="w-4 h-4" />, label: 'Splash' },
  ];

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200">
      <span className="text-[10px] font-bold text-slate-400 uppercase px-2">Layout</span>
      {options.map((opt) => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          title={opt.label}
          className={`p-2 rounded-md transition-colors ${
            currentLayout === opt.id 
              ? 'bg-yellow-500 text-black shadow-sm' 
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-700'
          }`}
        >
          {opt.icon}
        </button>
      ))}
    </div>
  );
};

export default LayoutSelector;