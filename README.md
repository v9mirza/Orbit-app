# Orbit

An offline-first personal workspace for Android and iOS, built with Expo Router, React Native, TypeScript, and Expo SQLite.

## Run

Use Node 24 LTS or another Node release supported by Expo SDK 57. The current development environment uses Node 25, which prints engine warnings, though bundling succeeded.

```sh
npm install --legacy-peer-deps
npm start
```

Open the project in an Expo Go build that supports SDK 57 on a phone or an Android/iOS simulator. If Expo Go still shows a version mismatch, install the SDK 57 Android build from https://expo.dev/go?platform=android&sdkVersion=57 and restart Metro with npx expo start -c. No account or network service is needed after the project is installed.

## EAS Build

Sign in to your Expo account and link Orbit once with `eas init`. The `preview` profile in `eas.json` makes an Android APK you can install directly; `production` makes an Android App Bundle for Google Play.

```sh
eas init
eas build --platform android --profile preview
eas build --platform android --profile production
```

The first build may ask EAS to generate Android signing credentials. After a build finishes, open the build link from the CLI to download the APK or AAB. The Android launcher icon and native splash artwork appear in these installed builds.

## Checks

```sh
npm run typecheck
npm test
npx expo-doctor
npx expo export --platform all
```

The tests cover integer money input, recurrence and streak dates, schema initialization, foreign keys, and unique habit check-ins. Both native bundles export successfully. Android emulator startup and the Overview screen have been checked; final splash and launcher appearance require an installed app build.

## Implemented

- Five tabs and first-launch onboarding with Orbit branding and an optional local profile name.
- Versioned SQLite schema, foreign keys, typed feature repositories, and local settings.
- Income and expense transactions with edit/delete, categories, search, filters, monthly budget, summaries, and a live chart.
- Notes with pinning, colors, tags, search, and autosave.
- Tasks with priorities, due dates, completion, filters, and daily/weekday/weekly/monthly recurrence.
- Habits with daily or selected-day schedules, check-ins, streaks, history, and a weekly chart.
- Overview based on saved records and activity events.
- Editable profile name, currency, date format, week start, category management, and local data deletion in Settings.
- Full local backup export and restore from Settings, including preferences and all SQLite records. Restore validates the file and replaces data in one transaction.

## Remaining release work

- Run manual acceptance checks on Android and iOS devices or simulators and fix any native runtime or layout issues found.
- Add category-specific budgets and numeric habit targets if these optional advanced controls are required.
- Review the dependency audit before store release. The current Expo SDK dependency tree reports transitive advisories; avoid blindly applying incompatible major-version fixes.

The source artwork is `orbit-logo.png`. Regenerate the in-app logo, launcher icons, and splash image with `node scripts/generate-assets.cjs`.

