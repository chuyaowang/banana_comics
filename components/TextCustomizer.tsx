import React from 'react';
import { Type, MessageSquare, Plus, Minus, Palette, XCircle } from 'lucide-react';
import { TextConfig, FontFamily, BubbleStyle } from '../types';

interface TextCustomizerProps {
  config: Partial<TextConfig>;
  onChange: (config: Partial<TextConfig>) => void;
  compact?: boolean;
  onReset?: () => void;
}

const TextCustomizer: React.FC<TextCustomizerProps> = ({ config, onChange, compact = false, onReset }) => {
  
  // Defaults for display if undefined in partial config (though logic usually merges before passing)
  // However, for the UI state, we want to show what's active.
  // We assume the parent component passes the *effective* config or the specific override config.
  // If we are editing overrides, we might receive undefined values. 
  
  const updateConfig = (updates: Partial<TextConfig>) => {
    onChange({ ...config, ...updates });
  };

  const containerClass = compact 
    ? "w-full p-3 bg-slate-800 rounded-lg flex flex-col gap-3 shadow-xl border border-slate-700 z-50"
    : "w-full bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-6 items-center justify-between shadow-lg";

  return (
    <div className={containerClass}>
      
      {/* Header for compact mode */}
      {compact && (
        <div className="flex justify-between items-center border-b border-slate-700 pb-2 mb-1">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Panel Styling</span>
          {onReset && (
            <button onClick={onReset} className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1">
              <XCircle className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      )}

      {/* Font Family */}
      <div className={`flex items-center ${compact ? 'justify-between' : 'gap-3'}`}>
        {!compact && <Type className="w-4 h-4 text-gray-400" />}
        {compact && <span className="text-xs text-gray-400">Font</span>}
        <select
          value={config.fontFamily || 'Comic Neue'}
          onChange={(e) => updateConfig({ fontFamily: e.target.value as FontFamily })}
          className="bg-slate-700 border border-slate-600 text-white text-xs rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-1.5"
        >
          <option value="Comic Neue">Comic Neue</option>
          <option value="Bangers">Bangers</option>
          <option value="Inter">Standard</option>
        </select>
      </div>

      {/* Font Size */}
      <div className={`flex items-center ${compact ? 'justify-between' : 'gap-2'}`}>
        {compact && <span className="text-xs text-gray-400">Size</span>}
        <div className="flex items-center gap-2">
            <button 
            onClick={() => updateConfig({ fontSize: Math.max(0.8, (config.fontSize || 1.0) - 0.1) })}
            className="p-1 hover:bg-slate-600 rounded text-gray-400"
            >
            <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-mono w-8 text-center text-gray-300">
            {((config.fontSize || 1.0) * 100).toFixed(0)}%
            </span>
            <button 
            onClick={() => updateConfig({ fontSize: Math.min(2.0, (config.fontSize || 1.0) + 0.1) })}
            className="p-1 hover:bg-slate-600 rounded text-gray-400"
            >
            <Plus className="w-3 h-3" />
            </button>
        </div>
      </div>

      {/* Text Color */}
      <div className={`flex items-center ${compact ? 'justify-between' : 'gap-3'}`}>
        {!compact && <Palette className="w-4 h-4 text-gray-400" />}
        {compact && <span className="text-xs text-gray-400">Color</span>}
        <div className="flex gap-1.5">
          {['#000000', '#ffffff', '#ef4444', '#eab308'].map(color => (
            <button
              key={color}
              onClick={() => updateConfig({ color })}
              className={`w-5 h-5 rounded-full border-2 ${config.color === color ? 'border-blue-500 scale-110' : 'border-slate-600'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Bubble Style */}
      <div className={`flex items-center ${compact ? 'justify-between w-full' : 'gap-3'}`}>
        {!compact && <MessageSquare className="w-4 h-4 text-gray-400" />}
        {compact && <span className="text-xs text-gray-400">Bubble</span>}
        <div className="flex bg-slate-700 rounded-lg p-0.5">
          <button
            onClick={() => updateConfig({ bubbleStyle: 'STANDARD' })}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${config.bubbleStyle === 'STANDARD' || !config.bubbleStyle ? 'bg-slate-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Std
          </button>
          <button
            onClick={() => updateConfig({ bubbleStyle: 'THOUGHT' })}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${config.bubbleStyle === 'THOUGHT' ? 'bg-slate-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Cloud
          </button>
          <button
            onClick={() => updateConfig({ bubbleStyle: 'SHOUT' })}
            className={`px-2 py-1 text-[10px] rounded-md transition-colors ${config.bubbleStyle === 'SHOUT' ? 'bg-slate-500 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Shout
          </button>
        </div>
      </div>

    </div>
  );
};

export default TextCustomizer;