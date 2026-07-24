# python3/make/g++ are no longer installed: better-sqlite3 (the only native
# dependency) is gone from the runtime deps. 'pg' is pure JavaScript, so
# --omit=dev needs no build toolchain and the image gets noticeably smaller.
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine
LABEL org.opencontainers.image.source="https://github.com/zer0space-net/zer0space-dashboard" \
      org.opencontainers.image.description="zer0space homelab dashboard"
WORKDIR /app
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node src/ ./src/
# node:20-alpine ships a built-in unprivileged "node" user (uid/gid 1000) — no root
# process in the running container. The /data volume (NFS-mounted background images +
# backup-status JSON) must be writable by uid 1000 on the host/NFS export side.
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/login >/dev/null 2>&1 || exit 1
CMD ["node", "src/server.js"]
