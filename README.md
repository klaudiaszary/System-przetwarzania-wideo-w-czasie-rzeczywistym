# APEM proj filtry video

Wieloplatformowy system przetwarzania obrazu z kamery w czasie rzeczywistym. Ten projekt wpisuje sie w kategorie z PDF: **Przetwarzanie Obrazu** - filtry nakladane na zywo na obraz z kamery.

## Zgodnosc z APEM Projekt 2026L

| Wymaganie z PDF | Status w repo |
| --- | --- |
| Web dziala w przegladarce | `web/` zawiera aplikacje Vite/React |
| Kluczowy DSP w AssemblyScript kompilowany do Wasm | `web/assembly/index.ts` kompiluje zestaw funkcji DSP dla filtrow `Classic`, `Sepia`, `Posterize`, `Solarize` i `Duotone` do `web/src/wasm/filter-kernel.wasm` |
| Przetwarzanie wideo poza watkiem UI | `web/src/filterWorker.ts` przetwarza klatki w Web Workerze z `OffscreenCanvas` |
| Responsywny interfejs sterujacy parametrami | `web/src/App.tsx` i `web/src/styles.css` |
| Android Native | `android/` zawiera projekt Kotlin |
| Android CameraX | `android/app/src/main/java/pl/edu/apem/filtryvideo/MainActivity.kt` uzywa `ImageAnalysis` z CameraX |
| Android Custom View/SurfaceView | `android/app/src/main/java/pl/edu/apem/filtryvideo/FilterSurfaceView.kt` renderuje wynik |
| Ten sam algorytm na Web i Android | Web: `web/assembly/index.ts`; Android: `android/app/src/main/java/pl/edu/apem/filtryvideo/FrameFilter.kt` |
| Repo z katalogami `web/` i `android/` | Struktura repo jest wydzielona zgodnie z PDF |
| Raport AI & Math | `docs/AI_MATH_REPORT.md` |

Do finalnego oddania nadal trzeba opublikowac URL wersji webowej i zbudowac plik `.apk` z Android Studio.

## Struktura

```text
web/       Frontend webowy: TypeScript, React, AssemblyScript/Wasm, Web Worker
android/   Android Native: Kotlin, CameraX, SurfaceView
docs/      Koncepcja, raport AI & Math, notatki projektowe
```

## Mapa projektu

### Root repozytorium

- `.gitignore` - lista plikow generowanych, ktorych nie wrzucamy do Git, np. `node_modules/`, `dist/`, build Androida, logi i cache TypeScriptu.
- `README.md` - glowny opis projektu, instrukcje uruchomienia i mapa plikow.
- `aaaa.ts` - stary punkt startowy zostawiony tylko jako notatka historyczna; aktualny frontend startuje z `web/src/main.tsx`.
- `APEM Projekt 2026L.pdf` - tresc wymagan projektowych od prowadzacych.

### `docs/`

- `docs/CONCEPT.md` - koncepcja projektu do etapu 1: temat, role w zespole, stos technologiczny i zakres algorytmu.
- `docs/AI_MATH_REPORT.md` - raport wymagany w PDF: opis matematyki algorytmu oraz log wykorzystania AI.

### `web/`

- `web/package.json` - skrypty i zaleznosci frontendu. Najwazniejsze komendy: `npm run dev`, `npm run build`, `npm run build:wasm`.
- `web/package-lock.json` - zablokowane wersje zaleznosci npm; powinien byc commitowany razem z `package.json`.
- `web/index.html` - plik HTML ladowany przez Vite; zawiera element `#root` dla Reacta.
- `web/vite.config.ts` - konfiguracja Vite i pluginu React.
- `web/tsconfig.json` - konfiguracja TypeScriptu dla frontendu.
- `web/README.md` - krotsza instrukcja tylko dla modulu webowego.

### `web/assembly/`

- `web/assembly/index.ts` - kod DSP w AssemblyScript. To tutaj sa funkcje kompilowane do WebAssembly: luminancja, jasnosc/kontrast, detekcja krawedzi, miks efektu oraz nowe filtry `Sepia`, `Posterize`, `Solarize` i `Duotone`.

### `web/src/`

- `web/src/main.tsx` - wejscie aplikacji React; montuje komponent `App`.
- `web/src/App.tsx` - glowny ekran aplikacji: kamera, panel ustawien, piec przyciskow wyboru filtra i suwaki parametrow dopasowane do aktywnego efektu.
- `web/src/filterTypes.ts` - wspolne typy TypeScript: parametry filtra, sloty filtrow i komunikaty Worker/UI.
- `web/src/filterWorker.ts` - Web Worker przetwarzajacy klatki poza glownym watkiem UI; laduje plik Wasm i wykonuje filtr.
- `web/src/styles.css` - style aplikacji, w tym szerokosc panelu ustawien, przyciski filtrow i responsywnosc.
- `web/src/vite-env.d.ts` - deklaracje typow Vite, potrzebne m.in. dla importow CSS i assetow.

### `web/src/wasm/`

- `web/src/wasm/filter-kernel.wasm` - plik generowany przez `npm run build:wasm`. Nie edytowac recznie i nie commitowac; powstaje z `web/assembly/index.ts`.

### `android/`

