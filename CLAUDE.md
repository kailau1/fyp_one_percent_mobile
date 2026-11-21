# CLAUDE.md

One Percent mobile app: React Native / Expo (SDK 58, Expo Router, TypeScript strict). It is being rebuilt
to match the web app (`~/projects/one_percent_web`) screen by screen; the plan is the top section of
`~/.claude/plans/pasted-content-id-8bd5-i-d-like-iterative-matsumoto.md`.
The backend is a separate repo at `~/projects/one_percent_spring` (remote `fyp_one_percent_spring`).
Work in this copy (`~/projects/one_percent_mobile`, Linux filesystem); the old copy on `/mnt/c` is only a backup.

## Git workflow (always follow)

- **Never work directly on `main`.** Before making any change, create a feature branch from an up-to-date `main`:
  `git checkout main && git pull && git checkout -b feature/<short-kebab-description>`
  (use `fix/<...>` for bug fixes, `test/<...>` for test-only work).
- **One commit per feature.** As soon as each individual feature or fix is finished, and its tests pass, commit it on its own
  with a clear message describing what changed and why. Don't bundle unrelated changes into one commit.
- **Push after every commit:** `git push -u origin <branch>` (first push) / `git push` afterwards.
- Run the tests before each commit (see below). Don't commit with failing tests.

## Commands

- `npm run check`: lint + typecheck + tests. The gate before every commit.
- Tests only: `npm run test:ci` (watch: `npm test`); one file: `npx jest path/to/file`; by name: `npx jest -t "streak"`.
- Start the app: `npm start`, then scan the QR code with Expo Go (SDK 58). The API address is `extra.BASE_URL`
  in `app.json` (the PC's LAN address when testing on a phone).
- Web preview for quick checks: `npx expo start --web --port 8085` (port 8081 is taken on this PC). With
  `CI=1` (non-interactive) Metro doesn't watch files: restart it after edits.
- Add libraries with `npx expo install <pkg>` (SDK-compatible versions). Only modules bundled in Expo Go can be
  used (e.g. not expo-haptics); check the SDK 58 docs before using any Expo API.

## Layout and conventions (mirrors the web app; see its `web-feature` and `ui-polish` skills)

- `src/app/`: Expo Router routes only (every file is a screen); they import screens from `src/features/<feature>/`.
- `src/features/<feature>/`: `api.ts` (plain calls) → `hooks.ts` (TanStack Query) → screens/components.
  Pure modules (types, streaks, dates, trends, drafts, markdown) are copied from the web app unchanged.
- All API calls go through `src/api/client.ts` (`apiRequest`), which throws `ApiError`. Show failures with
  `ErrorState` (or `toast.error(getErrorMessage(error))`), never silently.
- Colours, fonts, radii and spacing come from `src/theme/tokens.ts` (the web's exact values) via `useTheme()`;
  text goes through `components/ui/Text`. Never hard-code a colour in a component.
- Every data view handles loading (Skeleton), empty (EmptyState) and error (ErrorState with retry).
- Storage: `lib/storage.ts` (synchronous, hydrated at launch, like the web's) and `api/session.ts` (token in
  SecureStore).
- Tests sit next to the code (`*.test.tsx`), use `renderWithProviders` from `src/test/render.tsx`, and fake
  the API with the web app's MSW handlers (`src/test/msw/`, keep in step with the web copies). Testing
  Library 14 is async: `await render(...)`, `await fireEvent.press(...)`. Tests run in Europe/London time.
