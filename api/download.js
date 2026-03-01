import ytdl from '@distube/ytdl-core';
import { Writable } from 'stream';
import ffmpeg from 'fluent-ffmpeg';

// On Vercel serverless, ffmpeg-static postinstall scripts don't run,
// so we always use the system ffmpeg binary.
ffmpeg.setFfmpegPath('ffmpeg');

// Enhanced browser headers (same as info.js)
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
];

function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getBrowserHeaders() {
  return {
    'User-Agent': getRandomUserAgent(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
    'DNT': '1',
    'Sec-GPC': '1',
    ...(process.env.YT_COOKIE ? { 'Cookie': process.env.YT_COOKIE } : {}),
  };
}

// Random delay function
function randomDelay(min = 1000, max = 3000) {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// Enhanced getInfo with retry logic
async function getInfoWithRetry(url, tries = 3, delayMs = 2000) {
  await randomDelay(500, 1500);

  try {
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: getBrowserHeaders(),
        timeout: 30000,
      },
      agent: undefined,
      quality: 'highestvideo',
      filter: 'audioandvideo',
    });

    return info;
  } catch (err) {
    console.log(`[ytdl-download] Attempt ${4 - tries} failed:`, err.message);

    const status = typeof err === 'object' && err && ('statusCode' in err ? err.statusCode : err.status);
    const isRetryable =
      status === 429 ||
      status === 403 ||
      status === 502 ||
      status === 503 ||
      status === 504 ||
      err.message?.includes('Sign in to confirm') ||
      err.message?.includes('bot') ||
      err.message?.includes('captcha') ||
      err.message?.includes('rate limit') ||
      err.message?.includes('timeout');

    if (isRetryable && tries > 1) {
      console.log(`[ytdl-download] Retrying in ${delayMs}ms... (${tries - 1} attempts left)`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      return getInfoWithRetry(url, tries - 1, delayMs * 1.5);
    }

    throw err;
  }
}

export const config = {
  runtime: 'nodejs',
  maxDuration: 60,
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'GET') {
    return new Response(JSON.stringify({ message: 'Method Not Allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const params = new URL(req.url, `http://${req.headers.host}`).searchParams;
    const url = params.get('url');
    const videoItag = params.get('itag');
    const audioItag = params.get('audioItag');

    if (!url) {
      return new Response(JSON.stringify({ error: 'Missing URL parameter' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('[ytdl-download] Processing download request for:', url);

    // Add delay before processing
    await randomDelay(500, 1000);

    const info = await getInfoWithRetry(url, 4, 2000);

    if (!info || !info.videoDetails) {
      throw new Error('Failed to fetch video information');
    }

    const { videoDetails } = info;
    const title = videoDetails.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');

    let videoFormat = null;
    let audioFormat = null;

    if (videoItag) {
      videoFormat = ytdl.chooseFormat(info.formats, { quality: videoItag });
    }

    if (audioItag) {
      audioFormat = ytdl.chooseFormat(info.formats, { quality: audioItag });
    }

    const response = new Response(
      new ReadableStream({
        start(controller) {
          if (videoFormat && audioFormat) {
            // Download and merge video + audio
            const videoStream = ytdl.downloadFromInfo(info, { format: videoFormat });
            const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });

            const ffmpegCommand = ffmpeg()
              .input(videoStream)
              .input(audioStream)
              .outputOptions([
                '-c:v copy',
                '-c:a aac',
                '-f mp4',
                '-movflags frag_keyframe+empty_moov',
              ])
              .on('error', (err) => {
                console.error('[ffmpeg] Error:', err);
                controller.error(err);
              })
              .on('end', () => {
                console.log('[ffmpeg] Processing finished');
                controller.close();
              });

            const ffmpegStream = ffmpegCommand.pipe();
            ffmpegStream.on('data', (chunk) => controller.enqueue(chunk));
            ffmpegStream.on('end', () => controller.close());
            ffmpegStream.on('error', (err) => controller.error(err));

          } else if (videoFormat) {
            // Download video only
            const videoStream = ytdl.downloadFromInfo(info, { format: videoFormat });
            videoStream.on('data', (chunk) => controller.enqueue(chunk));
            videoStream.on('end', () => controller.close());
            videoStream.on('error', (err) => controller.error(err));

          } else if (audioFormat) {
            // Download audio only
            const audioStream = ytdl.downloadFromInfo(info, { format: audioFormat });
            audioStream.on('data', (chunk) => controller.enqueue(chunk));
            audioStream.on('end', () => controller.close());
            audioStream.on('error', (err) => controller.error(err));

          } else {
            // Default download
            const stream = ytdl.downloadFromInfo(info, { quality: 'highestvideo' });
            stream.on('data', (chunk) => controller.enqueue(chunk));
            stream.on('end', () => controller.close());
            stream.on('error', (err) => controller.error(err));
          }
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${title}.mp4"`,
        },
      }
    );

    return response;

  } catch (err) {
    console.error('[ytdl-download] Error:', err.message);

    // Return more user-friendly error messages
    let errorMessage = 'Failed to download video';
    if (err.message?.includes('Video unavailable')) {
      errorMessage = 'Video is unavailable or private';
    } else if (err.message?.includes('Sign in to confirm') || err.message?.includes('bot')) {
      errorMessage = 'Unable to download video due to YouTube restrictions. Please try again later.';
    } else if (err.message?.includes('rate limit')) {
      errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
    } else if (err.message?.includes('timeout')) {
      errorMessage = 'Request timed out. Please try again.';
    }

    return new Response(JSON.stringify({
      error: errorMessage,
      message: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}
