// backend/src/lib/notification-emitter.ts
import { EventEmitter } from 'events';

export const notificationEmitter = new EventEmitter();
notificationEmitter.setMaxListeners(100); // Support many concurrent SSE connections