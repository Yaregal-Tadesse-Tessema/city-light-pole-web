# Localization Guide

## Overview
- Core translations live in `src/i18n/resources/{en,om,am}.ts`. English defines the canonical key tree; Oromo and Amharic reuse that structure until human translations are supplied.
- Namespaces roughly follow feature areas (e.g., `layout`, `landing`, `login`, `dashboard`, `reportAccident`). Each page should import `useTranslation('<namespace>')` and replace static text with `t('key')`.
- The language selector already persists the selected locale to `localStorage` and lives in `src/components/LanguageSelector.tsx`.

## Running the Audit
- Execute `node scripts/i18n-audit.cjs` to regenerate `reports/i18n-audit.json`. The report lists candidate static strings (`label`, `placeholder`, inline text) across `.tsx/.ts` files to help identify what still needs translation.
- Review the report by feature (e.g., filter by file path) and decide which namespace to add keys under.

## Adding a Translation Key
1. Add the new string under the appropriate namespace in `src/i18n/resources/en.ts`.
2. Copy the updated structure into `src/i18n/resources/om.ts` and `src/i18n/resources/am.ts` so key bindings exist. Replace the values with translated text when ready.
3. Use `t('namespace.key')` in the component instead of hard-coded text. For repeated words (e.g., table headers), create shared keys under a common namespace like `layout.tableHeaders`.

## Keeping Keys Organized
- Group translations by functionality (e.g., `dashboard.totals`, `users.table`).
- Document any new namespace addition in this guide with the reason it exists.
- If a string includes dynamic data, pass parameters to `t` via interpolation (e.g., `t('greeting', { name: user.name })`).

## Namespace Notes
- `maintenance`: Maintenance schedules, filters, and related modals on the maintenance page.
- `issuesList`: Issues list page, filters, and attachment workflows.

## Quality Checklist
- Run `npm run build` after adjusting translations to catch TypeScript/JSX errors.
- Switch languages via the selector to ensure the UI refreshes using the new keys.
- Update `reports/i18n-audit.json` after refactors and double-check there are no remaining visible literal strings.
