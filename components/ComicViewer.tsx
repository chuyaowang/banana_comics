import React from 'react';
import { ComicScript, ComicPage, ComicPanel, TextConfig, LayoutType, AppStatus } from '../types';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import LayoutSelector from './LayoutSelector';

interface ComicViewerProps {
  script: ComicScript;
  status: AppStatus;
  textConfig: TextConfig;
  onRegeneratePanel?: (pageIndex: number, panelIndex: number) => void;
  onLayoutChange: (pageIndex: number, layout: LayoutType) => void;
}

const ComicViewer: React.FC<ComicViewerProps> = ({ 
  script, 
  status,
  textConfig, 
  onRegeneratePanel,
  onLayoutChange
}) => {
  const comicRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

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

  const getBubbleStyles = () => {
    let base = "bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ";
    if (textConfig.bubbleStyle === 'THOUGHT') {
      base = "bg-white border-2 border-slate-800 border-dashed p-4 rounded-[50%] shadow-lg ";
    } else if (textConfig.bubbleStyle === 'SHOUT') {
      base = "bg-white border-4 border-black p-4 clip-shout shadow-none transform rotate-1 ";
      // Note: clip-shout needs custom CSS or inline style
    } else {
      base += "rounded-xl "; // Standard
    }
    return base;
  };

  // Inline clip-path for Shout style to avoid external CSS dependency complexity
  const shoutStyle = textConfig.bubbleStyle === 'SHOUT' ? {
    clipPath: 'polygon(0% 0%, 100% 0%, 100% 75%, 75% 75%, 75% 100%, 50% 75%, 0% 75%)' // Simplified shout shape
    // Actually a real jagged shape is complex. Let's stick to a visual jagged border or just a distinct box.
    // For this demo, let's use a rotation and thick border for Shout instead of complex polygon which breaks text flow.
  } : {};

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

      <div ref={comicRef} className="w-full space-y-8">
        {script.pages.map((page, pageIndex) => {
          
          // Layout Logic
          let gridClass = "grid-cols-1"; // Default Vertical
          if (page.layout === 'GRID') gridClass = "grid-cols-1 md:grid-cols-2";
          if (page.layout === 'SPLASH') gridClass = "grid-cols-1";
          if (page.layout === 'DYNAMIC') gridClass = "grid-cols-2"; 

          return (
            <div key={pageIndex} className="relative group">
              
              {/* Layout Editor Toolbar - Only visible when not generating/exporting */}
              <div className="absolute -top-3 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                 <LayoutSelector 
                    currentLayout={page.layout} 
                    onChange={(l) => onLayoutChange(pageIndex, l)} 
                 />
              </div>

              <div 
                className="comic-page-export bg-white p-6 shadow-2xl rounded-sm"
                style={{ minHeight: '1000px' }} 
              >
                <div className="mb-4 flex justify-between items-end border-b-4 border-black pb-2">
                  <span className="font-comic-title text-2xl text-black uppercase">Page {page.pageNumber}</span>
                  <span className="font-comic-text text-sm text-gray-500">BananaComics AI</span>
                </div>

                <div className={`grid gap-4 h-full ${gridClass}`}>
                  {page.panels.map((panel, panelIndex) => {
                    // Dynamic Sizing Logic
                    let spanClass = "col-span-1";
                    if (page.layout === 'DYNAMIC') {
                      const isFullWidth = (panelIndex % 3 === 2) || (page.panels.length % 2 !== 0 && panelIndex === page.panels.length - 1);
                      if (isFullWidth) spanClass = "col-span-2";
                    }
                    if (page.layout === 'SPLASH') spanClass = "col-span-1 h-full";

                    return (
                      <div 
                        key={panel.id} 
                        className={`relative border-4 border-black bg-slate-100 flex flex-col ${spanClass}`}
                        style={{ minHeight: page.layout === 'SPLASH' ? '800px' : '300px' }}
                      >
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
                              <p className="text-xs font-mono mt-2 opacity-60 max-w-[90%]">{panel.description}</p>
                            </div>
                          )}
                        </div>

                        {/* Caption Box */}
                        {panel.caption && (
                          <div 
                            className={`absolute bottom-6 left-6 right-6 ${getBubbleStyles()}`}
                            style={textConfig.bubbleStyle === 'SHOUT' ? { transform: 'rotate(-1deg)' } : {}}
                          >
                            <p 
                              style={{ 
                                fontFamily: textConfig.fontFamily, 
                                fontSize: `${textConfig.fontSize}rem`,
                                color: textConfig.color
                              }}
                              className="leading-tight"
                            >
                              {panel.caption}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ComicViewer;