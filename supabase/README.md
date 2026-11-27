# Дворик — бекенд (Supabase)

Проєкт: `irfvpbnkfovedzyqeudq` · клієнт: `../js/cloud.js` (URL і publishable-ключ записані там).

## Що є

- **Анонімний акаунт** створюється під час першого запуску (без пошти й пароля).
- **`saves`** — один рядок на гравця: увесь стан гри (`data`), версія `rev`, рівень і розділ для показу.
  Читати можна лише свій рядок, писати — лише через `push_save`.
- **`push_save(p_data, p_base_rev, p_device, p_force)`** — приймає сейв, лише якщо він базується на
  останній хмарній версії. Інакше повертає `ok=false`, і гра питає, яку версію залишити.
- **`save_history`** — 10 попередніх версій кожного гравця (клієнтам недоступна, лише через панель —
  для відповіді на «пропав прогрес»).
- **`delete_me()`** — видаляє акаунт і всі дані (вимога App Store / Google Play). Кнопка в налаштуваннях гри.

## Як гра синхронізується

1. Гра працює з `localStorage`, як і раніше. Після змін — запис у хмару не частіше, ніж раз на 45 с,
   і одразу, коли гру згортають.
2. Під час запуску гра порівнює свою версію з хмарною. Якщо в хмарі інша — показує вікно
   «Два різні збереження» з рівнем і розділом обох.
3. Без інтернету гра просто працює далі й доганяє, щойно звʼязок повернеться.

## Налаштування проєкту (один раз)

1. **Authentication → Sign In / Providers → Allow anonymous sign-ins** — увімкнути.
2. **SQL Editor** — виконати `migrations/20261123000000_saves.sql` (можна повторно, нічого не зламає).

Або через CLI (`brew install supabase/tap/supabase`):

```bash
supabase login
supabase link --project-ref irfvpbnkfovedzyqeudq
supabase db push
```

## Вхід через Apple і Google

Навіщо: перенести гру на інший телефон (або з сайту в застосунок).

- Налаштування → «Хмара» → «Увійти через Apple / Google». Анонімний акаунт стає постійним, прогрес на місці.
- Новий телефон: на стартовому екрані «Вже граєш на іншому телефоні? Увійти» → гра продовжується.
- Якщо цей Apple / Google уже привʼязаний до іншого акаунта — гра входить у нього, порожній анонімний
  видаляє і, якщо на телефоні вже є прогрес, показує «Два різні збереження».

| Де | Apple | Google |
|---|---|---|
| iPhone (застосунок) | нативно (`ios/App/App/NativeAuthPlugin.swift`) | системне вікно входу → Supabase |
| Android (застосунок) | — | Chrome Custom Tab → повернення через `ua.dvoryk.app://auth` |
| Сайт | — | перехід на сторінку Google і назад |

Google в усіх випадках іде через сторінку Supabase, тому Google-клієнт потрібен лише один (Web).

### 1. Google Cloud — [console.cloud.google.com](https://console.cloud.google.com)

1. Створити проєкт (напр. «Dvoryk»).
2. **Google Auth Platform → Branding**: назва застосунку (CozyYard), пошта підтримки, логотип не завантажувати
   (з логотипом Google вимагає перевірку); **Authorized domains**: `irfvpbnkfovedzyqeudq.supabase.co`
   (сам `supabase.co` Google не приймає — він у списку публічних суфіксів).
3. **Audience**: External → **Publish app** (статус *In production*). Для email/profile перевірка Google не потрібна.
4. **Clients → Create client → Web application**.
   **Authorized redirect URIs**: `https://irfvpbnkfovedzyqeudq.supabase.co/auth/v1/callback`.
   Скопіювати **Client ID** і **Client secret**.

### 2. Apple Developer — [developer.apple.com/account/resources/identifiers](https://developer.apple.com/account/resources/identifiers)

1. **Identifiers → App IDs**: `ua.dvoryk.app` (створити, якщо ще немає) → увімкнути **Sign in with Apple** → Save.
2. Xcode → App → Signing & Capabilities: вибрати свою Team (entitlement `App.entitlements` уже в проєкті).

Services ID не потрібен — на iPhone вхід нативний.

3. **Keys → +** (ключ для відкликання входу під час видалення акаунта, вимога App Review 5.1.1(v)):
   назва «Dvoryk Sign in with Apple», галочка **Sign in with Apple** → Configure → Primary App ID `ua.dvoryk.app`
   → Save → Continue → Register → **Download** (файл `AuthKey_XXXXXXXXXX.p8` дають завантажити лише один раз).
   Запамʼятати **Key ID** (10 символів).

### 3. Supabase — [панель проєкту](https://supabase.com/dashboard/project/irfvpbnkfovedzyqeudq/auth/providers)

1. **Authentication → Sign In / Providers**:
   - **Allow manual linking** — увімкнути (щоб привʼязувати Apple / Google до анонімного акаунта).
   - **Google** — Enable, вставити Client ID і Client secret з кроку 1.
   - **Apple** — Enable, **Client IDs**: `ua.dvoryk.app`. Решту полів (Secret Key) лишити порожніми.
2. **Authentication → URL Configuration**:
   - **Site URL**: `https://l-dim.github.io/dvoryk/`
   - **Redirect URLs** (Add URL по одному):
     `ua.dvoryk.app://auth`, `https://l-dim.github.io/dvoryk/`, `http://localhost:8765/`, `http://127.0.0.1:8765/`

## Видалення акаунта і відкликання Apple

Налаштування → «Хмара» → «Видалити акаунт і дані з хмари». Якщо до акаунта привʼязано Apple, iPhone ще раз
показує вікно Apple, і edge-функція `functions/apple-revoke` відкликає вхід (гра зникає з
«Налаштування → Apple ID → Вхід через Apple»). Потім `delete_me()` видаляє акаунт і дані.
Якщо відкликати не вдалося (немає інтернету до Apple, ключ не налаштовано) — акаунт однаково видаляється.

Розгортання (один раз):

1. **Edge Functions → Secrets** (Add new secret):
   - `APPLE_TEAM_ID` = `B2CZV435TJ`
   - `APPLE_KEY_ID` = Key ID із кроку «Apple Developer → Keys»
   - `APPLE_PRIVATE_KEY` = увесь вміст файлу `.p8` (разом із рядками `-----BEGIN/END PRIVATE KEY-----`)
2. Функція:
   ```bash
   supabase functions deploy apple-revoke --no-verify-jwt --project-ref irfvpbnkfovedzyqeudq
   ```
   Або в панелі: **Edge Functions → Deploy a new function → Via Editor**, назва `apple-revoke`, вставити
   `functions/apple-revoke/index.ts` → Deploy, потім у налаштуваннях функції вимкнути **Verify JWT**
   (сесію функція перевіряє сама).

## Далі

- Власний домен для Supabase (платна опція), щоб у вікні Google було «дворик», а не `irfvpbnkfovedzyqeudq.supabase.co`.
- Покупки (RevenueCat → вебхук → таблиця `purchases`, видача товару за `transaction_id` без дублів).
- Захист від ботів для анонімних акаунтів: Authentication → Attack Protection → CAPTCHA (Turnstile),
  якщо почнуть масово створюватися акаунти.
