
import React from 'react';
import { Type, Plus, Minus, XCircle } from 'lucide-react';
import { TextConfig, FontFamily, Language } from '../types';

interface TextCustomizerProps {
  config: Partial<TextConfig>;
  onChange: (config: Partial<TextConfig>) => void;
  compact?: boolean;
  onReset?: () => void;
  language?: Language;
}

const TextCustomizer: React.FC<TextCustomizerProps> = ({ config, onChange, compact = false, onReset, language }) => {
  
  const updateConfig = (updates: Partial<TextConfig>) => {
    onChange({ ...config, ...updates });
  };

  const isChinese = language === 'Chinese';
  
  const FontOptions = () => (
    <>
      {isChinese ? (
        <>
          <option value="ZCOOL QingKe HuangYou">QingKe HuangYou</option>
          <option value="Ma Shan Zheng">Ma Shan Zheng</option>
          <option value="Zhi Mang Xing">Zhi Mang Xing</option>
          <option value="Noto Sans SC">Noto Sans</option>
        </>
      ) : (
        <>
          <option value="Comic Neue">Comic Neue</option>
          <option value="Bangers">Bangers</option>
          <option value="Inter">Standard</option>
        </>
      )}
    </>
  );

  // --- COMPACT MODE (Used in Edit Overlay) ---
  if (compact) {
    return (
      <div className="w-full bg-white dark:bg-slate-800 rounded-lg p-3 flex flex-col gap-3 border border-slate-200 dark:border-slate-700 shadow-xl transition-colors duration-300">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2 transition-colors duration-300">
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider transition-colors duration-300">Panel Settings</span>
          {onReset && (
            <button onClick={onReset} className="text-[10px] text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center gap-1 transition-colors duration-300">
              <XCircle className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        {/* Font */}
        <div className="flex items-center justify-between">
           <label className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">Font</label>
           <select
            value={config.fontFamily || (isChinese ? 'ZCOOL QingKe HuangYou' : 'Comic Neue')}
            onChange={(e) => updateConfig({ fontFamily: e.target.value as FontFamily })}
            className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-200 text-xs rounded px-2 py-1 w-32 focus:ring-1 focus:ring-yellow-500 outline-none transition-colors duration-300"
           >
            <FontOptions />
           </select>
        </div>

        {/* Size */}
        <div className="flex items-center justify-between">
            <label className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">Size</label>
            <div className="flex items-center bg-slate-100 dark:bg-slate-900 rounded border border-slate-300 dark:border-slate-700 transition-colors duration-300">
                <button 
                onClick={() => updateConfig({ fontSize: Math.max(0.8, (config.fontSize || 1.0) - 0.1) })}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors duration-300"
                >
                <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-mono w-8 text-center text-slate-700 dark:text-slate-300 transition-colors duration-300">
                {((config.fontSize || 1.0) * 100).toFixed(0)}%
                </span>
                <button 
                onClick={() => updateConfig({ fontSize: Math.min(2.0, (config.fontSize || 1.0) + 0.1) })}
                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors duration-300"
                >
                <Plus className="w-3 h-3" />
                </button>
            </div>
        </div>

        {/* Color */}
        <div className="flex items-center justify-between">
            <label className="text-xs text-slate-600 dark:text-slate-400 transition-colors duration-300">Color</label>
            <div className="flex gap-1.5">
            {['#000000', '#ffffff', '#ef4444', '#eab308'].map(color => (
                <button
                key={color}
                onClick={() => updateConfig({ color })}
                className={`w-4 h-4 rounded-full border ${config.color === color ? 'border-white ring-1 ring-blue-500' : 'border-transparent ring-1 ring-slate-400 dark:ring-slate-600'}`}
                style={{ backgroundColor: color }}
                />
            ))}
            </div>
        </div>

        {/* Style */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded border border-slate-300 dark:border-slate-700 transition-colors duration-300">
            {['STANDARD', 'THOUGHT', 'SHOUT'].map((style) => (
                <button
                    key={style}
                    onClick={() => updateConfig({ bubbleStyle: style as any })}
                    className={`text-[9px] font-bold py-1 rounded transition-colors duration-300 ${
                        (config.bubbleStyle || 'STANDARD') === style 
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                >
                    {style === 'STANDARD' ? 'STD' : style}
                </button>
            ))}
        </div>
      </div>
    );
  }

  // --- FULL TOOLBAR MODE (Review Screen) ---
  return (
    <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg flex flex-col lg:flex-row items-center p-2 gap-4 lg:gap-0 transition-colors duration-300">
        
        {/* Title Settings Group */}
        <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-start px-2 lg:pr-6 lg:border-r border-slate-200 dark:border-slate-800 transition-colors duration-300">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap transition-colors duration-300">Title Font</span>
            <select
                value={config.titleFontFamily || (isChinese ? 'ZCOOL QingKe HuangYou' : 'Bangers')}
                onChange={(e) => updateConfig({ titleFontFamily: e.target.value as FontFamily })}
                className="bg-transparent text-slate-900 dark:text-white text-sm font-bold border-none focus:ring-0 p-0 cursor-pointer hover:text-yellow-600 dark:hover:text-yellow-400 w-40 text-right lg:text-left transition-colors duration-300"
            >
                <FontOptions />
            </select>
        </div>

        {/* Panel Settings Group */}
        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto justify-between lg:justify-start lg:pl-6">
            
            <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest hidden sm:block transition-colors duration-300">Text</span>
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1 border border-slate-200 dark:border-slate-700 transition-colors duration-300">
                    <Type className="w-3 h-3 text-slate-500 dark:text-slate-400 ml-1 mr-2 transition-colors duration-300" />
                    <select
                    value={config.fontFamily || (isChinese ? 'ZCOOL QingKe HuangYou' : 'Comic Neue')}
                    onChange={(e) => updateConfig({ fontFamily: e.target.value as FontFamily })}
                    className="bg-transparent text-xs text-slate-900 dark:text-slate-200 border-none focus:ring-0 py-0 pl-0 pr-6 w-28 cursor-pointer transition-colors duration-300"
                    >
                    <FontOptions />
                    </select>
                </div>
            </div>

            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 transition-colors duration-300">
                <button 
                    onClick={() => updateConfig({ fontSize: Math.max(0.8, (config.fontSize || 1.0) - 0.1) })}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors duration-300"
                >
                    <Minus className="w-3 h-3" />
                </button>
                <span className="text-xs font-mono w-10 text-center text-slate-700 dark:text-slate-300 transition-colors duration-300">
                    {((config.fontSize || 1.0) * 100).toFixed(0)}%
                </span>
                <button 
                    onClick={() => updateConfig({ fontSize: Math.min(2.0, (config.fontSize || 1.0) + 0.1) })}
                    className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 rounded transition-colors duration-300"
                >
                    <Plus className="w-3 h-3" />
                </button>
            </div>

            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-1 transition-colors duration-300">
                {['#000000', '#ffffff', '#ef4444', '#eab308'].map(color => (
                <button
                    key={color}
                    onClick={() => updateConfig({ color })}
                    className={`w-4 h-4 rounded-full transition-transform ${config.color === color ? 'ring-2 ring-blue-500 scale-110' : 'hover:scale-110'}`}
                    style={{ backgroundColor: color, border: '1px solid rgba(128,128,128,0.3)' }}
                />
                ))}
            </div>

            <div className="hidden sm:block w-px h-6 bg-slate-200 dark:bg-slate-800 transition-colors duration-300"></div>

            <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 transition-colors duration-300">
                {[
                    { id: 'STANDARD', label: 'Std' },
                    { id: 'THOUGHT', label: 'Cloud' },
                    { id: 'SHOUT', label: 'Shout' }
                ].map((style) => (
                    <button
                        key={style.id}
                        onClick={() => updateConfig({ bubbleStyle: style.id as any })}
                        className={`px-3 py-1 text-[10px] font-bold rounded transition-all duration-300 ${
                            (config.bubbleStyle || 'STANDARD') === style.id
                            ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                        {style.label}
                    </button>
                ))}
            </div>

        </div>
    </div>
  );
};

export default TextCustomizer;
