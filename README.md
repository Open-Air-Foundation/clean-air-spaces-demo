# Clean Air Spaces – Chiang Mai prototype

Clickable prototype of how citizens could use public space measurements (AirGradient Go) to find indoor places with clean air.

## Open it

Double-click `index.html`. It opens in your browser straight from disk.

It needs an internet connection for the base map (OpenFreeMap), MapLibre, Lottie and fonts. Everything else (places, mascots, logo) is in this folder.

If your browser refuses to open it from disk, run this from this folder and open http://localhost:8765:

```bash
python3 -m http.server 8765
```

Live version: https://open-air-foundation.github.io/clean-air-spaces-demo/

## Layouts

The switch in the blue bar toggles between **Phone** (the app in a phone frame, simulation controls beside it) and **Desktop** (sidebar with search, filters and list or place details, full-width map, simulation controls as a floating card you can hide). Add `#desktop` or `#phone` to the link to open a layout directly. On screens narrower than 880 px the app always fills the screen in the phone layout.

## Simulated measurement

Open a place and tap **Measure** to run a simulated AirGradient Go indoor measurement, following the iOS flow without the outdoor, calibration and place-type steps: prepare, six questions while Go settles (15 s) and collects 10 readings (every 3 s), review, submit, and the success screen with level and badges. Readings follow the place's current indoor estimate, so the outdoor slider affects them. "Fast measurement" in the simulation panel runs it in about 10 seconds.

Taking a photo always uses the same sample photo (`assets/dummy-photo.jpg`, from the AirGradient website), and the public profile name starts as "CleanAirCM". The answer and place icons are the app's own two-tone Spot icons (`data/spot-icons.js`, converted from `apps/mobile/ios/Scripts/generate_spot_symbols.py`), with simple stand-ins where the app uses SF Symbols. The confetti is a port of `SpotConfettiView`.

Submissions, points and badges are kept in the viewer's browser only. Submitted measurements show on the place as "Awaiting review" and don't change the estimate.

## What's in it

- `index.html`, `styles.css`, `app.js`: the page, styles and logic
- `data/places.js`: 300 real places in central Chiang Mai from OpenStreetMap (© OpenStreetMap contributors, ODbL)
- `data/mascots.js`: Lottie mascot animations copied from the Android app resources
- `assets/openair-foundation-logo.png`: Open Air Foundation logo from openair.foundation (shown in white on the teal header)

## How the simulation works

- The **outdoor PM2.5 slider** sets the city level. Hidden outdoor stations add local variation, blended into the outdoor air layer.
- Each place has 0–5 simulated measurements (indoor + outdoor reading on the same day, as in the Go measurement flow), seeded by the place ID so every viewer sees the same data.
- The **estimate on the map** is the median indoor/outdoor ratio of a place multiplied by the outdoor air at that place right now.
- **Clean Air Space**: at least 2 measurements, each at most 30% of outside, and at least one taken when outside PM2.5 was 35.5 µg/m³ or more.
- About 40% of Clean Air Spaces are **sealed**: their past indoor readings are 1–4 µg/m³ and the estimate stays at most 4 µg/m³ at any outdoor level (`SEALED_SHARE`, `SEALED_MAX` in `app.js`).
- Clean Air Spaces also show a sample reward (10% off a coffee, code `CLEANAIR10`) and a note that they run an open-source positive pressure system, linking to https://openair.foundation/.
- Comparison wording uses the same thresholds as `spotComparison()` in the apps. Colours follow the US EPA (2024) bands and indoor CO₂ thresholds used in the apps.

All air quality values are simulated and do not describe the real places.
