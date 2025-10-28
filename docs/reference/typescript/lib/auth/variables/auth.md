[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/auth](../README.md) / auth

# Variable: auth

> `const` **auth**: `Auth`\<\{ `database`: (`options`) => `Adapter`; `emailAndPassword`: \{ `enabled`: `true`; `password`: \{ `hash`: (`password`) => `Promise`\<`string`\>; `verify`: (`__namedParameters`) => `Promise`\<`boolean`\>; \}; `requireEmailVerification`: `false`; `sendResetPassword`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `emailVerification`: \{ `autoSignInAfterVerification`: `true`; `sendOnSignUp`: `true`; `sendVerificationEmail`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `plugins`: \[\{ \}\]; `session`: \{ `expiresIn`: `number`; `updateAge`: `number`; \}; `socialProviders`: \{ `microsoft`: \{ `authority`: `string`; `clientId`: `string`; `clientSecret`: `string`; `prompt`: `"select_account"`; `tenantId`: `string`; \}; \} \| \{ `microsoft?`: `undefined`; \}; `trustedOrigins`: `string`[]; \}\>

Defined in: [lib/auth.ts:8](https://github.com/JoeInnsp23/practice-hub/blob/55bd3b546d1b7512932ac05d86981f2c5cc8e1c7/lib/auth.ts#L8)
