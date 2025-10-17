# Triolingo Akademi

Triolingo Akademi är en spelifierad webbapp som hjälper dig att träna **musik**,
**matematik** och **språk** i samma gränssnitt – inspirerad av Duolingo men med
tre kreativa kunskapsområden. Appen är byggd utan bundlers och använder
Firebase Authentication för att erbjuda både Google-inloggning och klassisk
inloggning med e-post och lösenord.

## Funktioner

- ✨ Tre tematiska spår: Musikens byggstenar, Matematikmästaren och Språkresan.
- 🧩 Mikrolektioner med flervalsfrågor, ordningsövningar, flashcards och
  översättningar.
- 🔥 Daglig streak som motiverar daglig övning och sparas i webbläsaren.
- 🔐 Inloggning med Google eller e-post/lösenord via Firebase Authentication.
- 💾 Progression sparas lokalt per användare och följer med vid inloggning.

## Kom igång

1. Skapa ett nytt projekt i [Firebase Console](https://console.firebase.google.com/)
   och aktivera **Authentication** med både "Google" samt "Email/Password" som
   inloggningsmetoder.
2. Lägg till en webapp i projektet och kopiera konfigurationsobjektet
   (`apiKey`, `authDomain`, `projectId`, etc.).
3. Öppna `src/firebase-config.js` och ersätt platshållarna med dina riktiga
   värden.
4. Starta en enkel HTTP-server (till exempel `npx serve` eller `python -m http.server`)
   i projektroten och öppna `http://localhost:3000` (eller motsvarande port).

```bash
# exempel med Python 3
python -m http.server 3000
```

5. Logga in med Google eller skapa ett konto med e-post och lösenord och börja
   samla XP!

## Projektstruktur

```
.
├── index.html          # Startsida och UI-struktur
├── styles.css          # Layout, färger och komponent-styling
└── src
    ├── app.js          # Appens logik och UI-hantering
    ├── firebase.js     # Inloggningshjälpare och initiering av Firebase
    ├── firebase-config.js  # Platshållare för dina Firebase-nycklar
    └── lessonData.js   # Datastruktur för spår och mikrolektioner
```

## Nästa steg

- Lägg till fler mikrolektioner eller ytterligare spår.
- Koppla på Firestore eller Realtime Database för att lagra progression i molnet.
- Bygg ut med notifikationer, vänlistor och utmaningar – precis som i Duolingo!

Lycka till med dina studier i Triolingo Akademi! 🎓
