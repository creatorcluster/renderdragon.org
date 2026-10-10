import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { Readable } from 'stream';
import infoHandler from './api/info.js';
import downloadHandler from './api/download.js';
import downloadThumbnailHandler from './api/downloadThumbnail.js';
import generateTitlesHandler from './api/generateTitles.js';
import deleteAccountHandler from './api/deleteAccount.js';
import looneyCheckHandler from './api/looney-check.js';
import { handler as musicLinkHandler } from './api/music-link.js';
import { handler as trackHandler } from './api/track.js';
import { handler as statsHandler } from './api/stats.js';
import { isAllowedOrigin } from './api/cors.js';
import { createRouteHandler } from 'uploadthing/express';
import { uploadRouter } from './src/integrations/uploadthing/router.js';

const app = express();
const port = 3000;

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (!isAllowedOrigin(origin)) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Looney-Browser-Id']
}));
app.use(express.json());

const createAdapter = (handler) => (req, res) => {
  const vercelReq = {
    method: req.method,
    headers: {
      ...req.headers,
      'x-vercel-ip': req.ip || req.socket.remoteAddress || '',
    },
    body: req.body,
    url: `http://${req.headers.host}${req.originalUrl}`,
  };

  handler(vercelReq).then(response => {
    if (!response) {
      if (!res.headersSent) {
        res.status(500).send("Handler returned no response.");
      }
      return;
    }

    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    if (response.body) {
      Readable.fromWeb(response.body).pipe(res);
    } else {
      res.end();
    }
  }).catch(error => {
    console.error("Handler error:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Internal Server Error' });
    }
  });
};

app.all('/api/info', createAdapter(infoHandler));
app.all('/api/download', createAdapter(downloadHandler));
app.all('/api/downloadThumbnail', createAdapter(downloadThumbnailHandler));
app.all('/api/generateTitles', createAdapter(generateTitlesHandler));
app.all('/api/deleteAccount', createAdapter(deleteAccountHandler));
app.all('/api/looney-check', createAdapter(looneyCheckHandler));
app.all('/api/music-link', createAdapter(musicLinkHandler));
app.all('/api/track', createAdapter(trackHandler));
app.all('/api/stats', createAdapter(statsHandler));
// UploadThing route
app.use(
  '/api/uploadthing',
  createRouteHandler({
    router: uploadRouter,
    // Explicitly pass token from env per UploadThing v7 docs
    config: {
      token: process.env.UPLOADTHING_TOKEN,
    },
  })
);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
