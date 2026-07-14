# Modul Android

Szkielet natywnej aplikacji Android zgodny z wymaganiami PDF:

- Kotlin.
- CameraX do akwizycji obrazu z kamery.
- `SurfaceView` do renderowania przetworzonej klatki.
- Algorytm analogiczny do webowego DSP.

## Najwazniejsze pliki

- `app/src/main/java/pl/edu/apem/filtryvideo/MainActivity.kt` - konfiguracja CameraX i analiza klatek.
- `app/src/main/java/pl/edu/apem/filtryvideo/FrameFilter.kt` - algorytm filtrowania obrazu.
- `app/src/main/java/pl/edu/apem/filtryvideo/FilterSurfaceView.kt` - renderowanie wyniku.

## Uruchomienie

1. Otworz katalog `android/` w Android Studio.
2. Poczekaj na synchronizacje Gradle.
3. Uruchom aplikacje na telefonie lub emulatorze z kamera.
4. Zbuduj APK przez `Build > Build Bundle(s) / APK(s) > Build APK(s)`.
