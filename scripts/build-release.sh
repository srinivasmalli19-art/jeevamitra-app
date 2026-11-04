#!/usr/bin/env bash
# Builds the signed Play Store bundle (app-release.aab) on a Mac, in one go.
#   bash scripts/build-release.sh
# It finds Java 21 and the Android SDK, finds your upload key, asks for the key
# password (typed by you, never saved to disk), builds, and checks the signature.
set -euo pipefail

cd "$(dirname "$0")/.."
ROOT="$(pwd)"
say()  { printf "\n\033[1;32m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[1;31mSTOPPED: %s\033[0m\n" "$1"; exit 1; }

# ---------- 1. Java 21 ---------------------------------------------------------
say "1/7 Java 21"
JDK=""
if /usr/libexec/java_home -v 21 >/dev/null 2>&1; then JDK="$(/usr/libexec/java_home -v 21)"; fi
if [ -z "$JDK" ] && command -v brew >/dev/null 2>&1; then
  [ -d "$(brew --prefix)/opt/openjdk@21" ] || { echo "Installing Java 21 with Homebrew (a few minutes)..."; brew install openjdk@21; }
  JDK="$(brew --prefix)/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home"
fi
[ -x "$JDK/bin/java" ] || fail "Java 21 not found and Homebrew is not installed. Install it from https://adoptium.net (Temurin 21, macOS) and run this again."
export JAVA_HOME="$JDK" PATH="$JDK/bin:$PATH"
"$JAVA_HOME/bin/java" -version 2>&1 | head -1

# ---------- 2. Android SDK -----------------------------------------------------
say "2/7 Android SDK"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
[ -d "$ANDROID_HOME/platforms" ] || fail "Android SDK not found at $ANDROID_HOME. Open Android Studio once (it installs the SDK), then run this again."
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
echo "$ANDROID_HOME"

# ---------- 3. Google Maps key (.env) ------------------------------------------
say "3/7 Google Maps key"
if ! grep -qE '^VITE_GOOGLE_MAPS_API_KEY=.+' .env 2>/dev/null; then
  echo "The Map screen needs your Google Maps API key (Google Cloud console > APIs & Services > Credentials, project jeevamitra)."
  read -r -p "Paste the key and press Enter (or just Enter to build without the map): " MAPS
  [ -n "$MAPS" ] && printf 'VITE_GOOGLE_MAPS_API_KEY=%s\n' "$MAPS" > .env
fi
grep -qE '^VITE_GOOGLE_MAPS_API_KEY=.+' .env 2>/dev/null && echo "Maps key: found" || echo "Maps key: MISSING (the Map screen will be blank)"

# ---------- 4. Upload key --------------------------------------------------------
say "4/7 Upload key (the one used for version 61)"
KEYSTORE="${JM_KEYSTORE:-}"
if [ -z "$KEYSTORE" ]; then
  FOUND=()
  while IFS= read -r f; do
    case "$f" in */debug.keystore|*/.android/*|*/node_modules/*|*/Library/*) ;; *) FOUND+=("$f");; esac
  done < <(mdfind "kMDItemFSName == '*.jks' || kMDItemFSName == '*.keystore'" 2>/dev/null)
  if [ "${#FOUND[@]}" -eq 0 ]; then
    fail "No .jks or .keystore file found on this Mac. Copy your version-61 upload key here (for example into Downloads) and run this again."
  fi
  echo "Key files found on this Mac:"
  for i in "${!FOUND[@]}"; do echo "  $((i+1))) ${FOUND[$i]}"; done
  read -r -p "Type the number of the JeevaMitra upload key: " N
  KEYSTORE="${FOUND[$((N-1))]:-}"
  [ -f "$KEYSTORE" ] || fail "That number is not in the list."
fi
echo "Using: $KEYSTORE"

read -r -s -p "Keystore password (nothing shows while typing): " STOREPW; echo
ALIASES="$(keytool -list -keystore "$KEYSTORE" -storepass "$STOREPW" 2>/dev/null | awk -F', ' '/PrivateKeyEntry/{print $1}')" \
  || true
[ -n "$ALIASES" ] || fail "Wrong password, or this file is not a key store. Run again and check the password."
COUNT="$(printf '%s\n' "$ALIASES" | wc -l | tr -d ' ')"
if [ "$COUNT" = "1" ]; then ALIAS="$ALIASES"; else
  echo "Keys inside this file:"; printf '%s\n' "$ALIASES" | nl -w3 -s') '
  read -r -p "Type the number of the upload key: " N
  ALIAS="$(printf '%s\n' "$ALIASES" | sed -n "${N}p")"
fi
echo "Key alias: $ALIAS"
read -r -s -p "Key password (press Enter if it is the same as the keystore password): " KEYPW; echo
[ -n "$KEYPW" ] || KEYPW="$STOREPW"
export JM_KEYSTORE="$KEYSTORE" JM_KEY_ALIAS="$ALIAS" JM_STORE_PASSWORD="$STOREPW" JM_KEY_PASSWORD="$KEYPW"

# ---------- 5. Web build + copy into Android -------------------------------------
say "5/7 Building the app"
[ -d node_modules ] || npm ci
npm run build
npx cap sync android

# ---------- 6. Signed bundle -----------------------------------------------------
say "6/7 Building the signed bundle (first time: 5-10 minutes)"
mv android/key.properties android/key.properties.off 2>/dev/null || true   # use the key chosen above
( cd android && ./gradlew --no-daemon bundleRelease )
AAB="$ROOT/android/app/build/outputs/bundle/release/app-release.aab"
[ -f "$AAB" ] || fail "The build finished but no bundle was made."

# ---------- 7. Check ---------------------------------------------------------------
say "7/7 Checking the bundle"
grep -E 'versionCode|versionName' android/app/build.gradle | tr -s ' '
SIGNED="$(keytool -printcert -jarfile "$AAB" 2>/dev/null | grep -E 'SHA1:' | head -1 || true)"
[ -n "$SIGNED" ] || fail "The bundle is not signed."
EXPECT="$(keytool -list -v -keystore "$KEYSTORE" -storepass "$STOREPW" -alias "$ALIAS" 2>/dev/null | grep -E 'SHA1:' | head -1)"
echo "Bundle signed with : $SIGNED"
echo "Your upload key    : $EXPECT"
[ "$(echo "$SIGNED" | tr -d ' ')" = "$(echo "$EXPECT" | tr -d ' ')" ] || fail "Signature does not match the chosen key."
unset JM_STORE_PASSWORD JM_KEY_PASSWORD STOREPW KEYPW

printf "\n\033[1;32mDONE. Bundle ready:\033[0m %s (%s)\n" "$AAB" "$(du -h "$AAB" | cut -f1)"
echo "Compare the SHA1 above with Play Console > App integrity > Upload key certificate, then upload this file to Internal testing."
open -R "$AAB" 2>/dev/null || true
