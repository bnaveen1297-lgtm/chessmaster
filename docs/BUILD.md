# Building installable apps (APK / iOS)

The sandbox can't build native binaries (no Android SDK / Xcode). Use **EAS
Build** (Expo's free cloud builder). `eas.json` is already set up.

## Android APK (easiest — a file you can install)
On any computer with Node:

```bash
npm install -g eas-cli
eas login                 # sign in with a free Expo account (expo.dev)
cd chessmaster
eas build -p android --profile preview
```

- Builds in the cloud (~10–15 min).
- When done, the terminal prints a **download link to the .apk** (also on
  expo.dev → your project → Builds).
- Copy the APK to an Android phone and open it (allow "install from unknown
  sources"). Done.

## iOS
iOS needs a **paid Apple Developer account** ($99/yr) — Apple does not allow
installing arbitrary `.ipa` files on a normal iPhone.

```bash
eas build -p ios --profile preview     # prompts for Apple credentials
```

Distribute via **TestFlight** (`eas submit -p ios`) — testers install the
TestFlight app and get the build. This is the standard iOS testing path.

## No build at all (fastest — iOS + Android)
Install **Expo Go** on the phone, then:

```bash
cd chessmaster && npm install && npx expo start
```

Scan the QR code with Expo Go. The app runs immediately — great for quick
testing without producing a file.

## Notes
- App identifiers are already set in `app.json`
  (`com.chessmaster.app` for both platforms).
- If you use the Supabase backend, set `EXPO_PUBLIC_SUPABASE_URL` /
  `EXPO_PUBLIC_SUPABASE_ANON_KEY` in an EAS **environment/secret** (or `.env`)
  before building so the binary is linked to the backend.
