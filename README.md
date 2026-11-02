# VIT Chennai PathFinder

VIT Chennai PathFinder is a multilingual campus navigation web app. Select a language, choose a starting point and destination, and open a walking route in Google Maps.

## Features

- GPS-based location detection when supported by the browser
- Walking directions through Google Maps
- Leaflet/OpenStreetMap campus map
- English, Hindi, Tamil, Kannada, Punjabi, Marathi, and Malayalam translations
- Responsive layout for desktop and mobile screens

## Run locally

The app is static and must be served over HTTP. Opening the HTML files directly with `file://` can prevent `fetch` and geolocation from working.

```bash
cd "DSA Project"
npm run check
python -m http.server 8000
```

Then open <http://localhost:8000>.

You can also open `DSA Project/index.html` with the VS Code Live Server extension. The included workspace settings use port `5501`.

## GitHub Pages

1. Open **Settings → Pages**.
2. Select **Deploy from a branch**.
3. Select `main` and the `/ (root)` folder.
4. Save and open the generated Pages URL.

The site must be served from the `DSA Project` folder. GitHub Pages geolocation works because Pages provides HTTPS.

## Project structure

```text
DSA Project/
├── index.html          Language selection page
├── pathFinder.html     Main navigation interface
├── main.js             GPS and Google Maps logic
├── i18n.js             Translation loading
├── cordinates.json     Campus location data
└── locale/             Translation files
```

The app uses Tailwind CSS, Leaflet, and translation libraries from public CDNs, so an internet connection is required.

## License

This project is available under the [MIT License](./LICENSE).
