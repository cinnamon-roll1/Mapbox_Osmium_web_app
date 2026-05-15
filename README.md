# BP Mapbox Osmium

Web application for previewing selected OpenStreetMap data in Mapbox and exporting the current map selection as GeoJSON.

## Requirements

- Node.js
- npm
- Python 3
- Osmium Tool
- Python `osmium` package

## Setup

Install Node dependencies:

```bash
npm install
```

Install the Python dependency:

```bash
python3 -m pip install osmium
```

Install Osmium Tool:

```bash
brew install osmium-tool
```

## Required OSM data file

The application needs a local OpenStreetMap PBF extract, but this file is not included in the GitHub repository because it is very large.

Download the Czech Republic extract manually, then place it here:

```text
data/czech-republic-latest.osm.pbf
```

For example, download it from Geofabrik:

```text
https://download.geofabrik.de/europe/czech-republic-latest.osm.pbf
```

## Run

Start the server:

```bash
npm start
```

Open the app in a browser:

```text
http://localhost:3000
```

