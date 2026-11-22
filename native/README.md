# Дворик — застосунок для App Store і Google Play

Нативні оболонки (Capacitor 8) навколо тієї самої веб-гри з кореня репозиторію.
Код гри редагується як і раніше в `../js`, `../index.html` тощо, а тут лише збирається.

```bash
npm install          # один раз
npm run sync         # зібрати www/ з гри й скопіювати в ios/ та android/
npm run ios          # sync + відкрити Xcode
npm run android      # sync + відкрити Android Studio
```

- `scripts/build-www.mjs` копіює в `www/` лише потрібне грі (без `art/`, превʼю, `sw.js`).
- `assets/` — іконка 1024×1024 і лого для заставки; перегенерувати:
  `npx @capacitor/assets generate --iconBackgroundColor '#fff4e6' --splashBackgroundColor '#fff4e6' --logoSplashScale 0.3`
- `../js/native.js` — усе, що відрізняє застосунок від сайту: сейв дублюється в нативне сховище
  (Preferences), без service worker, кнопка «Назад» на Android.
- Ідентифікатор застосунку: `ua.dvoryk.app` (`capacitor.config.json`). Після першої завантаженої
  збірки в App Store Connect / Play Console його вже не змінити.

## Збірка з терміналу (iOS)

Xcode з командного рядка може зависнути на «Resolve Package Graph», чекаючи доступу до Keychain.
Додавай `-packageAuthorizationProvider netrc`:

```bash
cd ios/App && xcodebuild -project App.xcodeproj -scheme App -sdk iphonesimulator \
  -derivedDataPath build -packageAuthorizationProvider netrc CODE_SIGNING_ALLOWED=NO build
```

## Android

Потрібен Android Studio (у ньому JDK і Android SDK). Після встановлення: `npm run android`.
