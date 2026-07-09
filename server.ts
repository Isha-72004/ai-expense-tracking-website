/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { apiRouter, errorHandler } from './server/routes';

// Load environment variables in development if dotenv is available
import dotenv from 'dotenv';
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Request body parsing middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Route Registration (Prefixed for API Versioning)
  app.use('/api/v1', apiRouter);

  // Centralized Health Check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
    });
  });

  // Vite Integration for Asset Serving and Single Page Routing
  if (process.env.NODE_ENV !== 'production') {
    console.log('Mounting Vite dev server middleware...');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    console.log('Running in production mode. Serving static build assets...');
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Catch-all route to serve standard index.html for clients
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized Error Handling Middleware (Registered LAST as per Express specifications)
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=======================================================`);
    console.log(`  AI EXPENSE TRACKER SERVER RUNNING AT:`);
    console.log(`  http://0.0.0.0:${PORT} (Access Port 3000)`);
    console.log(`=======================================================`);
  });
}

startServer().catch((err) => {
  console.error('Fatal: Failed to start full-stack server:', err);
  process.exit(1);
});
