
import React, { useState } from 'react';
import { ComicScript, ComicPage, ComicPanel, TextConfig, LayoutType, AppStatus, ComicResourcePack, Language } from '../types';
import { Download, Loader2, RefreshCw, Plus, Trash2, Settings2, GripVertical, ChevronLeft, ChevronRight, Maximize2, Minimize2, Eye, EyeOff, Package, PenLine, Check, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import JSZip from 'jszip';
import LayoutSelector from './LayoutSelector';
import TextCustomizer from './TextCustomizer';

interface ComicViewerProps {
  script: ComicScript;
  status: AppStatus;
  textConfig: TextConfig;
  originalFile: File | null;
  artStyle: string;
  language: Language; // New prop to pass language down
  onRegeneratePanel?: (pageIndex: number, panelIndex: number) => void;
  onLayoutChange: (pageIndex: number, layout: LayoutType) => void;
  onUpdatePanelText?: (pageIndex: number, panelIndex: number, field: 'description' | 'caption', value: string) => void;
  onAddPanel?: (pageIndex: number) => void;
  onDeletePanel?: (pageIndex: number, panelIndex: number) => void;
  onUpdatePanelConfig?: (pageIndex: number, panelIndex: number, config: Partial<TextConfig> | undefined) => void;
  onMovePanel?: (pageIndex: number, panelIndex: number, direction: 'prev' | 'next') => void;
  onResizePanel?: (pageIndex: number, panelIndex: number, span: 1 | 2) => void;
  onCaptionBlur?: (pageIndex: number, panelIndex: number, caption: string) => void;
}

const ComicViewer: React.FC<ComicViewerProps> = ({ 
  script, 
  status,
  textConfig: globalTextConfig,
  originalFile,
  artStyle,
  language,
  onRegeneratePanel,
  onLayoutChange,
  onUpdatePanelText,
  onAddPanel,
  onDeletePanel,
  onUpdatePanelConfig,
  onMovePanel,
  onResizePanel,
  onCaptionBlur
}) => {
  const comicRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isZipping, setIsZipping] = React.useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<string | null>(null);
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [showCaptions, setShowCaptions] = useState(true);

  const handleDownloadPDF = async () => {
    if (!comicRef.current) return;
    setIsExporting(true);
    
    try {
      const pages = comicRef.current.querySelectorAll('.comic-page-export');
      let pdf: jsPDF | null = null;

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true, logging: false });
        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        const imgWidthPx = canvas.width;
        const imgHeightPx = canvas.height;
        const pdfPageWidthMM = 210;
        const marginMM = 10;
        const contentWidthMM = pdfPageWidthMM - (marginMM * 2);
        const contentHeightMM = (imgHeightPx * contentWidthMM) / imgWidthPx;
        const pdfPageHeightMM = contentHeightMM + (marginMM * 2);

        if (i === 0) {
           pdf = new jsPDF({
             orientation: 'p',
             unit: 'mm',
             format: [pdfPageWidthMM, pdfPageHeightMM]
           });
        } else {
           pdf?.addPage([pdfPageWidthMM, pdfPageHeightMM]);
        }
        
        pdf?.addImage(imgData, 'JPEG', marginMM, marginMM, contentWidthMM, contentHeightMM);
      }
      
      if (pdf) {
        pdf.save(`${script.title.replace(/\s+/g, '_')}_comic.pdf`);
      }
    } catch (err) {
      console.error("Export failed", err);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadResources = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      
      const resourceData: ComicResourcePack = {
        title: script.title,
        metadata: {
          artStyle: artStyle,
          themeAndTone: script.theme || "None", // Consolidated field
          language: language, 
          date: new Date().toISOString()
        },
        chapters: script.pages.map(page => ({
          chapterNumber: page.pageNumber,
          title: page.chapterTitle || `Page ${page.pageNumber}`,
          panels: page.panels.map((panel, idx) => ({
            index: idx + 1,
            caption: panel.caption,
            visualPrompt: panel.description,
            imageFileName: `page_${page.pageNumber}_panel_${idx + 1}.png`
          }))
        }))
      };

      zip.file("comic_data.json", JSON.stringify(resourceData, null, 2));

      if (originalFile) {
        zip.file(`original_source_${originalFile.name}`, originalFile);
      }
      
      const imgFolder = zip.folder("images");
      script.pages.forEach((page) => {
        page.panels.forEach((panel, idx) => {
          if (panel.imageUrl && panel.imageUrl.startsWith('data:image')) {
            const data = panel.imageUrl.split(',')[1];
            imgFolder?.file(`page_${page.pageNumber}_panel_${idx + 1}.png`, data, { base64: true });
          }
        });
      });

      const content = await zip.generateAsync({ type: "blob" });
      const url = window.URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${script.title.replace(/\s+/g, '_')}_resources.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (err) {
      console.error("Zip failed", err);
      alert("Failed to create resource bundle.");
    } finally {
      setIsZipping(false);
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
  // Layout controls (move, resize, delete, layout selector) should be available in both Review and Complete modes
  const showLayoutControls = status === AppStatus.REVIEW || status === AppStatus.COMPLETE;

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 gap-4">
        <h2 
          className="text-4xl text-yellow-500 tracking-wider uppercase drop-shadow-[2px_2px_0_rgba(0,0,0,0.8)]"
          style={{ fontFamily: globalTextConfig.titleFontFamily || 'Bangers' }}
        >
          {script.title}
        </h2>
        
        {status === AppStatus.COMPLETE && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowCaptions(!showCaptions)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors text-sm"
              title={showCaptions ? "Hide Captions" : "Show Captions"}
            >
              {showCaptions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showCaptions ? "Hide Text" : "Show Text"}
            </button>
            <button 
              onClick={handleDownloadResources}
              disabled={isZipping}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-500 disabled:opacity-50 transition-colors text-sm"
            >
              {isZipping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Package className="w-4 h-4" />}
              Resources
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors text-sm"
            >
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              PDF
            </button>
          </div>
        )}
      </div>

      <div ref={comicRef} className="w-full space-y-12">
        {script.pages.map((page, pageIndex) => {
          
          let gridClass = "grid-cols-2"; 
          if (page.layout === 'SPLASH' || page.layout === 'VERTICAL') gridClass = "grid-cols-1"; 

          return (
            <div key={pageIndex} className="relative group">
              
              {showLayoutControls && (
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
                {page.chapterTitle && (
                  <div className="mb-6 text-center border-b-2 border-black pb-2">
                    <h3 
                      className="text-3xl text-black uppercase tracking-widest"
                      style={{ fontFamily: globalTextConfig.titleFontFamily || 'Bangers' }}
                    >
                      {page.chapterTitle}
                    </h3>
                  </div>
                )}

                <div className="mb-4 flex justify-between items-end border-b-4 border-black pb-2">
                  <span 
                    className="text-2xl text-black uppercase"
                    style={{ fontFamily: globalTextConfig.titleFontFamily || 'Bangers' }}
                  >
                    Page {page.pageNumber}
                  </span>
                  <span className="font-comic-text text-sm text-gray-500">BananaComics AI</span>
                </div>

                <div className={`grid gap-4 h-full ${gridClass}`}>
                  {page.panels.map((panel, panelIndex) => {
                    const effectiveConfig = { ...globalTextConfig, ...panel.textConfig };
                    const isResizable = page.layout === 'GRID' || page.layout === 'DYNAMIC';
                    const currentSpan = panel.span || 1;
                    
                    let spanClass = "col-span-1";
                    if (isResizable && currentSpan === 2) spanClass = "col-span-2";
                    
                    if (page.layout === 'DYNAMIC' && !panel.span) {
                       const isFullWidth = (panelIndex % 3 === 2) || (page.panels.length % 2 !== 0 && panelIndex === page.panels.length - 1);
                       if (isFullWidth) spanClass = "col-span-2";
                    }

                    if (page.layout === 'SPLASH') spanClass = "col-span-1 h-full";

                    const isEditing = editingPanelId === panel.id;
                    const canEdit = status === AppStatus.COMPLETE;
                    const isBusy = panel.status === 'generating' || panel.status === 'updating_prompt';

                    return (
                      <div 
                        key={panel.id} 
                        className={`relative border-4 border-black bg-slate-100 flex flex-col ${spanClass} hover:border-yellow-500 transition-colors group/panel`}
                        style={{ minHeight: page.layout === 'SPLASH' ? '800px' : '300px' }}
                      >
                         {/* Layout Controls Toolbar */}
                         {showLayoutControls && (
                           <div className="absolute top-2 right-2 z-20 flex gap-1 opacity-0 group-hover/panel:opacity-100 transition-opacity bg-slate-900/90 rounded p-1 backdrop-blur-sm">
                             {onMovePanel && panelIndex > 0 && (
                               <button onClick={() => onMovePanel(pageIndex, panelIndex, 'prev')} className="p-1 text-slate-400 hover:text-white" title="Move Back">
                                 <ChevronLeft className="w-3 h-3" />
                               </button>
                             )}
                             {onMovePanel && panelIndex < page.panels.length - 1 && (
                               <button onClick={() => onMovePanel(pageIndex, panelIndex, 'next')} className="p-1 text-slate-400 hover:text-white" title="Move Forward">
                                 <ChevronRight className="w-3 h-3" />
                               </button>
                             )}
                             <div className="w-px bg-slate-700 mx-1"></div>
                             {isResizable && onResizePanel && (
                               <button 
                                 onClick={() => onResizePanel(pageIndex, panelIndex, currentSpan === 2 ? 1 : 2)}
                                 className="p-1 text-slate-400 hover:text-white"
                                 title={currentSpan === 2 ? "Shrink Width" : "Full Width"}
                               >
                                 {currentSpan === 2 ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                               </button>
                             )}
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
                                     language={language}
                                   />
                                 </div>
                               )}
                             </div>
                             <div className="w-px bg-slate-700 mx-1"></div>
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

                        {/* Post-Gen Edit Toggle */}
                        {canEdit && !isEditing && panel.status !== 'generating' && (
                          <div className="absolute top-2 right-2 z-20 opacity-0 group-hover/panel:opacity-100 transition-opacity mt-8 mr-1"> 
                            {/* Adjusted margin to clear the toolbar if both are visible, though hover usually shows one */}
                            <button
                              onClick={() => setEditingPanelId(panel.id)}
                              className="p-2 bg-white/50 hover:bg-white text-slate-800 rounded-full shadow-sm backdrop-blur-sm transition-all"
                              title="Edit Panel Content"
                            >
                              <PenLine className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        {/* Image Area */}
                        <div className="flex-grow relative bg-slate-200 overflow-hidden flex items-center justify-center">
                          {panel.status === 'complete' && panel.imageUrl ? (
                            <img 
                              src={panel.imageUrl} 
                              alt={panel.description} 
                              className={`w-full h-full object-cover ${isEditing ? 'opacity-50 blur-sm' : ''}`}
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
                            // Loading or Empty State
                            <div className="flex flex-col items-center justify-center text-slate-500 p-6 text-center w-full h-full bg-slate-100">
                              {panel.status === 'generating' ? (
                                <div className="flex flex-col items-center">
                                  <Loader2 className="w-8 h-8 animate-spin mb-2 text-yellow-600" />
                                  <span className="text-xs text-yellow-700 font-bold uppercase animate-pulse">Generating Art...</span>
                                </div>
                              ) : panel.status === 'updating_prompt' ? (
                                <div className="flex flex-col items-center">
                                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500 mb-2" />
                                  <span className="text-xs text-purple-600 font-bold uppercase">Updating Visuals...</span>
                                </div>
                              ) : (
                                <div className="text-slate-300 font-bold text-4xl opacity-20 select-none">
                                  {panelIndex + 1}
                                </div>
                              )}
                              
                              {/* Editable Description in Review Mode (Pre-Generation) */}
                              {isReviewMode && onUpdatePanelText && panel.status !== 'updating_prompt' && panel.status !== 'generating' ? (
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
                                !isReviewMode && !isEditing && panel.status !== 'generating' && (
                                  <p className="text-xs font-mono mt-2 opacity-60 max-w-[90%]">{panel.description}</p>
                                )
                              )}
                            </div>
                          )}

                          {/* Post-Gen Edit Mode Overlay */}
                          {isEditing && (
                            <div className="absolute inset-0 z-30 flex flex-col p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-white text-sm font-bold uppercase">Edit Panel</h4>
                                <button 
                                  onClick={() => !isBusy && setEditingPanelId(null)}
                                  disabled={isBusy}
                                  className={`${isBusy ? 'text-slate-600 cursor-not-allowed' : 'text-slate-400 hover:text-white'}`}
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                              
                              {onUpdatePanelConfig && (
                                <div className="mb-4">
                                  <TextCustomizer 
                                    config={effectiveConfig} 
                                    onChange={(newConf) => onUpdatePanelConfig(pageIndex, panelIndex, newConf)} 
                                    compact={true}
                                    onReset={() => onUpdatePanelConfig(pageIndex, panelIndex, undefined)}
                                    language={language}
                                  />
                                </div>
                              )}

                              <div className="space-y-4">
                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1">Visual Prompt</label>
                                  <textarea
                                    className="w-full h-24 bg-slate-800 border border-slate-700 rounded p-2 text-xs text-slate-200 resize-none focus:ring-1 focus:ring-yellow-500"
                                    value={panel.description}
                                    onChange={(e) => onUpdatePanelText && onUpdatePanelText(pageIndex, panelIndex, 'description', e.target.value)}
                                    disabled={isBusy}
                                  />
                                  {onRegeneratePanel && (
                                    <button 
                                      onClick={() => onRegeneratePanel(pageIndex, panelIndex)}
                                      disabled={isBusy}
                                      className="mt-2 w-full py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                                    >
                                      {panel.status === 'generating' ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                                      {panel.status === 'generating' ? 'Generating...' : 'Regenerate Image'}
                                    </button>
                                  )}
                                </div>

                                <div>
                                  <label className="block text-xs font-bold text-slate-400 mb-1">Caption</label>
                                  <textarea
                                    className="w-full h-20 bg-slate-800 border border-slate-700 rounded p-2 text-xs text-slate-200 resize-none focus:ring-1 focus:ring-yellow-500"
                                    value={panel.caption}
                                    onChange={(e) => onUpdatePanelText && onUpdatePanelText(pageIndex, panelIndex, 'caption', e.target.value)}
                                    onBlur={(e) => onCaptionBlur && onCaptionBlur(pageIndex, panelIndex, e.target.value)}
                                    disabled={isBusy}
                                  />
                                </div>

                                <button 
                                  onClick={() => setEditingPanelId(null)}
                                  disabled={isBusy}
                                  className={`w-full py-2 ${isBusy ? 'bg-slate-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-500'} text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors`}
                                >
                                  {isBusy ? (
                                    <>
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                      Processing...
                                    </>
                                  ) : (
                                    <>
                                      <Check className="w-3 h-3" />
                                      Done
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Caption Box */}
                        {(showCaptions || isEditing) && panel.caption && !isEditing && (
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
                                 onBlur={(e) => onCaptionBlur && onCaptionBlur(pageIndex, panelIndex, e.target.value)}
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
                
                {showLayoutControls && onAddPanel && (
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
