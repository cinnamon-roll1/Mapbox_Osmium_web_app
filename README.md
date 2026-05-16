# Mapbox Osmium Web App

Web application for preview selected OpenStreetMap data in Mapbox in predefined map styles and exporting the current map selection from OpenStreetMap data to GeoJSON.

This app was made as a part of bachelors thesis "Web tool for extraction and styling open-source map data" (CTU, Faculty of Civil Engineering, branch Geodesy and Cartography). 

Last update: 16.5.2026

## Requirements

- Node.js
- npm
- Python 3
- Osmium Tool
- Python "osmium" package

## Setup

Web browser: while testing the app, the Google Chrome browser was used (version 146.0.7680.178)

Before installing any of those tools, try these commands: "node --version", "npm --version", ...
If its already installed, the version number would be shown. If its not installed, the install them :)

### macOS

1. Install Node.js from: https://nodejs.org/
2. Install Python3 from: https://www.python.org/downloads/
3. Install Homebrew: https://brew.sh/
4. Install Osmium tool through Terminal: brew install osmium-tool
5. Install the Python Osmium package through Terminal: python3 -m pip install osmium
6. Go to your project folder through Terminal: cd /Users/your_name/.../folder_name (or just write cd and then drag and drop your folder)
7. Install Node dependencies through Terminal: npm install
8. Download the OpenStreetMap file in format osm.pbf (from Geofabrik), name it "czech-republic-latest", place it in Data folder
9. Start the application through Terminal: npm start
10. Open the app in the browser: http://localhost:3000

### Windows
1. Install Node.js from: https://nodejs.org/
2. Install Python3 from: https://www.python.org/downloads/ , during instalation enable "Add Python to PATH"
3. Install Conda/Mamba: https://conda-forge.org/download/
4. Install Osmium tool through CW: conda install conda-forge::osmium-tool
5. Install the Python Osmium package through CW: python -m pip install osmium
6. Go to your project folder through CW: cd C:\Users\your_name\...\folder_name
7. Install Node dependencies through CW: npm install
8. Download the OpenStreetMap file in format osm.pbf (from Geofabrik), name it "czech-republic-latest", place it in Data folder
9. Start the application through CW: npm start
10. Open the app in the browser: http://localhost:3000
