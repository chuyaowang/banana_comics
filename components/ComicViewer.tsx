import React from 'react';
import { ComicScript, ComicPage, ComicPanel } from '../types';
import { Download, Loader2, RefreshCw } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ComicViewerProps {
  script: ComicScript;
  onRegeneratePanel: (pageIndex: number, panelIndex: number) => void;
}

const ComicViewer: React.FC<ComicViewerProps> = ({ script, onRegeneratePanel }) => {
  const comicRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);

  const handleDownload = async () => {
    if (!comicRef.current) return;
    setIsExporting(true);
    
    try {
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pages = comicRef.current.querySelectorAll('.comic-page');
      
      for (let i = 0; i < pages.length; i++) {
        const page = pages[i] as HTMLElement;
        const canvas = await html2canvas(page, { scale: 2, useCORS: true });
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

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center w-full px-4">
        <h2 className="text-3xl font-comic-title text-yellow-500">{script.title}</h2>
        <button 
          onClick={handleDownload}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-slate-900 rounded-lg font-bold hover:bg-yellow-400 disabled:opacity-50 transition-colors"
        >
          {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export PDF
        </button>
      </div>

      <div ref={comicRef} className="w-full space-y-8">
        {script.pages.map((page, pageIndex) => (
          <div 
            key={pageIndex} 
            className="comic-page bg-white p-6 shadow-2xl rounded-sm"
            style={{ minHeight: '1000px' }} // Simulate A4 ratio roughly
          >
            <div className="mb-4 flex justify-between items-end border-b-4 border-black pb-2">
              <span className="font-comic-title text-2xl text-black uppercase">Page {page.pageNumber}</span>
              <span className="font-comic-text text-sm text-gray-500">BananaComics AI</span>
            </div>

            <div className="grid grid-cols-2 gap-4 h-full">
              {page.panels.map((panel, panelIndex) => {
                // Determine span for layout variety based on index
                // Simple logic: every 3rd panel spans full width if it exists
                const isFullWidth = (panelIndex % 3 === 2) || (page.panels.length % 2 !== 0 && panelIndex === page.panels.length - 1);
                
                return (
                  <div 
                    key={panel.id} 
                    className={`relative border-4 border-black bg-slate-100 flex flex-col ${isFullWidth ? 'col-span-2' : 'col-span-1'}`}
                    style={{ minHeight: '300px' }}
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
                           <button 
                            onClick={() => onRegeneratePanel(pageIndex, panelIndex)}
                            className="p-2 bg-slate-300 rounded-full hover:bg-slate-400"
                           >
                             <RefreshCw className="w-5 h-5" />
                           </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-500 animate-pulse p-6 text-center">
                          <Loader2 className="w-8 h-8 animate-spin mb-2 text-yellow-600" />
                          <p className="text-xs font-mono">{panel.status === 'generating' ? 'Drawing...' : 'Waiting...'}</p>
                          <p className="text-[10px] mt-2 opacity-60 max-w-[200px]">{panel.description.slice(0, 50)}...</p>
                        </div>
                      )}
                    </div>

                    {/* Caption Box */}
                    {panel.caption && (
                      <div className="absolute bottom-4 left-4 right-4 bg-white border-2 border-black p-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        <p className="font-comic-text text-black text-sm md:text-base leading-tight">
                          {panel.caption}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComicViewer;
