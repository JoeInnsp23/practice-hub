[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/realtime/event-emitter](../README.md) / ServerEventEmitter

# Class: ServerEventEmitter

Defined in: [lib/realtime/event-emitter.ts:35](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L35)

Server-side event emitter for real-time updates

## Constructors

### Constructor

> **new ServerEventEmitter**(): `ServerEventEmitter`

#### Returns

`ServerEventEmitter`

## Methods

### clearAll()

> **clearAll**(): `void`

Defined in: [lib/realtime/event-emitter.ts:143](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L143)

Clear all subscribers

#### Returns

`void`

***

### clearTenant()

> **clearTenant**(`tenantId`): `void`

Defined in: [lib/realtime/event-emitter.ts:136](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L136)

Clear all subscribers for a tenant

#### Parameters

##### tenantId

`string`

Tenant ID to clear

#### Returns

`void`

***

### emit()

> **emit**(`tenantId`, `event`): `void`

Defined in: [lib/realtime/event-emitter.ts:74](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L74)

Emit event to all subscribers of a tenant

#### Parameters

##### tenantId

`string`

Tenant ID to emit to

##### event

[`RealtimeEvent`](../../client/interfaces/RealtimeEvent.md)

Event to emit

#### Returns

`void`

***

### getActiveTenants()

> **getActiveTenants**(): `string`[]

Defined in: [lib/realtime/event-emitter.ts:127](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L127)

Get all active tenant IDs

#### Returns

`string`[]

Array of tenant IDs with active subscribers

***

### getSubscriberCount()

> **getSubscriberCount**(`tenantId`): `number`

Defined in: [lib/realtime/event-emitter.ts:105](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L105)

Get active subscriber count for a tenant

#### Parameters

##### tenantId

`string`

Tenant ID

#### Returns

`number`

Number of active subscribers

***

### getTotalSubscriberCount()

> **getTotalSubscriberCount**(): `number`

Defined in: [lib/realtime/event-emitter.ts:114](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L114)

Get total active subscriber count across all tenants

#### Returns

`number`

Total number of active subscribers

***

### subscribe()

> **subscribe**(`tenantId`, `callback`): () => `void`

Defined in: [lib/realtime/event-emitter.ts:49](https://github.com/JoeInnsp23/practice-hub/blob/0684bb05103cc29834824a6eb8b19671ef751322/lib/realtime/event-emitter.ts#L49)

Subscribe to events for a specific tenant

#### Parameters

##### tenantId

`string`

Tenant ID to subscribe to

##### callback

`EventCallback`

Callback function to handle events

#### Returns

Cleanup function to unsubscribe

> (): `void`

##### Returns

`void`
