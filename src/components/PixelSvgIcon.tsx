import React from 'react';

interface PixelSvgIconProps {
  name: string;
  className?: string;
  size?: number;
}

const icons: Record<string, JSX.Element> = {
  sun: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"> <path d="M13 0h-2v4h2V0ZM0 11v2h4v-2H0Zm24 0v2h-4v-2h4ZM13 24h-2v-4h2v4ZM8 6h8v2H8V6ZM6 8h2v8H6V8Zm2 10v-2h8v2H8Zm10-2h-2V8h2v8Zm2-14h2v2h-2V2Zm0 2v2h-2V4h2Zm2 18h-2v-2h2v2Zm-2-2h-2v-2h2v2ZM4 2H2v2h2v2h2V4H4V2ZM2 22h2v-2h2v-2H4v2H2v2Z"/></svg>
  ),
  moon: (
    <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24"> <path d="M6 2h8v2h-2v2h-2V4H6V2ZM4 6V4h2v2H4Zm0 10H2V6h2v10Zm2 2H4v-2h2v2Zm2 2H6v-2h2v2Zm10 0v2H8v-2h10Zm2-2v2h-2v-2h2Zm-2-4v-2h2v-2h2v8h-2v-4h-2Zm-6 0h6v2h-6v-2Zm-2-2h2v2h-2v-2Zm0 0V6H8v6h2Zm8-10h2v2h2v2h-2v2h-2V6h-2V4h2V2Z"/></svg>
  ),
  contact: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M22 2H2v14h2V4h16v12h-8v2h-2v2H8v-4H2v2h4v4h4v-2h2v-2h10V2z"/></svg>
  ),
  home: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M14 2h-4v2H8v2H6v2H4v2H2v2h2v10h7v-6h2v6h7V12h2v-2h-2V8h-2V6h-2V4h-2V2zm0 2v2h2v2h2v2h2v2h-2v8h-3v-6H9v6H6v-8H4v-2h2V8h2V6h2V4h4z"/></svg>
  ),
  resources: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21 18H7V2h8v2h2v2h-2v2h2V6h2v2h2v10zM9 4v12h10v-6h-6V4H9zM3 6h2v14h12v2H3V6z"/></svg>
  ),
  'resources-hub': (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 4h8v2h10v14H2V4h2zm16 4H10V6H4v12h16V8z"/></svg>
  ),
  'yt-videos': (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32">
    <path d="M 7 6 L 7 8 L 25 8 L 25 6 L 7 6 z M 25 8 L 25 10 L 27 10 L 27 8 L 25 8 z M 27 10 L 27 22 L 29 22 L 29 10 L 27 10 z M 27 22 L 25 22 L 25 24 L 27 24 L 27 22 z M 25 24 L 7 24 L 7 26 L 25 26 L 25 24 z M 7 24 L 7 22 L 5 22 L 5 24 L 7 24 z M 5 22 L 5 10 L 3 10 L 3 22 L 5 22 z M 5 10 L 7 10 L 7 8 L 5 8 L 5 10 z M 13 12 L 13 20 L 15 20 L 15 19 L 17 19 L 17 18 L 19 18 L 19 17 L 21 17 L 21 15 L 19 15 L 19 14 L 17 14 L 17 13 L 15 13 L 15 12 L 13 12 z"></path>
    </svg>
  ),
  guides: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M8 2h12v20H4V2h4zm4 8h-2v2H8V4H6v16h12V4h-4v8h-2v-2z"/></svg>
  ),
  discord: (
<svg version="1.0" xmlns="http://www.w3.org/2000/svg"
 width="26" height="26" viewBox="0 0 1509.000000 1602.000000"
 preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,1602.000000) scale(0.100000,-0.100000)"
