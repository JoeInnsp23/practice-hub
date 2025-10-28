[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/trpc/types](../README.md) / RouterOutputs

# Type Alias: RouterOutputs

> **RouterOutputs** = `inferRouterOutputs`\<`AppRouter`\>

Defined in: [lib/trpc/types.ts:25](https://github.com/JoeInnsp23/practice-hub/blob/acab0e17ea4a394fff6649c0803f80d93f290c0b/lib/trpc/types.ts#L25)

Base type for all router outputs
Usage: RouterOutputs['routerName']['procedureName']

## Example

```ts
type MyData = RouterOutputs["clients"]["list"];
type SingleClient = RouterOutputs["clients"]["getById"];
```
