# Consumer integration contract

U8 installs Mandem into a consumer repository without copying consumer source into this repository. The consumer supplies a repository root and invokes `bun run architecture:check -- <root>`. Results are stable rule IDs with paths and concise messages. Consumer-specific adapters are selected in composition roots. Operating-document inputs remain source documents; U5 owns their compiler and runtime prompts.
