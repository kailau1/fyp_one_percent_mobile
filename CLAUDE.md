# CLAUDE.md

One Percent mobile app: React Native / Expo (SDK 52, expo-router, TypeScript).
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

- Tests (single run): `npm run test:ci`. Watch mode for development: `npm test`.
- Run one file: `npx jest path/to/file`; filter by name: `npx jest -t "streak"`.
- Start the app: `npm start` (the API address is `extra.BASE_URL` in `app.json`).

## Conventions

- All API calls go through `scripts/services/apiClient.ts` (`apiRequest`), which throws `ApiError`.
  Show failures with `components/ui/ErrorState.tsx` (or `getErrorMessage(error)` in an `Alert`), never by failing silently.
- Screen tests live in the root `__tests__/` folder, **not** under `app/` (expo-router treats every file in `app/` as a route).
- Global test setup is in `jest.setup.ts` (fixed `BASE_URL`, icon/markdown/font mocks); tests run in `Europe/London` time (`jest.globalSetup.js`).