- `android/settings.gradle.kts` - konfiguracja projektu Gradle i modulow.
- `android/build.gradle.kts` - wersje pluginow Android/Kotlin dla calego projektu.
- `android/gradle.properties` - ustawienia Gradle/AndroidX.
- `android/README.md` - instrukcja uruchomienia modulu Android w Android Studio.

### `android/app/`

- `android/app/build.gradle.kts` - konfiguracja aplikacji Android: SDK, package name i zaleznosci CameraX.
- `android/app/src/main/AndroidManifest.xml` - manifest aplikacji, uprawnienie kamery i aktywnosc startowa.
- `android/app/src/main/java/pl/edu/apem/filtryvideo/MainActivity.kt` - start aplikacji Android, prosba o uprawnienie kamery, konfiguracja CameraX i przekazywanie klatek do analizy.
- `android/app/src/main/java/pl/edu/apem/filtryvideo/FrameFilter.kt` - implementacja algorytmu filtrowania po stronie Androida.
- `android/app/src/main/java/pl/edu/apem/filtryvideo/FilterSurfaceView.kt` - renderowanie przetworzonego obrazu na `SurfaceView`.
- `android/app/src/main/java/pl/edu/apem/filtryvideo/FilterParams.kt` - parametry filtra dla Androida.
- `android/app/src/main/res/values/strings.xml` - nazwa aplikacji.
- `android/app/src/main/res/values/styles.xml` - podstawowy motyw Androida.

### Pliki i foldery generowane

Tych rzeczy nie edytujemy recznie i nie wrzucamy do Git:

- `node_modules/`, `web/node_modules/` - zaleznosci npm.
- `dist/`, `web/dist/` - build produkcyjny frontendu.
- `web/src/wasm/*.wasm` - wynik kompilacji AssemblyScript.
- `*.tsbuildinfo`, `*.log` - cache i logi narzedzi.
- `android/.gradle/`, `android/build/`, `android/app/build/`, `*.apk`, `*.aab` - build Androida.

## Uruchomienie Web

Jesli Node nie jest w `PATH`, ustaw go dla biezacego terminala:

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
```

```powershell
cd "\apem_proj_filtry_video\web"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Adres lokalny:

```text
http://127.0.0.1:5173/
```

Build:

```powershell
cd "\apem_proj_filtry_video\web"
& "C:\Program Files\nodejs\npm.cmd" run build
```

## Uruchomienie Android

1. Otworz katalog `android/` w Android Studio.
2. Poczekaj na synchronizacje Gradle.
3. Uruchom aplikacje na telefonie z kamera.
4. Zbuduj APK z Android Studio: `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

## Algorytm

Implementacja webowa przetwarza kazda klatke w `Web Workerze`, a obliczenia pikselowe wykonuje przez funkcje z `web/assembly/index.ts` skompilowane do WebAssembly. Aktualnie zaimplementowanych jest piec filtrow:

1. `Classic`

   Filtr pracuje na luminancji obrazu:

   ```text
   Y = (77 * R + 150 * G + 29 * B) >> 8
   ```

   Dla kazdego piksela liczona jest korekta jasnosci i kontrastu:

   ```text
   Y' = clamp(((Y - 128) * contrast) / 100 + 128 + brightness)
   ```

   Potem wyznaczana jest prosta miara krawedzi na podstawie lewego, prawego, gornego i dolnego sasiada:

   ```text
   edge = clamp(abs(right - left) + abs(bottom - top))
   ```

   Na koniec wynik progowania i krawedzi jest mieszany parametrem `edgeMix`:

   ```text
   thresholded = Y' >= threshold ? 255 : 0
   output = clamp((thresholded * (1000 - edgeMixPermille) + edge * edgeMixPermille) / 1000)
   ```

   Wynik jest wyswietlany jako obraz w odcieniach szarosci.

2. `Sepia`

   Filtr przelicza niezaleznie kazdy kanal RGB wedlug stalych wspolczynnikow:

   ```text
   R' = clamp((100 * R + 197 * G + 48 * B) >> 8)
   G' = clamp((89 * R + 176 * G + 43 * B) >> 8)
   B' = clamp((70 * R + 137 * G + 34 * B) >> 8)
   ```

3. `Posterize`

   Dla kazdego kanalu wykonywana jest kwantyzacja do zadanej liczby poziomow `levels`. Krok kwantyzacji:

   ```text
   step = 256 / levels
   ```

   Kanal jest zaokraglany do srodka przedzialu:

   ```text
   quantized = floor(value / step) * step
   output = clamp(quantized + step / 2)
   ```

4. `Solarize`

   Najpierw liczona jest luminancja `Y`. Jesli przekracza prog `threshold`, jest odwracana:

   ```text
   output = Y > threshold ? clamp(255 - Y) : Y
   ```

   Wynik jest zapisywany do wszystkich trzech kanalow, wiec efekt ma charakter monochromatyczny.

5. `Duotone`

   Najpierw liczona jest luminancja `Y`, a potem dla kazdego kanalu interpolacja miedzy kolorem ciemnym i jasnym:

   ```text
   output = clamp(((255 - Y) * darkColor + Y * lightColor) / 255)
   ```

   Dzieki temu ciemne partie obrazu przechodza w `duotoneDark`, a jasne w `duotoneLight`.

Wszystkie operacje sa obcinane do zakresu `0..255` funkcja `clamp`, a oryginalny kanal alfa pozostaje bez zmian.
