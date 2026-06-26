import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import html2canvas from 'html2canvas';

const YouTubeCommentGenerator = () => {
  const [avatarUrl, setAvatarUrl] = useState('https://preview.redd.it/guys-gimme-a-good-femboy-pfp-the-most-up-voted-wins-image-v0-82657ojk9krd1.jpeg?width=640&crop=smart&auto=webp&s=08de7a1c960292cd603849514cbb0ca8f3c940cf');
  const [userName, setUserName] = useState('Yamura');
  const [commentText, setCommentText] = useState('Sigma first!! 0:32 was the best part.');
  const [timeStamp, setTimeStamp] = useState('2 hours ago');
  const [isVerified, setIsVerified] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const commentCardRef = useRef<HTMLDivElement>(null);

  const escapeHtml = (text: string) =>
    text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const styleTimestamps = (text: string) => {
    const escaped = escapeHtml(text);
    return escaped.replace(/\b(\d{1,2}:)?\d{1,2}:\d{2}\b/g, match => `<span class="text-blue-500 font-bold cursor-pointer">${match}</span>`);
  };

  const exportAsPNG = () => {
    if (commentCardRef.current) {
      html2canvas(commentCardRef.current, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: null,
      }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = imgData;
        link.download = 'youtube-comment.png';
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
            <Label htmlFor="avatarUrl">Avatar URL</Label>
            <Input
              id="avatarUrl"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="Enter avatar URL"
              className="pixel-corners"
            />
          </div>

          <div>
            <Label htmlFor="userName">User Name</Label>
            <Input
              id="userName"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter user name"
              className="pixel-corners"
            />
          </div>

          <div>
            <Label htmlFor="commentText">Comment</Label>
            <Input
              id="commentText"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Enter comment"
              className="pixel-corners"
            />
          </div>

          <div>
            <Label htmlFor="timeStamp">Time</Label>
            <Input
              id="timeStamp"
              value={timeStamp}
              onChange={(e) => setTimeStamp(e.target.value)}
              placeholder="e.g., 2 hours ago"
              className="pixel-corners"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="verifiedToggle"
              checked={isVerified}
              onCheckedChange={(checked) => setIsVerified(checked as boolean)}
            />
            <Label htmlFor="verifiedToggle">Verified checkmark</Label>
          </div>

          <div className="flex gap-4">
            <Button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-1 pixel-btn-primary">
              Toggle Theme
            </Button>
            <Button onClick={exportAsPNG} className="flex-1 pixel-btn-primary">
              Export as PNG
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-vt323">YouTube Comment Preview</h2>
        <div
          ref={commentCardRef}
          className="w-full max-w-xl"
          style={{ background: isDarkMode ? '#181818' : '#fff', borderRadius: 12, padding: 16, border: isDarkMode ? '1px solid #222' : '1px solid #ddd', boxShadow: isDarkMode ? 'none' : '0 1px 2px rgba(0,0,0,0.04)' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <img
              src={avatarUrl}
              alt="Avatar"
              style={{ width: 40, height: 40, borderRadius: '50%' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontWeight: 500, fontSize: 15, color: isDarkMode ? '#fff' : '#0f0f0f' }}>{userName}</span>
                {isVerified && (
                  <img
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/YT_Official_Verified_Checkmark_Circle.svg/120px-YT_Official_Verified_Checkmark_Circle.svg.png?20241125171005"
                    alt="Verified"
                    style={{ 
                      width: 16, 
                      height: 16, 
                      marginLeft: 2, 
                      opacity: isDarkMode ? 0.9 : 0.8,
                      filter: isDarkMode ? 'invert(1)' : 'none'
                    }}
                  />
                )}
                <span style={{ color: isDarkMode ? '#aaa' : '#606060', fontSize: 13, marginLeft: 6 }}>{timeStamp}</span>
              </div>
              <div
                style={{ marginTop: 2, fontSize: 15, color: isDarkMode ? '#fff' : '#0f0f0f', wordBreak: 'break-word' }}
                dangerouslySetInnerHTML={{ __html: styleTimestamps(commentText) }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 8, color: isDarkMode ? '#aaa' : '#606060', fontSize: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {/* Like SVG */}
                  <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 2 }}>
                    <svg viewBox="0 -0.5 21 21" width="20" height="20" fill="currentColor">
                      <path d="M203,620 L207.2,620 L207.2,608 L203,608 L203,620 Z M223.92,611.355 L222.1,617.89 C221.8,619.131 220.64,620 219.3,620 L209.3,620 L209.3,608.021 L211.1,601.825 C211.27,600.775 212.22,600 213.34,600 C214.59,600 215.6,600.964 215.6,602.153 L215.6,608 L221.13,608 C222.97,608 224.34,609.641 223.92,611.355 Z" transform="translate(-203 -600)"/>
                    </svg>
                  </span>
                  {/* Dislike SVG */}
                  <span style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 2 }}>
                    <svg width="20" height="20" viewBox="0 -0.5 21 21" fill="currentColor">
                      <path d="M139.800374,612 L144.00037,612 L144.00037,600 L139.800374,600 L139.800374,612 Z M127.698085,600 L137.700376,600 L137.700376,611.979 L135.894378,618.174 C135.725328,619.224 134.776129,620 133.66103,620 C132.412581,620 131.400381,619.036 131.400381,617.847 L131.400381,612 L125.873186,612 C124.026238,612 122.659139,610.358 123.074939,608.644 L124.899837,602.109 C125.200137,600.868 126.360386,600 127.698085,600 Z" transform="translate(-123 -600)" />
                    </svg>
                  </span>
                </div>
                <span style={{ cursor: 'pointer' }}>Reply</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-4">
          <Button onClick={() => setIsDarkMode(!isDarkMode)} className="flex-1 pixel-btn-primary">
            Toggle Theme
          </Button>
          <Button onClick={exportAsPNG} className="flex-1 pixel-btn-primary">
            Export as PNG
          </Button>
        </div>
      </div>
    </div>
  );
};

export default YouTubeCommentGenerator; 