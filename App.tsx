
import React, { useState, useCallback } from 'react';
import { generateStoryboardPanels } from './services/geminiService';

// --- Reusable SVG Icon Components ---

const LoadingSpinner: React.FC = () => (
  <svg
    className="animate-spin h-8 w-8 text-cyan-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const ErrorIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const DownloadIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);


// --- UI Components defined outside App to prevent re-creation on re-renders ---

interface PanelProps {
  imageUrl?: string;
  panelNumber: number;
}

const Panel: React.FC<PanelProps> = ({ imageUrl, panelNumber }) => (
  <div className="relative aspect-video bg-gray-800 border-2 border-gray-700 rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:border-cyan-500 hover:shadow-cyan-500/20">
    <div className="absolute top-2 left-2 bg-black bg-opacity-60 text-white text-xs font-bold px-2 py-1 rounded">
      PANEL {panelNumber}
    </div>
    {imageUrl ? (
      <img src={imageUrl} alt={`Storyboard panel ${panelNumber}`} className="w-full h-full object-cover" />
    ) : (
      <div className="w-full h-full flex items-center justify-center">
        <span className="text-gray-500">Awaiting generation...</span>
      </div>
    )}
  </div>
);


interface StoryboardGridProps {
    panels: string[];
}

const StoryboardGrid: React.FC<StoryboardGridProps> = ({ panels }) => {
    const displayPanels = panels.length > 0 ? panels : Array(4).fill(undefined);

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-8 w-full max-w-6xl mx-auto">
            {displayPanels.map((url, index) => (
                <Panel key={index} imageUrl={url} panelNumber={index + 1} />
            ))}
        </div>
    );
};


// --- Main App Component ---

const App: React.FC = () => {
  const [story, setStory] = useState<string>('');
  const [panels, setPanels] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!story || isLoading) return;

    setIsLoading(true);
    setError(null);
    setPanels([]); // Clear previous panels

    try {
      const generatedPanels = await generateStoryboardPanels(story);
      setPanels(generatedPanels);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      console.error("Generation failed:", errorMessage);
      setError(`Generation failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  }, [story, isLoading]);
  
  const handleDownloadAll = useCallback(() => {
    if (panels.length === 0) return;

    panels.forEach((imageUrl, index) => {
        const link = document.createElement('a');
        link.href = imageUrl;
        const mimeType = imageUrl.match(/data:(image\/[^;]+);/)?.[1] || 'image/png';
        const extension = mimeType.split('/')[1] || 'png';
        link.download = `storyboard-panel-${index + 1}.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
  }, [panels]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans p-4 sm:p-6 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
          Story Bot Generator
        </h1>
        <p className="mt-2 text-lg text-gray-400">
          Turn your short stories into a 4-panel cyberpunk storyboard.
        </p>
      </header>

      <main className="w-full max-w-4xl flex-grow flex flex-col items-center">
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <textarea
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="A lone detective, haunted by his past, navigates the rain-slicked, neon-drenched streets of Neo-Kyoto in 2077. He's searching for a datachip that holds the key to a corporate conspiracy..."
            className="w-full h-40 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-colors duration-300 resize-none disabled:opacity-50"
            disabled={isLoading}
            maxLength={1000} // A reasonable limit
          />
          <button
            type="submit"
            disabled={isLoading || !story.trim()}
            className="w-full flex items-center justify-center px-6 py-3 bg-cyan-600 text-white font-bold rounded-lg shadow-lg hover:bg-cyan-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-cyan-500 transform hover:scale-105 disabled:scale-100"
          >
            {isLoading ? (
              <>
                <LoadingSpinner />
                <span className="ml-3">Generating Your Vision...</span>
              </>
            ) : (
              'Generate Storyboard'
            )}
          </button>
        </form>
        
        {error && (
            <div className="mt-6 p-4 w-full max-w-4xl bg-red-900/50 border border-red-700 text-red-300 rounded-lg flex items-center">
                <ErrorIcon />
                <span>{error}</span>
            </div>
        )}

        {(isLoading || panels.length > 0) && <StoryboardGrid panels={panels} />}

        {!isLoading && panels.length > 0 && (
            <div className="mt-6 w-full max-w-6xl mx-auto">
                <button
                    onClick={handleDownloadAll}
                    className="w-full flex items-center justify-center px-6 py-3 bg-purple-600 text-white font-bold rounded-lg shadow-lg hover:bg-purple-700 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500 transform hover:scale-105"
                >
                    <DownloadIcon />
                    Download All 4 Panels
                </button>
            </div>
        )}
      </main>

      <footer className="w-full max-w-4xl text-center mt-auto pt-8">
        <p className="text-sm text-gray-600">
          Powered by Google Gemini. Images are AI-generated and may be imperfect.
        </p>
      </footer>
    </div>
  );
};

export default App;
