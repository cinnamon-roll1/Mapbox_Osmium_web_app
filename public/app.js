const statusEl = document.getElementById("status");
const bboxEl = document.getElementById("bbox");

const styleTopographicBtn = document.getElementById("styleTopographicBtn");
const styleTouristicBtn = document.getElementById("styleTouristicBtn");
const styleWaterBtn = document.getElementById("styleWaterBtn");

const showHikingBtn = document.getElementById("showHikingBtn");
const showWeirsBtn = document.getElementById("showWeirsBtn");
const downloadGeojsonBtn = document.getElementById("downloadGeojsonBtn");
const clearBtn = document.getElementById("clearBtn");

mapboxgl.accessToken = "pk.eyJ1IjoibGlhc2htYWkiLCJhIjoiY21uMXRwZTFsMGpnYzJycGR0c3A4d3A5YiJ9.OejD6fae7WWDAb0neiLF4g";

const styles = {
  topographic: "mapbox://styles/liashmai/cmoijv7jl002901qz1orl107p",
  touristic: "mapbox://styles/liashmai/cmol9lrib002501r0e6940b6o",
  water: "mapbox://styles/liashmai/cmocob890000501sbcglkbu14"
};

let currentStyleName = "topographic";
let currentSelection = null;

let currentPreviewData = {
  type: "FeatureCollection",
  features: []
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch (error) {
    console.error("Server returned non-JSON response:", text);

    throw new Error(
      `Server did not return JSON. HTTP status: ${response.status}. ` +
      `Check whether the API endpoint exists in server.js.`
    );
  }

  if (!response.ok) {
    throw new Error(
      data.details ||
      data.error ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}

const map = new mapboxgl.Map({
  container: "map",
  style: styles.topographic,
  center: [15.4, 49.8],
  zoom: 8,
});

function getCurrentBbox() {
  const b = map.getBounds();

  return [
    b.getWest(),
    b.getSouth(),
    b.getEast(),
    b.getNorth()
  ];
}

function bboxToString(bbox) {
  return bbox.map(n => n.toFixed(6)).join(",");
}

function updateBboxText() {
  const bbox = getCurrentBbox();
  const zoom = map.getZoom();

  bboxEl.textContent =
    `bbox: ${bboxToString(bbox)} | zoom: ${zoom.toFixed(2)} | style: ${currentStyleName} | selection: ${currentSelection || "none"}`;
}

function ensurePreviewSource() {
  if (!map.getSource("preview")) {
    map.addSource("preview", {
      type: "geojson",
      data: currentPreviewData
    });

    map.addLayer({
      id: "preview-lines",
      type: "line",
      source: "preview",
      filter: [
        "match",
        ["geometry-type"],
        ["LineString", "MultiLineString"],
        true,
        false
      ],
      paint: {
        "line-color": [
          "case",

          // Weirs
          ["==", ["get", "waterway"], "weir"],
          "#023e5f",

          // Hiking routes by KČT color
          ["==", ["get", "kct_color"], "red"],
          "#e53935",

          ["==", ["get", "kct_color"], "blue"],
          "#1e88e5",

          ["==", ["get", "kct_color"], "green"],
          "#43a047",

          ["==", ["get", "kct_color"], "yellow"],
          "#fdd835",

          ["==", ["get", "kct_color"], "white"],
          "#ffffff",

          // Fallback: use generated GeoJSON stroke/color if available
          [
            "coalesce",
            ["get", "stroke"],
            ["get", "color"],
            "#666666"
          ]
        ],

        "line-width": [
          "case",

          // Weirs thinner
          ["==", ["get", "waterway"], "weir"],
          4,

          // Hiking route width from GeoJSON, otherwise 4
          [
            "coalesce",
            ["get", "stroke-width"],
            4
          ]
        ],

        "line-opacity": 0.9
      }
    });

    map.addLayer({
      id: "preview-points",
      type: "circle",
      source: "preview",
      filter: [
        "match",
        ["geometry-type"],
        ["Point", "MultiPoint"],
        true,
        false
      ],
      paint: {
        "circle-radius": 5,
        "circle-color": [
          "case",

          // Weir points
          ["==", ["get", "waterway"], "weir"],
          "#004266",

          // Default point color
          "#2c7bb6"
        ],
        "circle-stroke-color": "#000000",
        "circle-stroke-width": 1
      }
    });
  }
}

function changeMapStyle(styleName) {
  if (!styles[styleName]) return;

  currentStyleName = styleName;
  updateBboxText();

  statusEl.textContent = `Changing style to ${styleName}...`;

  map.setStyle(styles[styleName]);
}

function clearPreview() {
  currentPreviewData = {
    type: "FeatureCollection",
    features: []
  };

  const src = map.getSource("preview");

  if (src) {
    src.setData(currentPreviewData);
  }

  currentSelection = null;
  updateBboxText();
  statusEl.textContent = "Cleared";
}

async function loadPreview(kind) {
  try {
    currentSelection = kind;
    updateBboxText();
    statusEl.textContent = `Loading ${kind}...`;

    const bbox = getCurrentBbox();

    const url =
      `/api/preview?kind=${encodeURIComponent(kind)}` +
      `&bbox=${encodeURIComponent(bbox.join(","))}`;

    const response = await fetch(url);
    const geojson = await response.json();

    if (!response.ok) {
      throw new Error(
        geojson.details ||
        geojson.error ||
        "Preview failed"
      );
    }

    currentPreviewData = geojson;

    ensurePreviewSource();

    map.getSource("preview").setData(currentPreviewData);

    statusEl.textContent = `Showing ${kind}`;
  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error";
    alert(error.message);
  }
}

async function downloadGeojsonSelection() {
  try {
    if (!currentSelection) {
      alert("First choose Show hiking routes or Show weirs.");
      return;
    }

    const includeTouristicBase =
      currentStyleName === "touristic" &&
      currentSelection === "hiking";

    const includeWaterBase =
      currentStyleName === "water" &&
      currentSelection === "weirs";

    statusEl.textContent = includeTouristicBase
      ? "Preparing touristic GeoJSON with hiking routes..."
      : includeWaterBase
        ? "Preparing water GeoJSON with weirs..."
        : "Preparing GeoJSON...";

    const bbox = getCurrentBbox();

    const data = await fetchJson("/api/download-geojson", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        kind: currentSelection,
        bbox,
        style: currentStyleName,
        includeTouristicBase,
        includeWaterBase
      })
    });

    statusEl.textContent = "GeoJSON ready";
    window.location.href = data.downloadUrl;

  } catch (error) {
    console.error(error);
    statusEl.textContent = "Error";
    alert(error.message);
  }
}

map.on("load", () => {
  ensurePreviewSource();
  updateBboxText();
});

map.on("style.load", () => {
  ensurePreviewSource();

  const src = map.getSource("preview");

  if (src) {
    src.setData(currentPreviewData);
  }

  updateBboxText();
  statusEl.textContent = "Style loaded";
});

map.on("moveend", updateBboxText);

styleTopographicBtn.addEventListener("click", () =>
  changeMapStyle("topographic")
);

styleTouristicBtn.addEventListener("click", () =>
  changeMapStyle("touristic")
);

styleWaterBtn.addEventListener("click", () =>
  changeMapStyle("water")
);

showHikingBtn.addEventListener("click", () =>
  loadPreview("hiking")
);

showWeirsBtn.addEventListener("click", () =>
  loadPreview("weirs")
);

downloadGeojsonBtn.addEventListener("click", downloadGeojsonSelection);

clearBtn.addEventListener("click", clearPreview);