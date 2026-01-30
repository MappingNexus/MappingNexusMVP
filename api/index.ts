/**
 * Vercel Serverless Function Entry Point
 * This file wraps the Express app for Vercel's serverless environment
 */

import app from '../backend/server.js';

// Export the Express app as the default handler
export default app;
