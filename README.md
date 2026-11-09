## SELECT CODE, THEN SELECT THE .APK TO INSTALL THE APP TO YOUR PHONE!!!

[Watch Demo](https://youtu.be/ISYBe8L6hEc)
# MarcMyMiles - Driver Log

MarcMyMiles - Driver Log is a mobile-first automatic mileage tracker for your phone. It watches your speed, starts recording when you drive above 20 mph, and keeps weekly, monthly, and year-to-date totals on the device.

**Live app:** [https://site-25d9c0a88fd3465b82be5cdf958ac770.freebuff.page
]
## What it does

- **First-run vehicle setup** — name your vehicle (and optionally add a plate) before detection starts.
- **Vehicle garage** — add, switch, or remove vehicles from the dashboard. Removing a vehicle keeps its past trips in the log; the vehicle currently recording cannot be removed until that drive finishes.
- **Automatic drive detection** — GPS speed at 20+ mph for 5 seconds starts a trip; 2 minutes below 3 mph ends it.
- **Accelerometer assist** — motion events trigger extra location probes when a GPS fix goes stale and show live movement status. GPS speed remains the source of truth for the 20 mph threshold and mileage.
- **Per-vehicle mileage totals** — this week (Sunday–Saturday), this calendar month, and year to date for the selected vehicle.
- **Drive history** — time, duration, miles, and peak speed for each recorded trip, with delete controls.
- **Mileage logs** — choose a **Day log**, **Week log**, **Month log**, or **YTD mileage** report. The logs name the vehicles driven in the period and list every trip with its vehicle, miles, and drive time; YTD shows total miles per vehicle.
- **On-device storage** — completed trips live in `localStorage`; there is no account, server, or upload.
- **Android install** — a persistent **Add to phone** button opens the Android APK download page on GitHub. Android/Chrome can also install the PWA for full-screen use through the one-time home-screen invitation. The invitation is shown once and does not return after it is shown or dismissed. iOS is not supported. A screen wake lock is requested while detection is active where the browser supports it.

## Run locally

```bash
npm install
npm run dev
```

Open the URL Vite prints. GPS access requires a secure context: `https://` or `localhost`. On a real phone, deploy the built app over HTTPS or use a tunnel; `localhost` on the phone refers to the phone itself.

```bash
npm test       # mileage period and GPS math tests
npm run build  # type-check and production build
```

## Detection rules

| Rule | Value |
| --- | --- |
| Auto-start speed | 20 mph |
| Time above start speed | 5 seconds |
| Auto-stop speed | 3 mph |
| Time below stop speed | 2 minutes |
| Minimum saved trip | 0.02 mi |
| GPS fixes trusted for distance/start | 100 m accuracy or better |

Each GPS fix is compared with the previous one using the haversine formula. Implausible jumps (over 130 mph between fixes) are ignored. Reported device speed is preferred; a calculated segment speed is used when the browser does not supply one.

## Mileage reports

Open the **Reports** area under **Your mileage** and choose one of four report types:

1. **Day log** — pick a day and get every trip from that day in chronological order.
2. **Week log** — pick any day in a Sunday–Saturday week and get that week's trips.
3. **Month log** — pick a calendar month and get that month's trips.
4. **YTD mileage** — get total miles driven this year for each vehicle, with no trip log.

The day, week, and month logs name the vehicle or vehicles driven in the selected period, then list each trip with its date, vehicle, plate, start and end time, total time, and miles. A per-vehicle total and an overall total follow the trip log.

The report defaults to today's day log and is generated on the phone from local data through the browser's normal download flow. Files are UTF-8 CSV named `marcmymiles-day-log-YYYY-MM-DD.csv`, `marcmymiles-week-log-YYYY-MM-DD.csv`, `marcmymiles-month-log-YYYY-MM.csv`, or `marcmymiles-ytd-mileage-YYYY.csv`. No server or account is involved.

Each downloaded report includes a sequential **Generated log #**, starting at 1. The next number is stored on the phone and continues increasing across sessions, regardless of which report type is downloaded.

## GPS access

During first-run setup the app asks for location access and shows the current permission state. If the browser blocks it, open **GPS setting help** for the steps to allow location on Android or desktop, then return to MarcMyMiles and tap **Check GPS again**. The app cannot change phone settings itself; the browser or operating system owns that permission.

## Browser limitations

This is a web app, not a native background tracker. Mobile browsers suspend geolocation when the tab is backgrounded or the screen locks. **Keep MarcMyMiles open while driving** for reliable recording. Where supported, the app requests a screen wake lock; some browsers may not support that API. If the browser stops location updates, MarcMyMiles keeps the trip open when possible and shows a searching state, but gaps cannot be recovered precisely.

Mileage is derived from GPS and is an estimate. It is not intended for legal, tax, or reimbursement records without verification against your odometer.

## Install

MarcMyMiles is an Android app. On Android, open the [live app](https://site-25d9c0a88fd3465b82be5cdf958ac770.freebuff.page/) in Chrome. After first-run setup, an **Add to phone** button stays beneath the app header and opens the [Android APK download page](https://github.com/dmerrill714/marcmymiles/blob/main/MarcMyMiles-DriverLog.apk). The one-time invitation offers the native PWA install prompt when available. iOS is not supported.

MarcMyMiles also presents its install invitation once after setup on Android. Tap **Install MarcMyMiles** to open the native install prompt. The invitation is recorded as seen before it appears, so it will not return on later visits even if you choose **Not now**. You can still use the browser menu to install later.

First-run setup asks for a vehicle and location access; motion permission is requested when you press **Start drive detection**.

## Project structure

```
src/
  components/     Setup, garage, GPS help, install invite, gauge, stats, trip history, icons
  hooks/          GPS/motion tracker, vehicles, trip persistence
  lib/            detection, GPS math, permission helpers, totals, storage
public/           manifest, service worker, icons
```
