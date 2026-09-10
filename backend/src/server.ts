import { createApp } from './app.js';
import { env } from './config/env.js';
import { prisma } from './lib/prisma.js';
import {
  startJobScheduler,
  stopJobScheduler,
} from './services/job.service.js';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(
    'Physio API listening on :' + env.PORT + ' (' + env.NODE_ENV + ')',
  );

  // Start background job scheduler after the server is listening.
  startJobScheduler();
});

async function shutdown(signal: string) {
  console.log(`\n${signal} received - shutting down...`);

  // Stop background job scheduler before closing the server.
  stopJobScheduler();

  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
}

process.on('SIGINT', () => void shutdown('SIGINT'));

process.on('SIGTERM', () => void shutdown('SIGTERM'));

This keeps the existing server and Prisma shutdown behavior intact while ensuring the job scheduler starts with the API and stops cleanly on `SIGINT`/`SIGTERM`.
