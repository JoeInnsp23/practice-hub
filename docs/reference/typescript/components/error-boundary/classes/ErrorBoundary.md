[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [components/error-boundary](../README.md) / ErrorBoundary

# Class: ErrorBoundary

Defined in: [components/error-boundary.tsx:25](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L25)

## Extends

- `Component`\<`ErrorBoundaryProps`, `ErrorBoundaryState`\>

## Constructors

### Constructor

> **new ErrorBoundary**(`props`): `ErrorBoundary`

Defined in: [components/error-boundary.tsx:29](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L29)

#### Parameters

##### props

`ErrorBoundaryProps`

#### Returns

`ErrorBoundary`

#### Overrides

`React.Component< ErrorBoundaryProps, ErrorBoundaryState >.constructor`

## Methods

### componentDidCatch()

> **componentDidCatch**(`error`, `errorInfo`): `void`

Defined in: [components/error-boundary.tsx:42](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L42)

Catches exceptions generated in descendant components. Unhandled exceptions will cause
the entire component tree to unmount.

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

#### Overrides

`React.Component.componentDidCatch`

***

### render()

> **render**(): `string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

Defined in: [components/error-boundary.tsx:87](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L87)

#### Returns

`string` \| `number` \| `bigint` \| `boolean` \| `Iterable`\<`ReactNode`, `any`, `any`\> \| `Promise`\<`AwaitedReactNode`\> \| `Element` \| `null` \| `undefined`

#### Overrides

`React.Component.render`

***

### reportError()

> **reportError**(`error`, `errorInfo`): `void`

Defined in: [components/error-boundary.tsx:61](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L61)

#### Parameters

##### error

`Error`

##### errorInfo

`ErrorInfo`

#### Returns

`void`

***

### reset()

> **reset**(): `void`

Defined in: [components/error-boundary.tsx:79](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L79)

#### Returns

`void`

***

### getDerivedStateFromError()

> `static` **getDerivedStateFromError**(`error`): `Partial`\<`ErrorBoundaryState`\>

Defined in: [components/error-boundary.tsx:38](https://github.com/JoeInnsp23/practice-hub/blob/b9b67ceadd84fbbc83140a301933583ac6086c5c/components/error-boundary.tsx#L38)

#### Parameters

##### error

`Error`

#### Returns

`Partial`\<`ErrorBoundaryState`\>
