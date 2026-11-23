# Gully-cricket-umpire

AI-assisted live cricket umpire and scorer for gully cricket.

## Layout
- `packages/core`   scoring and rules engine (pure TypeScript)
- `packages/vision` calibration, ball tracking, LBW (Phase 5)
- `apps/web`        React PWA (Phase 2+)
- `apps/server`     WebRTC signaling (Phase 3+)
- `docs`            rules and roadmap

## Start
```bash
npm install
npm test
npm run dev --workspace @gully/web
```