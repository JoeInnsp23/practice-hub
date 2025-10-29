[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/trpc/types](../README.md) / RouterOutputs

# Type Alias: RouterOutputs

> **RouterOutputs** = `inferRouterOutputs`\<`AppRouter`\>

Defined in: [lib/trpc/types.ts:25](https://github.com/JoeInnsp23/practice-hub/blob/a34b88d59620751d062dae9e1d1dc2d46ddb2496/lib/trpc/types.ts#L25)

Base type for all router outputs
Usage: RouterOutputs['routerName']['procedureName']

## Example

```ts
type MyData = RouterOutputs["clients"]["list"];
type SingleClient = RouterOutputs["clients"]["getById"];
```
