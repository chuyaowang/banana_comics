import React, { useState, useCallback } from 'react';
import { 
  AppStatus, 
  ComicScript, 
  ComicPage, 
  ComicPanel 
} from './types';
import FileUploader from './components/FileUploader';
import StyleInput from './components/StyleInput';
import ComicViewer from './components/ComicViewer';
import { generateComicScript, generatePanelImage } from './services/gemini';
import { readFileContent } from './utils/fileHelpers';
import { Loader2, Wand2, BookOpen, AlertCircle } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [styleDesc, setStyleDesc] = useState<string>("");
  const [script, setScript] = useState<ComicScript | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Helper to update a specific panel's status/image
  const updatePanel = useCallback((pageIndex: number, panelIndex: number, updates: Partial<ComicPanel>) => {
    setScript(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      const newPanels = [...newPages[pageIndex].panels];
      newPanels[panelIndex] = { ...newPanels[panelIndex], ...updates };
      newPages[pageIndex] = { ...newPages[pageIndex], panels: newPanels };
      return { ...prev, pages: newPages };
    });
  }, []);

  const processComicGeneration = async (currentScript: ComicScript, artStyle: string) => {
    setStatus(AppStatus.GENERATING_IMAGES);
    
    // We process sequentially to avoid overwhelming rate limits, or in small batches.
    // Let's do 1 by 1 for safety and clear progress.
    for (let i = 0; i < currentScript.pages.length; i++) {
      const page = currentScript.pages[i];
      for (let j = 0; j < page.panels.length; j++) {
        const panel = page.panels[j];
        
        // Update to generating
        updatePanel(i, j, { status: 'generating' });
        
        try {
          // Add random seed or variation if needed, but here simple prompt
          const imageUrl = await generatePanelImage(panel.description, artStyle);
          updatePanel(i, j, { status: 'complete', imageUrl });
        } catch (error) {
          console.error(`Failed to gen panel ${i}-${j}`, error);
          updatePanel(i, j, { status: 'error' });
        }
      }
    }
    
    setStatus(AppStatus.COMPLETE);
  };

  const handleStart = async () => {
    if (!file || !styleDesc) return;
    setErrorMsg(null);

    try {
      setStatus(AppStatus.PARSING);
      const text = await readFileContent(file);
      
      setStatus(AppStatus.SCRIPTING);
      const generatedScript = await generateComicScript(text);
      
      // Initialize panels with IDs and status
      const initializedPages: ComicPage[] = generatedScript.pages.map(page => ({
        ...page,
        panels: page.panels.map((panel, idx) => ({
          ...panel,
          id: `p${page.pageNumber}-${idx}`,
          status: 'pending'
        }))
      }));

      const initializedScript: ComicScript = {
        ...generatedScript,
        pages: initializedPages
      };

      setScript(initializedScript);
      
      // Start image generation
      await processComicGeneration(initializedScript, styleDesc);
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleRegeneratePanel = async (pageIndex: number, panelIndex: number) => {
    if (!script) return;
    const panel = script.pages[pageIndex].panels[panelIndex];
    
    updatePanel(pageIndex, panelIndex, { status: 'generating' });
    try {
      const imageUrl = await generatePanelImage(panel.description, styleDesc);
      updatePanel(pageIndex, panelIndex, { status: 'complete', imageUrl });
    } catch (error) {
      updatePanel(pageIndex, panelIndex, { status: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-yellow-500 selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-comic-title text-white tracking-wide">
              Banana<span className="text-yellow-500">Comics</span>
            </h1>
          </div>
          <div className="text-xs font-mono text-slate-500">
             Powered by Gemini Nano Banana
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-comic-title text-white">
                Turn your words into <span className="text-yellow-500">Art</span>
              </h2>
              <p className="text-slate-400 text-lg">
                Upload a story, script, or document. We'll handle the rest, panel by panel.
              </p>
            </div>

            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">1</span>
                  Upload Story
                </h3>
                <FileUploader onFileSelect={setFile} selectedFile={file} />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">2</span>
                  Choose Style
                </h3>
                <StyleInput value={styleDesc} onChange={setStyleDesc} />
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handleStart}
                disabled={!file || !styleDesc}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                Generate Comic
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             {/* Progress Header */}
             {(status === AppStatus.PARSING || status === AppStatus.SCRIPTING) && (
               <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
                 <h2 className="text-2xl font-comic-title animate-pulse">
                   {status === AppStatus.PARSING ? 'Reading Document...' : 'Writing Script & Layout...'}
                 </h2>
                 <p className="text-slate-500">The AI is breaking down your story into panels.</p>
               </div>
             )}

             {/* Viewer */}
             {(status === AppStatus.GENERATING_IMAGES || status === AppStatus.COMPLETE) && script && (
               <div className="animate-in fade-in duration-500 slide-in-from-bottom-10">
                 <ComicViewer script={script} onRegeneratePanel={handleRegeneratePanel} />
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
