
import React, { useState, useCallback, useEffect } from 'react';
import { 
  AppStatus, 
  ComicScript, 
  ComicPage, 
  ComicPanel,
  LayoutType,
  TextConfig,
  FontFamily,
  BubbleStyle,
  Language
} from './types';
import FileUploader from './components/FileUploader';
import StyleInput from './components/StyleInput';
import ComicViewer from './components/ComicViewer';
import TextCustomizer from './components/TextCustomizer';
import { generateComicScript, generatePanelImage, generatePanelSuggestion, updateVisualPrompt } from './services/gemini';
import { readFileContent } from './utils/fileHelpers';
import { Loader2, Wand2, BookOpen, AlertCircle, ArrowRight, PencilRuler, ArrowLeft, RefreshCcw, Moon, Sun } from 'lucide-react';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [file, setFile] = useState<File | null>(null);
  const [styleDesc, setStyleDesc] = useState<string>("");
  const [themeDesc, setThemeDesc] = useState<string>("");
  const [chapterCount, setChapterCount] = useState<number>(3);
  const [language, setLanguage] = useState<Language>('English');
  const [script, setScript] = useState<ComicScript | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  
  // Apply dark mode class to body
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Update default font when language changes
  useEffect(() => {
    if (language === 'Chinese') {
      setTextConfig(prev => ({ 
        ...prev, 
        fontFamily: 'ZCOOL QingKe HuangYou',
        titleFontFamily: 'ZCOOL QingKe HuangYou'
      }));
    } else {
      setTextConfig(prev => ({ 
        ...prev, 
        fontFamily: 'Comic Neue',
        titleFontFamily: 'Bangers'
      }));
    }
  }, [language]);

  // Customization State
  const [textConfig, setTextConfig] = useState<TextConfig>({
    fontFamily: 'Comic Neue',
    titleFontFamily: 'Bangers',
    fontSize: 1.0,
    color: '#000000',
    bubbleStyle: 'STANDARD'
  });

  // Helper to update a specific panel's status/image/content
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

  const updatePageLayout = useCallback((pageIndex: number, layout: LayoutType) => {
    setScript(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      newPages[pageIndex] = { ...newPages[pageIndex], layout };
      return { ...prev, pages: newPages };
    });
  }, []);

  // --- New Review Mode Handlers ---

  const handleUpdatePanelText = useCallback((pageIndex: number, panelIndex: number, field: 'description' | 'caption', value: string) => {
    updatePanel(pageIndex, panelIndex, { [field]: value });
  }, [updatePanel]);

  const handleCaptionBlur = useCallback(async (pageIndex: number, panelIndex: number, caption: string) => {
    if (!script) return;
    const panel = script.pages[pageIndex].panels[panelIndex];
    
    // Check if caption actually changed. If not, do nothing.
    if (panel.caption === caption) return;

    // Check if we already have a generated image (so we don't hide it)
    const hasImage = panel.status === 'complete' && !!panel.imageUrl;

    // Set status to indicate we are fetching a new prompt
    updatePanel(pageIndex, panelIndex, { status: 'updating_prompt' });
    
    try {
      const newDescription = await updateVisualPrompt(caption, panel.description, styleDesc);
      
      // If we had an image, keep status as complete to keep image visible. Otherwise pending.
      updatePanel(pageIndex, panelIndex, { 
        description: newDescription, 
        status: hasImage ? 'complete' : 'pending' 
      });
    } catch (e) {
      console.error("Failed to update visual prompt", e);
      updatePanel(pageIndex, panelIndex, { status: hasImage ? 'complete' : 'pending' }); // Revert status
    }
  }, [script, styleDesc, updatePanel]);

  const handleAddPanel = useCallback(async (pageIndex: number) => {
    if (!script) return;

    // 1. Create a placeholder panel
    const tempId = `p${script.pages[pageIndex].pageNumber}-${Date.now()}`;
    const newPanel: ComicPanel = {
      id: tempId,
      description: "AI is analyzing story context to generate a scene...",
      caption: "...",
      status: 'pending',
      span: 1 // Default to half width
    };

    // 2. Add placeholder to state immediately
    setScript(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      newPages[pageIndex] = {
        ...newPages[pageIndex],
        panels: [...newPages[pageIndex].panels, newPanel]
      };
      return { ...prev, pages: newPages };
    });

    // 3. Determine Context for AI
    const currentPage = script.pages[pageIndex];
    const currentPagePanels = currentPage.panels;
    const chapterContext = currentPage.chapterTitle || "Untitled Chapter";

    const prevPanel = currentPagePanels.length > 0 ? currentPagePanels[currentPagePanels.length - 1] : undefined;
    
    const nextPage = script.pages[pageIndex + 1];
    const nextPanel = nextPage?.panels.length > 0 ? nextPage.panels[0] : undefined;

    // 4. Generate Suggestion
    try {
      const suggestion = await generatePanelSuggestion(styleDesc, chapterContext, prevPanel, nextPanel);
      
      // 5. Update the placeholder with real content
      setScript(prev => {
        if (!prev) return null;
        const newPages = [...prev.pages];
        const targetPage = newPages[pageIndex];
        const updatedPanels = targetPage.panels.map(p => 
          p.id === tempId ? { ...p, description: suggestion.description, caption: suggestion.caption } : p
        );
        newPages[pageIndex] = { ...targetPage, panels: updatedPanels };
        return { ...prev, pages: newPages };
      });
    } catch (e) {
      console.error("Failed to generate panel suggestion", e);
      // Fallback update if AI fails
      setScript(prev => {
        if (!prev) return null;
        const newPages = [...prev.pages];
        const targetPage = newPages[pageIndex];
        const updatedPanels = targetPage.panels.map(p => 
          p.id === tempId ? { ...p, description: "Describe your new scene here", caption: "Caption" } : p
        );
        newPages[pageIndex] = { ...targetPage, panels: updatedPanels };
        return { ...prev, pages: newPages };
      });
    }

  }, [script, styleDesc]);

  const handleDeletePanel = useCallback((pageIndex: number, panelIndex: number) => {
    setScript(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      const newPanels = newPages[pageIndex].panels.filter((_, idx) => idx !== panelIndex);
      newPages[pageIndex] = { ...newPages[pageIndex], panels: newPanels };
      return { ...prev, pages: newPages };
    });
  }, []);

  const handleMovePanel = useCallback((pageIndex: number, panelIndex: number, direction: 'prev' | 'next') => {
    setScript(prev => {
      if (!prev) return null;
      const newPages = [...prev.pages];
      const panels = [...newPages[pageIndex].panels];
      
      const targetIndex = direction === 'prev' ? panelIndex - 1 : panelIndex + 1;
      
      // Bounds check
      if (targetIndex < 0 || targetIndex >= panels.length) return prev;

      // Swap
      [panels[panelIndex], panels[targetIndex]] = [panels[targetIndex], panels[panelIndex]];
      
      newPages[pageIndex] = { ...newPages[pageIndex], panels };
      return { ...prev, pages: newPages };
    });
  }, []);

  const handleResizePanel = useCallback((pageIndex: number, panelIndex: number, span: 1 | 2) => {
    updatePanel(pageIndex, panelIndex, { span });
  }, [updatePanel]);

  const handleUpdatePanelConfig = useCallback((pageIndex: number, panelIndex: number, config: Partial<TextConfig> | undefined) => {
    updatePanel(pageIndex, panelIndex, { textConfig: config });
  }, [updatePanel]);

  const handleStartOver = () => {
    // We removed the confirm dialog for now to ensure the button action always fires reliably
    // in case the browser blocks repeat confirmations or the UI was unresponsive.
    setStatus(AppStatus.IDLE);
    setScript(null);
    setErrorMsg(null);
    setFile(null);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  // --- End New Review Mode Handlers ---

  const processComicGeneration = async (currentScript: ComicScript, artStyle: string) => {
    setStatus(AppStatus.GENERATING_IMAGES);
    
    for (let i = 0; i < currentScript.pages.length; i++) {
      const page = currentScript.pages[i];
      for (let j = 0; j < page.panels.length; j++) {
        const panel = page.panels[j];
        
        // Skip already generated panels unless they failed or are new
        if (panel.status === 'complete' && panel.imageUrl) continue;

        updatePanel(i, j, { status: 'generating' });
        
        try {
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

  const handleStartScripting = async () => {
    if (!file || !styleDesc) return;
    setErrorMsg(null);

    try {
      setStatus(AppStatus.PARSING);
      const text = await readFileContent(file);
      
      setStatus(AppStatus.SCRIPTING);
      const generatedScript = await generateComicScript(text, themeDesc, chapterCount, language);
      
      // Initialize panels with IDs, status, and default layout
      const initializedPages: ComicPage[] = generatedScript.pages.map(page => ({
        ...page,
        layout: 'DYNAMIC', // Default layout
        panels: page.panels.map((panel, idx) => ({
          ...panel,
          id: `p${page.pageNumber}-${idx}`,
          status: 'pending',
          span: 1
        }))
      }));

      const initializedScript: ComicScript = {
        ...generatedScript,
        theme: themeDesc, // Explicitly save theme to script
        pages: initializedPages
      };

      setScript(initializedScript);
      setStatus(AppStatus.REVIEW); // Pause for layout review
      
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleConfirmLayoutAndGenerate = async () => {
    if (!script) return;
    await processComicGeneration(script, styleDesc);
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
    <div className="min-h-screen transition-colors duration-300">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={handleStartOver}>
            <BookOpen className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl font-comic-title text-slate-900 dark:text-white tracking-wide">
              Banana<span className="text-yellow-500">Comics</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
             {(status === AppStatus.REVIEW || status === AppStatus.COMPLETE) && (
               <button 
                onClick={handleStartOver}
                className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-sm font-semibold transition-colors mr-2 cursor-pointer z-50"
               >
                 <RefreshCcw className="w-4 h-4" /> Start Over
               </button>
             )}

             {status === AppStatus.REVIEW && (
                 <div className="hidden md:flex items-center gap-2 text-yellow-600 dark:text-yellow-500 text-sm font-bold bg-yellow-100 dark:bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-200 dark:border-yellow-500/20">
                   <PencilRuler className="w-4 h-4" />
                   Editor Active
                 </div>
             )}
             
             {/* Dark Mode Toggle */}
             <button
               onClick={() => setDarkMode(!darkMode)}
               className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
               title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
             >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
             </button>

             <div className="text-xs font-mono text-slate-500 hidden sm:block">
               Powered by Gemini
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        {status === AppStatus.IDLE || status === AppStatus.ERROR ? (
          <div className="max-w-2xl mx-auto space-y-10">
            <div className="text-center space-y-4">
              <h2 className="text-4xl md:text-5xl font-comic-title text-slate-900 dark:text-white">
                Turn your words into <span className="text-yellow-500">Art</span>
              </h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Upload a story, script, or document. We'll handle the rest, panel by panel.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-8">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">1</span>
                  Upload Story
                </h3>
                <FileUploader onFileSelect={setFile} selectedFile={file} />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500 text-black text-xs font-bold">2</span>
                  Configuration
                </h3>
                <StyleInput 
                  styleValue={styleDesc} 
                  onStyleChange={setStyleDesc}
                  themeValue={themeDesc}
                  onThemeChange={setThemeDesc}
                  chapterCount={chapterCount}
                  onChapterCountChange={setChapterCount}
                  language={language}
                  onLanguageChange={setLanguage}
                />
              </div>

              {errorMsg && (
                <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-500/50 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-200">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{errorMsg}</p>
                </div>
              )}

              <button
                onClick={handleStartScripting}
                disabled={!file || !styleDesc}
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-bold text-lg rounded-xl transition-all transform hover:scale-[1.01] active:scale-[0.99] shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2"
              >
                <Wand2 className="w-5 h-5" />
                Start Magic
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
             {/* Progress / Status Header */}
             {(status === AppStatus.PARSING || status === AppStatus.SCRIPTING) && (
               <div className="flex flex-col items-center justify-center py-20 space-y-6">
                 <Loader2 className="w-16 h-16 text-yellow-500 animate-spin" />
                 <h2 className="text-2xl font-comic-title animate-pulse text-slate-900 dark:text-white">
                   {status === AppStatus.PARSING ? 'Reading Document...' : 'Writing Script & Layout...'}
                 </h2>
                 <p className="text-slate-500">The AI is breaking down your story into panels.</p>
               </div>
             )}

             {/* Review Mode Control Bar */}
             {status === AppStatus.REVIEW && (
               <div className="sticky top-20 z-40 bg-white/95 dark:bg-slate-950/95 backdrop-blur border border-slate-200 dark:border-slate-800 p-4 rounded-xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4">
                 <div className="w-full flex-1">
                    <TextCustomizer 
                      config={textConfig} 
                      onChange={(newConfig) => setTextConfig(prev => ({ ...prev, ...newConfig }))} 
                      language={language}
                    />
                 </div>
                 <div className="w-full md:w-auto flex gap-2">
                   <button 
                    onClick={handleConfirmLayoutAndGenerate}
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all whitespace-nowrap"
                   >
                     Generate Comic <ArrowRight className="w-4 h-4" />
                   </button>
                 </div>
               </div>
             )}

             {/* Viewer for Review & Complete States */}
             {(status === AppStatus.REVIEW || status === AppStatus.GENERATING_IMAGES || status === AppStatus.COMPLETE) && script && (
               <div className="animate-in fade-in duration-500 slide-in-from-bottom-10 space-y-4">
                 
                 {status === AppStatus.REVIEW && (
                   <p className="text-center text-slate-500 dark:text-slate-400 text-sm">
                     Review mode active. <span className="text-yellow-600 dark:text-yellow-500">Edit text</span>, <span className="text-yellow-600 dark:text-yellow-500">add panels</span>, or customize <span className="text-yellow-600 dark:text-yellow-500">bubbles</span> before generating.
                   </p>
                 )}

                 <ComicViewer 
                  script={script} 
                  status={status}
                  textConfig={textConfig}
                  originalFile={file}
                  artStyle={styleDesc}
                  onRegeneratePanel={handleRegeneratePanel} 
                  onLayoutChange={updatePageLayout}
                  onUpdatePanelText={handleUpdatePanelText}
                  onAddPanel={handleAddPanel}
                  onDeletePanel={handleDeletePanel}
                  onMovePanel={handleMovePanel}
                  onResizePanel={handleResizePanel}
                  onUpdatePanelConfig={handleUpdatePanelConfig}
                  onCaptionBlur={handleCaptionBlur}
                  language={language}
                 />
               </div>
             )}
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
