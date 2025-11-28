
import React, { useState } from 'react';
import { ComicScript, ComicPage, ComicPanel, TextConfig, LayoutType, AppStatus } from '../types';
import { Download, Loader2, RefreshCw, Plus, Trash2, Settings2, GripVertical, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LayoutSelector from './LayoutSelector';
import TextCustomizer from './TextCustomizer';

interface ComicViewerProps {
  script: ComicScript;
  status: AppStatus;
  textConfig: TextConfig;
  onRegeneratePanel?: (pageIndex: number, panelIndex: number) => void;
  onLayoutChange: (pageIndex: number, layout: LayoutType) => void;
  onUpdatePanelText?: (pageIndex: number, panelIndex: number, field: 'description' | 'caption', value: string) => void;
  onAddPanel?: (pageIndex: number) => void;
  onDeletePanel?: (pageIndex: number, panelIndex: number) => void;
  onUpdatePanelConfig?: (pageIndex: number, panelIndex: number, config: Partial<TextConfig> | undefined) => void;
  onMovePanel?: (pageIndex: number, panelIndex: number, direction: 'prev' | 'next') => void;
  onResizePanel?: (pageIndex: number, panelIndex: number, span: 1 | 2) => void;
}

const ComicViewer: React.FC<ComicViewerProps> = ({ 
  script, 
  status,
  textConfig: globalTextConfig, 
  onRegeneratePanel,
  onLayoutChange,
  onUpdatePanelText,
  onAddPanel,
  onDeletePanel,
  onUpdatePanelConfig,
  onMovePanel,
  onResizePanel
}) => {
  const comicRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!comicRef.current) return;
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = comicRef.current.querySelectorAll('.comic-page-export');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
      }
      
      pdf.save(`${script.title.replace(/\s+/g, '_')}_comic.pdf`);
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const getBubbleStyles = (config: TextConfig) => {
    let base = "bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ";
    if (config.bubbleStyle === 'THOUGHT') {
      base = "bg-white border-2 border-slate-800 border-dashed p-4 rounded-[50%] shadow-lg ";
    } else if (config.bubbleStyle === 'SHOUT') {
      base = "bg-white border-4 border-black p-4 clip-shout shadow-none transform rotate-1 ";
    } else {
      base += "rounded-xl "; // Standard
    }
    return base;
  };

  const isReviewMode = status === AppStatus.REVIEW;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center w-full px-4">
        <h2 className="text-3xl font-comic-title text-yellow-500">{script.title}</h2>
        {status === AppStatus.COMPLETE && (
          <button 
            onClick={handleDownload}
            disabled={isExporting}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
        )}
      </div>

      <div ref={comicRef} className="w-full space-y-12">
        {script.pages.map((page, pageIndex) => {
          
          // Container Logic
          // We default to a 2-column grid.
          // Vertical layout effectively forces everything to be span-2 (handled in loop).
          // Splash layout effectively forces everything to be span-2 + tall.
          let gridClass = "grid-cols-2"; 
          if (page.layout === 'SPLASH' || page.layout === 'VERTICAL') gridClass = "grid-cols-1"; 

          return (
            <div key={pageIndex} className="relative group">
              
              {/* Layout Editor Toolbar */}
              {isReviewMode && (
                <div className="absolute -top-3 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                   <LayoutSelector 
                      currentLayout={page.layout} 
                      onChange={(l) => onLayoutChange(pageIndex, l)} 
                   />
                </div>
              )}

              <div 
                className="comic-page-export bg-white p-6 shadow-2xl rounded-sm"
                style={{ minHeight: '1000px' }} 
              >
                {/* Chapter Title */}
                {page.chapterTitle && (
                  <div className="mb-6 text-center border-b-2 border-black pb-2">
                    <h3 className="font-comic-title text-3xl text-black uppercase tracking-widest">{page.chapterTitle}</h3>
                  </div>
                )}

                <div className="mb-4 flex justify-between items-end border-b-4 border-black pb-2">
                  <span className="font-comic-title text-2xl text-black uppercase">Page {page.pageNumber}</span>
                  <span className="font-comic-text text-sm text-gray-500">BananaComics AI</span>
                </div>

                <div className={`grid gap-4 h-full ${gridClass}`}>
                  {page.panels.map((panel, panelIndex) => {
                    // Merge local override with global config
                    const effectiveConfig = { ...globalTextConfig, ...panel.textConfig };
                    
                    // Span Logic
                    // If manually set, use it.
                    // If not set, fallback to default behavior (usually span 1 in a grid, or auto).
                    // In Vertical/Splash, we force span-1 (which is full width of grid-cols-1).
                    // In Grid/Dynamic (grid-cols-2), we check panel.span (1 or 2).
                    
                    const isResizable = page.layout === 'GRID' || page.layout === 'DYNAMIC';
                    const currentSpan = panel.span || 1;
                    
                    // Determine grid column class
                    let spanClass = "col-span-1";
                    if (isResizable && currentSpan === 2) spanClass = "col-span-2";
                    // If automatic dynamic layout was desired, we could add logic here, 
                    // but we now initialize with span=1 and let user control it, or let 'DYNAMIC'
                    // preset initialize them differently in App.tsx. 
                    // For now, we rely on user manual control + initial generation.
                    
                    // Auto-span for last odd item if Dynamic (legacy support if span not set)
                    if (page.layout === 'DYNAMIC' && !panel.span) {
                       const isFullWidth = (panelIndex % 3 === 2) || (page.panels.length % 2 !== 0 && panelIndex === page.panels.length - 1);
                       if (isFullWidth) spanClass = "col-span-2";
                    }

                    if (page.layout === 'SPLASH') spanClass = "col-span-1 h-full";


                    return (
                      <div 
                        key={panel.id} 
                        className={`relative border-4 border-black bg-slate-100 flex flex-col ${spanClass} hover:border-yellow-500 transition-colors group/panel`}
                        style={{ minHeight: page.layout === 'SPLASH' ? '800px' : '300px' }}
                      >
                         {/* Panel Edit Tools (Review Mode) */}
                         {isReviewMode && (
                           <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover/panel:opacity-100 transition-opacity bg-slate-900/90 rounded p-1 backdrop-blur-sm">
                             
                             {/* Move Previous */}
                             {onMovePanel && panelIndex > 0 && (
                               <button onClick={() => onMovePanel(pageIndex, panelIndex, 'prev')} className="p-1 text-slate-400 hover:text-white" title="Move Back">
                                 <ChevronLeft className="w-3 h-3" />
                               </button>
                             )}

                             {/* Move Next */}
                             {onMovePanel && panelIndex < page.panels.length - 1 && (
                               <button onClick={() => onMovePanel(pageIndex, panelIndex, 'next')} className="p-1 text-slate-400 hover:text-white" title="Move Forward">
                                 <ChevronRight className="w-3 h-3" />
                               </button>
                             )}

                             <div className="w-px bg-slate-700 mx-1"></div>

                             {/* Resize */}
                             {isResizable && onResizePanel && (
                               <button 
                                 onClick={() => onResizePanel(pageIndex, panelIndex, currentSpan === 2 ? 1 : 2)}
                                 className="p-1 text-slate-400 hover:text-white"
                                 title={currentSpan === 2 ? "Shrink Width" : "Full Width"}
                               >
                                 {currentSpan === 2 ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                               </button>
                             )}

                             {/* Settings Toggle */}
                             <div className="relative">
                               <button 
                                 onClick={() => setActiveSettingsPanel(activeSettingsPanel === panel.id ? null : panel.id)}
                                 className={`p-1 rounded hover:text-white ${activeSettingsPanel === panel.id ? 'text-yellow-500' : 'text-slate-400'}`}
                                 title="Panel Text Settings"
                               >
                                 <Settings2 className="w-3 h-3" />
                               </button>
                               {activeSettingsPanel === panel.id && onUpdatePanelConfig && (
                                 <div className="absolute right-0 top-full mt-2 w-64 z-50">
                                   <TextCustomizer 
                                     config={effectiveConfig} 
                                     onChange={(newConf) => onUpdatePanelConfig(pageIndex, panelIndex, newConf)} 
                                     compact={true}
                                     onReset={() => onUpdatePanelConfig(pageIndex, panelIndex, undefined)}
                                   />
                                 </div>
                               )}
                             </div>
                             
                             <div className="w-px bg-slate-700 mx-1"></div>

                             {/* Delete Button */}
                             {onDeletePanel && page.panels.length > 1 && (
                               <button 
                                 onClick={() => {
                                   if(confirm('Delete this panel?')) onDeletePanel(pageIndex, panelIndex);
                                 }}
                                 className="p-1 text-red-400 hover:text-red-500"
                                 title="Delete Panel"
                               >
                                 <Trash2 className="w-3 h-3" />
                               </button>
                             )}
                           </div>
                         )}


                        {/* Image Area */}
                        <div className="flex-grow relative bg-slate-200 overflow-hidden flex items-center justify-center">
                          {panel.status === 'complete' && panel.imageUrl ? (
                            <img 
                              src={panel.imageUrl} 
                              alt={panel.description} 
                              className="w-full h-full object-cover"
                            />
                          ) : panel.status === 'error' ? (
                            <div className="text-red-500 flex flex-col items-center p-4 text-center">
                              <p className="mb-2 text-sm font-bold">Image Gen Failed</p>
                              {onRegeneratePanel && (
                                <button 
                                  onClick={() => onRegeneratePanel(pageIndex, panelIndex)}
                                  className="p-2 bg-slate-300 rounded-full hover:bg-slate-400"
                                >
                                  <RefreshCw className="w-5 h-5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center w-full h-full bg-slate-100">
                              {status === 'GENERATING_IMAGES' && panel.status === 'generating' ? (
                                <Loader2 className="w-8 h-8 animate-spin mb-2 text-yellow-600" />
                              ) : (
                                <div className="text-slate-300 font-bold text-4xl opacity-20 select-none">
                                  {panelIndex + 1}
                                </div>
                              )}
                              
                              {/* Editable Description in Review Mode */}
                              {isReviewMode && onUpdatePanelText ? (
                                <div className="w-full mt-2">
                                   <label className="text-[10px] uppercase font-bold text-slate-400">Visual Prompt</label>
                                   <textarea 
                                     className="w-full bg-white border border-slate-300 rounded p-2 text-xs font-mono text-slate-600 h-20 resize-none focus:ring-2 focus:ring-yellow-400 focus:outline-none"
                                     value={panel.description}
                                     onChange={(e) => onUpdatePanelText(pageIndex, panelIndex, 'description', e.target.value)}
                                     placeholder="Describe the image..."
                                   />
                                </div>
                              ) : (
                                <p className="text-xs font-mono mt-2 opacity-60 max-w-[90%]">{panel.description}</p>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Caption Box */}
                        {panel.caption && (
                          <div 
                            className={`absolute bottom-6 left-6 right-6 z-10 ${getBubbleStyles(effectiveConfig)}`}
                            style={effectiveConfig.bubbleStyle === 'SHOUT' ? { transform: 'rotate(-1deg)' } : {}}
                          >
                             {isReviewMode && onUpdatePanelText ? (
                               <textarea
                                 className="w-full bg-transparent border-none resize-none focus:outline-none text-center"
                                 style={{ 
                                   fontFamily: effectiveConfig.fontFamily, 
                                   fontSize: `${effectiveConfig.fontSize}rem`,
                                   color: effectiveConfig.color,
                                   minHeight: '3rem'
                                 }}
                                 value={panel.caption}
                                 onChange={(e) => onUpdatePanelText(pageIndex, panelIndex, 'caption', e.target.value)}
                               />
                             ) : (
                                <p 
                                  style={{ 
                                    fontFamily: effectiveConfig.fontFamily, 
                                    fontSize: `${effectiveConfig.fontSize}rem`,
                                    color: effectiveConfig.color
                                  }}
                                  className="leading-tight text-center"
                                >
                                  {panel.caption}
                                </p>
                             )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Add Panel Button */}
                {isReviewMode && onAddPanel && (
                  <button 
                    onClick={() => onAddPanel(pageIndex)}
                    className="w-full mt-4 py-3 border-2 border-dashed border-slate-300 rounded-lg text-slate-400 hover:border-yellow-500 hover:text-yellow-600 hover:bg-yellow-50 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <Plus className="w-5 h-5" /> Add Panel to Page {page.pageNumber}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComicViewer;
