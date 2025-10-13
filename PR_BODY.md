## Summary

Integrates Dashboard Upload with tRPC and workers: real upload (base64) -> queue processing, adaptive polling via TanStack Query v5, toasts and cache invalidations. The dashboard lists user videos, shows live progress, and adds a Delete action.

## tRPC Contract (getVideoProcessingStatus)

```ts
input: { videoId: string }
output: {
  status: 'queued'|'processing'|'completed'|'failed';
  progress: number|null;
  error: string|null;
  jobId?: string|null;
  updatedAt?: string;
}
```

Mapping: waiting|delayed|paused|waiting-children → queued; active → processing; completed → completed (progress=100); failed → failed (error=failedReason). Fallback (no job): completed → completed(100); failed → failed; otherwise queued(null).

## What changed

- UploadPage: removes mocks, implements upload -> process -> invalidate getUserVideos -> start polling (dataById), with sonner toasts.
- Dashboard: lists videos, applies adaptive polling to non-finalized items, shows progress/status, and adds Delete with invalidate.
- Hook: `useVideoPolling(videoIds)` returns `{ dataById, isLoading, isError, refetchAll }` with adaptive `refetchInterval`.
- Router: `getVideoProcessingStatus` returns exact output contract and standardized `TRPCError`s.

## Tests (manual)

- [ ] Upload happy path: small .mp4, toasts show, progresses to completed.
- [ ] MIME inválido: .txt → erro no upload (client) e validação no server.
- [ ] Quota excedida: user videosProcessed == limit → processVideo retorna TRPCError FORBIDDEN.
- [ ] Worker reiniciado: enfileirar, parar worker → status fallback queued; religar → processing → completed/failed.
- [ ] Delete: botão deleta vídeo, toasts e invalidation atualizam a lista.

## Notes

- No new dependencies.
- Next steps: multipart upload (route handler) and showing detailed error when `failed`.
