[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/event-emitter](../README.md) / serverEventEmitter

# Variable: serverEventEmitter

> `const` **serverEventEmitter**: [`ServerEventEmitter`](../classes/ServerEventEmitter.md)

Defined in: [lib/realtime/event-emitter.ts:171](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/realtime/event-emitter.ts#L171)

Singleton server event emitter instance

PRODUCTION NOTE: For multi-server deployments, replace this with Redis Pub/Sub:

```typescript
// lib/realtime/redis-event-emitter.ts
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const serverEventEmitter = {
  subscribe: (tenantId: string, callback: EventCallback) => {
    redis.subscribe(`tenant:${tenantId}`, (message) => {
      callback(JSON.parse(message));
    });
  },
  emit: (tenantId: string, event: RealtimeEvent) => {
    redis.publish(`tenant:${tenantId}`, JSON.stringify(event));
  },
};
```
