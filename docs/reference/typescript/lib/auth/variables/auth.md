[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/auth](../README.md) / auth

# Variable: auth

> `const` **auth**: `Auth`\<\{ `database`: (`options`) => `Adapter`; `emailAndPassword`: \{ `enabled`: `true`; `password`: \{ `hash`: (`password`) => `Promise`\<`string`\>; `verify`: (`__namedParameters`) => `Promise`\<`boolean`\>; \}; `requireEmailVerification`: `false`; `sendResetPassword`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `emailVerification`: \{ `autoSignInAfterVerification`: `true`; `sendOnSignUp`: `true`; `sendVerificationEmail`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `plugins`: \[\{ \}\]; `session`: \{ `expiresIn`: `number`; `updateAge`: `number`; \}; `socialProviders`: \{ `microsoft`: \{ `authority`: `string`; `clientId`: `string`; `clientSecret`: `string`; `prompt`: `"select_account"`; `tenantId`: `string`; \}; \} \| \{ `microsoft?`: `undefined`; \}; `trustedOrigins`: `string`[]; \}\>

Defined in: [lib/auth.ts:8](https://github.com/JoeInnsp23/practice-hub/blob/ab454c4914c3e8f2a637d145d17a135b79d2779e/lib/auth.ts#L8)
