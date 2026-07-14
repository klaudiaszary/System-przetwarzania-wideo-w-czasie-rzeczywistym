# Modul Web

Stos zgodny z wymaganiami:

- AssemblyScript do DSP.
- WebAssembly jako runtime funkcji DSP.
- TypeScript/React do UI.
- Web Worker + OffscreenCanvas do przetwarzania klatek poza watkiem glownym.

## Pliki

- `assembly/index.ts` - funkcje DSP kompilowane do Wasm.
- `src/filterWorker.ts` - przetwarzanie klatek w Workerze.
- `src/App.tsx` - UI React sterujace parametrami filtra.
- `src/styles.css` - responsywne style.

## Komendy

```powershell
$env:Path = "C:\Program Files\nodejs;$env:Path"
& "C:\Program Files\nodejs\npm.cmd" install
& "C:\Program Files\nodejs\npm.cmd" run dev
```

Build:

```powershell
& "C:\Program Files\nodejs\npm.cmd" run build
```
