[**practice-hub v0.1.0**](../../../../README.md)

***

[practice-hub](../../../../README.md) / [lib/constants/work-types](../README.md) / WorkType

# ~~Interface: WorkType~~

Defined in: [lib/constants/work-types.ts:19](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L19)

## Deprecated

This file is deprecated as of STORY-4.6: Work Type Migration to Database

Work types are now stored in the database (work_types table) and managed via:
- Admin UI: /admin/settings/work-types
- React Hook: useWorkTypes() from @/lib/hooks/use-work-types
- tRPC Router: workTypesRouter in @/app/server/routers/workTypes

This file is kept for reference only. All new code should use database-backed work types.

Migration guide:
- Replace WORK_TYPES array with useWorkTypes() hook
- Replace getWorkTypeColor() with workType?.colorCode || "#94a3b8"
- Replace getWorkTypeLabel() with workType?.label || "Unknown"

See: docs/stories/epic-4/story-6-work-types-migration.md

## Properties

### ~~billable~~

> **billable**: `boolean`

Defined in: [lib/constants/work-types.ts:24](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L24)

***

### ~~code~~

> **code**: `string`

Defined in: [lib/constants/work-types.ts:20](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L20)

***

### ~~colorCode~~

> **colorCode**: `string`

Defined in: [lib/constants/work-types.ts:22](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L22)

***

### ~~description~~

> **description**: `string`

Defined in: [lib/constants/work-types.ts:23](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L23)

***

### ~~label~~

> **label**: `string`

Defined in: [lib/constants/work-types.ts:21](https://github.com/JoeInnsp23/practice-hub/blob/d9d7460fcb6b561d38b20450aa8adfcdff6d9f93/lib/constants/work-types.ts#L21)