fill="currentColor" stroke="none">
<path d="M3798 12413 l-3 -208 -195 -5 -195 -5 -3 -190 c-1 -112 -7 -194 -13
-200 -6 -6 -94 -12 -212 -15 l-202 -5 -5 -617 c-3 -403 -9 -621 -15 -627 -6
-6 -91 -12 -210 -13 l-200 -3 -5 -625 -5 -625 -186 -3 c-141 -2 -190 -6 -198
-16 -8 -9 -10 -416 -9 -1472 l3 -1459 195 -5 195 -5 3 -205 c1 -112 6 -208 11
-213 5 -5 97 -8 204 -7 149 0 197 -2 204 -12 4 -7 10 -98 13 -203 l5 -190 830
0 830 0 5 200 5 200 205 5 205 5 3 213 2 212 1695 0 1695 0 0 -215 0 -215 205
0 c113 0 206 -1 207 -2 1 -2 4 -93 7 -203 l6 -200 830 0 830 0 3 189 c1 119 7
194 13 203 9 10 55 13 199 13 162 0 189 2 201 17 10 12 15 67 19 212 l5 196
195 5 195 5 3 1459 c1 1056 -1 1463 -9 1472 -8 10 -57 14 -198 16 l-186 3 -5
611 c-4 498 -8 614 -19 627 -12 15 -39 17 -207 17 -107 0 -195 1 -196 3 -2 1
-5 283 -8 627 l-5 625 -210 6 c-115 3 -211 6 -212 7 -2 1 -3 86 -3 190 0 103
-4 193 -8 199 -6 9 -61 13 -197 15 l-190 3 -5 205 -5 205 -845 0 -845 0 -3
-187 c-2 -171 -1 -188 15 -197 11 -5 174 -8 408 -6 383 3 390 3 413 -18 21
-20 22 -26 22 -208 0 -147 3 -189 14 -198 10 -9 123 -11 415 -9 326 2 402 1
406 -10 3 -8 5 -106 5 -218 l0 -204 -627 2 -628 3 -5 196 c-4 145 -9 200 -19
212 -12 16 -143 17 -1676 17 -1533 0 -1664 -1 -1676 -17 -10 -12 -15 -67 -19
-212 l-5 -196 -627 -3 -628 -2 0 209 c0 126 4 212 10 216 5 3 185 6 400 5 257
0 397 3 410 10 19 10 20 22 20 199 0 173 2 189 19 205 18 17 55 18 418 21 219
2 401 3 406 4 4 1 6 88 5 194 l-3 192 -842 3 -843 2 -2 -207z m0 -1260 l-3
-208 -190 -2 c-109 -2 -196 1 -205 7 -12 7 -16 45 -20 200 -3 105 -3 195 -2
200 2 6 85 10 213 10 l209 0 -2 -207z m6330 11 c2 -176 1 -192 -16 -207 -17
-15 -42 -17 -208 -15 l-189 3 -3 208 -2 207 207 -2 208 -3 3 -191z m-4230
-1900 c22 -6 22 -8 22 -193 0 -102 3 -196 6 -208 6 -23 8 -23 200 -23 l194 0
0 -630 0 -630 -197 -2 -198 -3 -3 -200 c-2 -174 -4 -202 -19 -212 -13 -10
-153 -13 -622 -13 -548 0 -606 2 -623 17 -16 14 -18 35 -18 210 0 106 -1 194
-2 195 -2 1 -93 4 -203 7 l-200 6 0 625 0 625 200 5 200 5 5 204 c5 192 6 204
25 212 23 9 1199 12 1233 3z m2961 -7 c7 -9 12 -86 13 -213 l3 -199 200 -5
200 -5 0 -625 0 -625 -200 -5 -200 -5 -3 -199 c-1 -127 -6 -204 -13 -213 -9
-10 -130 -13 -639 -13 -563 0 -628 2 -634 16 -3 9 -6 105 -6 215 l0 199 -195
0 c-123 0 -195 4 -195 10 0 6 0 285 0 620 0 336 0 615 0 620 0 6 72 10 195 10
l195 0 0 203 c0 145 3 206 12 215 18 18 1251 17 1267 -1z m-3801 -2730 l2
-207 -412 2 -413 3 -3 195 c-1 107 0 200 3 207 3 11 86 13 412 11 l408 -3 3
-208z m4207 189 c13 -19 15 -55 13 -207 l-3 -184 -412 -3 -413 -2 0 203 c0
112 3 207 7 210 3 4 183 7 399 7 l394 0 15 -24z"/>
</g>
</svg>
  ),
  tools: (
    <svg fill="currentColor" viewBox="0 0 22 22" xmlns="http://www.w3.org/2000/svg"><path d="M8 2H11V3H13V4H15V5H17V7H18V9H19V11H20V14H18V12H17V11H16V10H14V9H13V8H12V6H11V5H10V4H8M11 9H12V10H13V11H12V12H11V13H10V14H9V15H8V16H7V17H6V18H5V19H4V20H3V21H2V20H1V19H2V18H3V17H4V16H5V15H6V14H7V13H8V12H9V11H10V10H11"/></svg>
  ),
  'yt-downloader': (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M13 17V3h-2v10H9v-2H7v2h2v2h2v2h2zm8 2v-4h-2v4H5v-4H3v6h18v-2zm-8-6v2h2v-2h2v-2h-2v2h-2z"/> </svg>
  ),
  music: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M8 4h12v16h-8v-8h6V8h-8v12H2v-8h6V4zm0 10H4v4h4v-4zm10 0h-4v4h4v-4z"/></svg>
  ),
  background: (
    <svg fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M18 0h2v4h4v2h-2v2h-2v2h-2V6h-4V4h2V2h2V0zM4 3h8v2H4v14h16v-7h2v9H2V3h2zm10 6h-2v2h-2v2H8v2H6v2h2v-2h2v-2h2v-2h2v2h2v2h2v-2h-2v-2h-2V9zM8 7H6v2h2V7z"/></svg>
  ),
  software: (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M13 2v4h5v5h4v2h-4v5h-5v4h-2v-4H6v-5H2v-2h4V6h5V2h2zM8 8v8h8V8H8zm2 2h4v4h-4v-4z" fill="currentColor"/> </svg>
  ),
  bot: (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
      <path d="M4 4h16v2H4V4zm0 2h2v10H4V6zm14 0h2v10h-2V6zM8 8h2v2H8V8zm6 0h2v2h-2V8zM6 18h12v2H6v-2zm8-6h2v2h-2v-2zm-6 0h2v2H8v-2z"/>
    </svg>
  ),
  sound: (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 2H3v20h18V2H4zm15 2v16H5V4h14zm-6 2h-2v2h2V6zm-5 4h8v6h-2v-4h-4v4H8v-6zm8 6H8v2h8v-2z" fill="currentColor"/></svg>
  ),
  icons: (
    <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M4 3H2v18h20V3H4zm16 2v14H4V5h16zm-6 4h-2v2h-2v2H8v2H6v2h2v-2h2v-2h2v-2h2v2h2v2h2v-2h-2v-2h-2V9zM8 7H6v2h2V7z" fill="currentColor"/></svg>
  ),
};

const PixelSvgIcon: React.FC<PixelSvgIconProps> = ({ name, className }) => {
  const icon = icons[name] || null;
  return icon ? (
    <span
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        verticalAlign: 'middle',
        lineHeight: 0,
        ...(name === 'discord' ? { marginTop: '1px' } : {})
      }}
    >
      {icon}
    </span>
  ) : null;
};

export default React.memo(PixelSvgIcon);