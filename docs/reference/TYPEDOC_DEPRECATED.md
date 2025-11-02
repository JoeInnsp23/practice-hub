# TypeDoc Deprecated

**Date**: 2025-11-02

The TypeDoc-generated TypeScript API documentation has been **deprecated** and archived.

## Why?

TypeDoc generated **1,399 files (9.8MB)** of documentation that:
- Was never used or referenced
- Consumed significant storage and indexing resources
- Created noise in documentation searches
- Duplicated information available in the codebase

## Migration

The project has transitioned to a **code-extract documentation system**:
- Documentation is embedded in code using `@doc:path#section` tags
- Extraction pipeline generates unified docs from tagged code
- Documentation stays in sync with code automatically

## Archive Location

The archived TypeDoc documentation is available at:
```
docs/.archive/typedoc-20251102/
```

## References

- **DOC_TAGGING_SPEC.md**: Documentation tagging specification
- **books.yaml**: Target mapping configuration
- **repo-facts.json**: Current codebase statistics

---

*This deprecation was performed by `scripts/deprecate_typedoc.sh`*
