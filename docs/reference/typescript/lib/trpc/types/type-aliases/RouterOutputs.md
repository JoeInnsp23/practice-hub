[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/trpc/types](../README.md) / RouterOutputs

# Type Alias: RouterOutputs

> **RouterOutputs** = `inferRouterOutputs`\<`AppRouter`\>

Defined in: [lib/trpc/types.ts:25](https://github.com/JoeInnsp23/practice-hub/blob/d148037f52e455f83c3f32f11b0d4bdd2976ba75/lib/trpc/types.ts#L25)

Base type for all router outputs
Usage: RouterOutputs['routerName']['procedureName']

## Example

```ts
type MyData = RouterOutputs["clients"]["list"];
type SingleClient = RouterOutputs["clients"]["getById"];
```
