import { useEffect, useRef } from 'react';

interface TwitterTimelineProps {
  username: string;
  tweetLimit?: number;
  theme?: 'light' | 'dark';
}

export default function TwitterTimeline({ 
  username, 
  tweetLimit = 5, 
  theme = 'dark' 
}: TwitterTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hasLoaded = useRef(false);

  useEffect(() => {
    // Check if widget script already exists
    const existingScript = document.querySelector('script[src="https://platform.twitter.com/widgets.js"]');
    
    const loadTimeline = () => {
      if (containerRef.current && (window as any).twttr?.widgets) {
        // Clear existing content
        containerRef.current.innerHTML = '';
        
        // Create the timeline
        (window as any).twttr.widgets.createTimeline(
          {
            sourceType: 'profile',
            screenName: username
          },
          containerRef.current,
          {
            height: 600,
            chrome: 'noheader nofooter noborders',
            tweetLimit: tweetLimit,
            theme: theme,
            linkColor: '#1DA1F2',
            borderColor: '#38444d'
          }
        ).catch((error: any) => {
          console.error('Twitter timeline error:', error);
          if (containerRef.current) {
            containerRef.current.innerHTML = `
              <div class="p-8 text-center">
                <p class="text-red-400 mb-4">Failed to load Twitter timeline</p>
                <a href="https://twitter.com/${username}" target="_blank" rel="noopener noreferrer" 
                   class="text-blue-400 hover:underline">
                  View @${username} on Twitter →
                </a>
              </div>
            `;
          }
        });
      }
    };

    if (existingScript) {
      // Script already loaded, just render timeline
      if ((window as any).twttr?.widgets && !hasLoaded.current) {
        hasLoaded.current = true;
        loadTimeline();
      } else {
        // Wait for twttr to be ready
        (window as any).twttr?.ready(() => {
          if (!hasLoaded.current) {
            hasLoaded.current = true;
            loadTimeline();
          }
        });
      }
    } else {
      // Load the script
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      
      script.onload = () => {
        if ((window as any).twttr?.widgets && !hasLoaded.current) {
          hasLoaded.current = true;
          loadTimeline();
        }
      };

      script.onerror = () => {
        console.error('Failed to load Twitter widget script');
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-8 text-center">
              <p class="text-red-400 mb-4">Failed to load Twitter widget</p>
              <a href="https://twitter.com/${username}" target="_blank" rel="noopener noreferrer" 
                 class="text-blue-400 hover:underline">
                View @${username} on Twitter →
              </a>
            </div>
          `;
        }
      };

      document.head.appendChild(script);
    }

    // Cleanup is not needed since we want to keep the script loaded
  }, [username, tweetLimit, theme]);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-auto bg-arc-800"
      style={{ minHeight: '400px' }}
    >
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center text-gray-400">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading tweets from @{username}...</p>
          <p className="text-xs text-gray-500 mt-2">This may take a few seconds</p>
        </div>
      </div>
    </div>
  );
}
