# Mandem system boundary

Mandem is one Bun package with two thin presentation roots: `src/cli/main.ts` and `src/server/main.ts`. Business capability modules own domain, application, infrastructure, and composition boundaries. U1 supplies only bounded version/help behavior; U3 owns a running server, Docker, Compose, and health behavior.
