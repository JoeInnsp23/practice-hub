[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/services/mention-parser](../README.md) / highlightMentions

# Function: highlightMentions()

> **highlightMentions**(`text`): `string`

Defined in: [lib/services/mention-parser.ts:76](https://github.com/JoeInnsp23/practice-hub/blob/e67f2d7c2aef25e0a7c52e201483873b6d5f88c3/lib/services/mention-parser.ts#L76)

Highlight

## Parameters

### text

`string`

The text containing

## Returns

`string`

HTML string with highlighted mentions (sanitized against XSS)

## Mentions

in text with styled spans for display

Replaces @[User Name] with styled HTML spans containing the text-primary class.
SECURITY: Sanitizes user input by HTML-escaping mention content before injection.

## Mentions

to highlight

## Examples

```ts
highlightMentions("Hey @[John Doe], can you review?")
// Returns: 'Hey <span class="mention">@John Doe</span>, can you review?'
```

```ts
XSS Protection
highlightMentions("@[<script>alert('XSS')</script>]")
// Returns: '<span class="mention">@&lt;script&gt;alert(&#039;XSS&#039;)&lt;/script&gt;</span>'
```
