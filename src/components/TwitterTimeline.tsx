import { useEffect } from 'react';

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
  useEffect(() => {
    // Load Twitter widget script if not already loaded
    if (!document.querySelector('script[src="https://platform.twitter.com/widgets.js"]')) {
      const script = document.createElement('script');
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      document.body.appendChild(script);
    } else if ((window as any).twttr?.widgets) {
      // If script already loaded, reload widgets
      (window as any).twttr.widgets.load();
    }
  }, []);

  return (
    <div className="w-full h-full overflow-auto bg-arc-800" style={{ minHeight: '400px' }}>
      <a 
        className="twitter-timeline" 
        data-height="600"
        data-theme={theme}
        data-chrome="noheader nofooter noborders"
        data-tweet-limit={tweetLimit}
        href={`https://twitter.com/${username}?ref_src=twsrc%5Etfw`}
      >
        Tweets by {username}
      </a>
    </div>
  );
}
