[**practice-hub v0.1.0**](../../../README.md)

***

[practice-hub](../../../README.md) / [lib/client-portal-auth](../README.md) / clientPortalAuth

# Variable: clientPortalAuth

> `const` **clientPortalAuth**: `Auth`\<\{ `basePath`: `string`; `database`: (`options`) => `Adapter`; `emailAndPassword`: \{ `enabled`: `true`; `password`: \{ `hash`: (`password`) => `Promise`\<`string`\>; `verify`: (`__namedParameters`) => `Promise`\<`boolean`\>; \}; `requireEmailVerification`: `false`; `sendResetPassword`: (`__namedParameters`) => `Promise`\<`void`\>; \}; `session`: \{ `expiresIn`: `number`; `updateAge`: `number`; \}; `trustedOrigins`: `string`[]; \}\>

Defined in: [lib/client-portal-auth.ts:9](https://github.com/JoeInnsp23/practice-hub/blob/c7331d8617255f822b036bbd622602d5253a5e80/lib/client-portal-auth.ts#L9)
