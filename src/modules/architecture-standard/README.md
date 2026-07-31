# Architecture standard

This module analyzes Mandem repositories against the versioned architecture contract. Its issue
graph domain code parses native metadata, validates plan cross-references, and produces stable
provider operations. Application use cases keep offline checking, native metadata updates,
read-only provider comparison, and approved provider reconciliation separate.

Infrastructure adapters read raw `refs/issues/*` Git commits and call `gh api` with argument
arrays. The API composition layer exposes these capabilities to thin scripts. Native issue refs
own graph and provider-policy data; GitHub state is a one-way projection.
