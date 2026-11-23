#!/usr/bin/env bash
# פריסת גרסת המחשב (עולם המבחן) ל-Expo Hosting: https://panmatz-exam.expo.app
# דורש EXPO_TOKEN בסביבה. מפתחות Supabase נלקחים מפרופיל preview ב-eas.json.
set -euo pipefail
cd "$(dirname "$0")/.."
export $(node -e "const e=require('./eas.json').build.preview.env;console.log(Object.entries(e).map(([k,v])=>k+'='+v).join(' '))")
rm -rf dist-web
CI=1 npx expo export --platform web --clear --output-dir dist-web
npx -y eas-cli deploy --prod --export-dir dist-web --non-interactive
rm -rf dist-web
