import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import html2canvas from 'html2canvas';

const TweetGenerator = () => {
  const [profilePicUrl, setProfilePicUrl] = useState('https://placehold.co/500?text=renderdragon');
  const [userName, setUserName] = useState('Renderdragon_');
  const [userHandle, setUserHandle] = useState('Renderdragon_');
  const [tweetText, setTweetText] = useState('just use renderdragon.org');
  const [timestamp, setTimestamp] = useState('2:30 PM · Jun 13, 2025');
  const [viewsCount, setViewsCount] = useState('99.9K Views');
  const [showStats, setShowStats] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const tweetPreviewRef = useRef<HTMLDivElement>(null);

  const exportAsPNG = () => {
    if (tweetPreviewRef.current) {
      html2canvas(tweetPreviewRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: null,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'tweet-preview.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="profilePicUrl">Profile Picture URL</Label>
            <Input
              id="profilePicUrl"
              value={profilePicUrl}
              onChange={(e) => setProfilePicUrl(e.target.value)}
              placeholder="e.g., https://via.placeholder.com/48"
              className=""
            />
          </div>

          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              maxLength={50}
              placeholder="e.g., Elon Musk"
              className=""
            />
          </div>

          <div>
            <Label htmlFor="userHandle">User Handle</Label>
            <Input
              id="userHandle"
              value={userHandle}
              onChange={(e) => setUserHandle(e.target.value)}
              maxLength={15}
              placeholder="e.g., elonmusk"
              className=""
            />
          </div>

          <div>
            <Label htmlFor="tweetText">Tweet Text</Label>
            <Textarea
              id="tweetText"
              value={tweetText}
              onChange={(e) => setTweetText(e.target.value)}
              maxLength={280}
              placeholder="What's happening?"
              className=""
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="timestamp">Timestamp</Label>
            <Input
              id="timestamp"
              value={timestamp}
              onChange={(e) => setTimestamp(e.target.value)}
              placeholder="e.g., 3m ago"
              className=""
            />
          </div>

          <div>
            <Label htmlFor="viewsCount">Views Count</Label>
            <Input
              id="viewsCount"
              value={viewsCount}
              onChange={(e) => setViewsCount(e.target.value)}
              placeholder="e.g., 1.5M Views"
              className=""
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="toggleStats"
              checked={showStats}
              onCheckedChange={(checked) => setShowStats(checked as boolean)}
            />
            <Label htmlFor="toggleStats">Show Timestamp & Views</Label>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl ">Twitter Preview</h2>
        <div
          ref={tweetPreviewRef}
          className="w-full max-w-xl"
          style={{ 
            background: isDarkMode ? '#000' : '#fff', 
            borderRadius: 16, 
            border: isDarkMode ? '1px solid #2f3336' : '1px solid #e1e8ed', 
            padding: 20, 
            boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.04)' 
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <img
              src={profilePicUrl}
              alt="Profile Picture"
              style={{ width: 48, height: 48, borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 16, color: isDarkMode ? '#fff' : '#0f1419' }}>{userName}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  style={{ width: 18, height: 18 }}
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M21.007 8.27C22.194 9.125 23 10.45 23 12c0 1.55-.806 2.876-1.993 3.73.24 1.442-.134 2.958-1.227 4.05-1.095 1.095-2.61 1.459-4.046 1.225C14.883 22.196 13.546 23 12 23c-1.55 0-2.878-.807-3.731-1.996-1.438.235-2.954-.128-4.05-1.224-1.095-1.095-1.459-2.611-1.217-4.05C1.816 14.877 1 13.551 1 12s.816-2.878 2.002-3.73c-.242-1.439.122-2.955 1.218-4.05 1.093-1.094 2.61-1.467 4.057-1.227C9.125 1.804 10.453 1 12 1c1.545 0 2.88.803 3.732 1.993 1.442-.24 2.956.135 4.048 1.227 1.093 1.092 1.468 2.608 1.227 4.05Zm-4.426-.084a1 1 0 0 1 .233 1.395l-5 7a1 1 0 0 1-1.521.126l-3-3a1 1 0 0 1 1.414-1.414l2.165 2.165 4.314-6.04a1 1 0 0 1 1.395-.232Z"
                    fill="#1da1f2"
                  />
                </svg>
                <span style={{ color: isDarkMode ? '#71767b' : '#536471', fontSize: 15 }}>@{userHandle}</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 16, color: isDarkMode ? '#e7e9ea' : '#0f1419', whiteSpace: 'pre-wrap' }}>{tweetText}</div>
              {showStats && (
                <div style={{ marginTop: 12, color: isDarkMode ? '#71767b' : '#536471', fontSize: 15 }}>
                  <span>{timestamp}</span>
                  <span style={{ margin: '0 6px' }}>·</span>
                  <span>{viewsCount}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-1 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Toggle Theme
          </Button>
          <Button onClick={exportAsPNG} className="flex-1 inline-flex items-center justify-center rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Export as PNG
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TweetGenerator; 