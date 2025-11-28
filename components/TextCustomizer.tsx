import React from 'react';
import { Type, MessageSquare, Plus, Minus, Palette } from 'lucide-react';
import { TextConfig, FontFamily, BubbleStyle } from '../types';

interface TextCustomizerProps {
  config: TextConfig;
  onChange: (config: TextConfig) => void;
}

const TextCustomizer: React.FC<TextCustomizerProps> = ({ config, onChange }) => {
  const updateConfig = (updates: Partial<TextConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="w-full bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-wrap gap-6 items-center justify-between shadow-lg">
      
      {/* Font Family */}
      <div className="flex items-center gap-3">
        <Type className="w-4 h-4 text-gray-400" />
        <select
          value={config.fontFamily}
          onChange={(e) => updateConfig({ fontFamily: e.target.value as FontFamily })}
          className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-yellow-500 focus:border-yellow-500 block p-2"
        >
          <option value="Comic Neue">Comic Neue</option>
          <option value="Bangers">Bangers</option>
          <option value="Inter">Standard (Inter)</option>
        </select>
      </div>

      {/* Font Size */}
      <div className="flex items-center gap-2">
        <button 
          onClick={() => updateConfig({ fontSize: Math.max(0.8, config.fontSize - 0.1) })}
          className="p-1 hover:bg-slate-800 rounded text-gray-400"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs font-mono w-12 text-center text-gray-300">
          {(config.fontSize * 100).toFixed(0)}%
        </span>
        <button 
          onClick={() => updateConfig({ fontSize: Math.min(2.0, config.fontSize + 0.1) })}
          className="p-1 hover:bg-slate-800 rounded text-gray-400"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Text Color */}
      <div className="flex items-center gap-3">
        <Palette className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2">
          {['#000000', '#ffffff', '#ef4444', '#eab308'].map(color => (
            <button
              key={color}
              onClick={() => updateConfig({ color })}
              className={`w-6 h-6 rounded-full border-2 ${config.color === color ? 'border-blue-500 scale-110' : 'border-slate-600'}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Bubble Style */}
      <div className="flex items-center gap-3">
        <MessageSquare className="w-4 h-4 text-gray-400" />
        <div className="flex bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => updateConfig({ bubbleStyle: 'STANDARD' })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${config.bubbleStyle === 'STANDARD' ? 'bg-slate-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Std
          </button>
          <button
            onClick={() => updateConfig({ bubbleStyle: 'THOUGHT' })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${config.bubbleStyle === 'THOUGHT' ? 'bg-slate-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Cloud
          </button>
          <button
            onClick={() => updateConfig({ bubbleStyle: 'SHOUT' })}
            className={`px-3 py-1 text-xs rounded-md transition-colors ${config.bubbleStyle === 'SHOUT' ? 'bg-slate-600 text-white' : 'text-gray-400 hover:text-white'}`}
          >
            Shout
          </button>
        </div>
      </div>

    </div>
  );
};

export default TextCustomizer;