[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/auth](../README.md) / auth

# Variable: auth

> `const` **auth**: `Auth`\<\{ `database`: (`options`) => `Adapter`; `emailAndPassword`: \{ `enabled`: `true`; `password`: \{ `hash`: (`password`) => `Promise`\<`string`\>; `verify`: (`__namedParameters`) => `Promise`\<`boolean`\>; \}; `requireEmailVerification`: `false`; `sendResetPassword`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `emailVerification`: \{ `autoSignInAfterVerification`: `true`; `sendOnSignUp`: `true`; `sendVerificationEmail`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `plugins`: \[\{ \}\]; `session`: \{ `expiresIn`: `number`; `updateAge`: `number`; \}; `socialProviders`: \{ `microsoft`: \{ `authority`: `string`; `clientId`: `string`; `clientSecret`: `string`; `prompt`: `"select_account"`; `tenantId`: `string`; \}; \} \| \{ `microsoft?`: `undefined`; \}; `trustedOrigins`: `string`[]; \}\>

Defined in: [lib/auth.ts:8](https://github.com/JoeInnsp23/practice-hub/blob/0abc606c646ff806e99f12f8c16d74528f5b19b4/lib/auth.ts#L8)
