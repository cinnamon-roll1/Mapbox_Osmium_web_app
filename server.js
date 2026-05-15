import express from "express";
import path from "path";
import fs from "fs/promises";
import { existsSync } from "fs";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

const DATA_FILE = path.join(__dirname, "data", "czech-republic-latest.osm.pbf");
const EXPORT_DIR = path.join(__dirname, "exports");
const PUBLIC_DIR = path.join(__dirname, "public");
const SCRIPT_DIR = path.join(__dirname, "scripts");

if (!existsSync(DATA_FILE)) {
  console.error("Missing input file:", DATA_FILE);
  process.exit(1);
}

await fs.mkdir(EXPORT_DIR, { recursive: true });
await fs.mkdir(SCRIPT_DIR, { recursive: true });

app.use(express.json({ limit: "200mb" }));
app.use(express.static(PUBLIC_DIR));
app.use("/downloads", express.static(EXPORT_DIR));

const TOURISTIC_OSM_FILTERS = [
  // ---------------------------------------------------------------------------
  // Tourist / hiking route relations
  // ---------------------------------------------------------------------------
  "r/route=hiking",
  "r/route=foot",

  // Czech KČT tourist route colour tags
  "r/kct_red",
  "r/kct_blue",
  "r/kct_green",
  "r/kct_yellow",
  "r/kct_white",

  // Generic hiking-symbol tags
  "r/osmc:symbol",
  "r/colour",

  // ---------------------------------------------------------------------------
  // Roads, streets, paths, tracks, steps, crossings
  // Mapbox road source alternative
  // ---------------------------------------------------------------------------
  "nw/highway",

  // Useful road/path attributes
  "nw/foot",
  "nw/bicycle",
  "nw/horse",
  "nw/sac_scale",
  "nw/trail_visibility",
  "nw/surface",
  "nw/smoothness",
  "nw/tracktype",
  "nw/mtb:scale",
  "nw/cycleway",
  "nw/sidewalk",
  "nw/footway",

  // Road structures
  "nw/bridge",
  "nw/tunnel",
  "nw/ford",
  "nw/layer",

  // Crossings
  "n/highway=crossing",
  "w/highway=crossing",
  "w/footway=crossing",
  "nw/crossing",

  // Turning features
  "n/highway=turning_circle",
  "n/highway=turning_loop",
  "w/highway=turning_circle",
  "w/highway=turning_loop",

  // Construction roads
  "w/highway=construction",
  "w/construction",

  // Road polygons / pedestrian areas
  "w/area:highway",
  "w/area=yes",

  // ---------------------------------------------------------------------------
  // Railways
  // Mapbox major_rail / minor_rail alternative
  // ---------------------------------------------------------------------------
  "nw/railway",
  "nw/railway=rail",
  "nw/railway=light_rail",
  "nw/railway=tram",
  "nw/railway=subway",
  "nw/railway=narrow_gauge",
  "nw/railway=preserved",
  "nw/railway=station",
  "nw/railway=halt",
  "nw/railway=tram_stop",

  // ---------------------------------------------------------------------------
  // Aerialways
  // Mapbox aerialway layer alternative
  // ---------------------------------------------------------------------------
  "nw/aerialway",

  // ---------------------------------------------------------------------------
  // Ferries
  // ---------------------------------------------------------------------------
  "r/route=ferry",
  "w/route=ferry",
  "nw/ferry",

  // ---------------------------------------------------------------------------
  // Aeroways
  // Mapbox aeroway-line and aeroway-polygon alternatives
  // ---------------------------------------------------------------------------
  "nw/aeroway",
  "nw/aeroway=runway",
  "nw/aeroway=taxiway",
  "nw/aeroway=helipad",
  "nw/aeroway=apron",
  "nw/aeroway=aerodrome",

  // ---------------------------------------------------------------------------
  // Water features
  // Mapbox water and waterway alternatives
  // ---------------------------------------------------------------------------
  "nw/waterway",
  "nw/waterway=river",
  "nw/waterway=stream",
  "nw/waterway=canal",
  "nw/waterway=drain",
  "nw/waterway=ditch",
  "nw/waterway=riverbank",
  "nw/waterway=weir",
  "nw/waterway=dam",
  "nw/waterway=waterfall",

  "nwr/natural=water",
  "nwr/water",
  "nwr/water=lake",
  "nwr/water=pond",
  "nwr/water=reservoir",
  "nwr/water=river",
  "nwr/water=canal",
  "nwr/water=basin",
  "nwr/landuse=reservoir",
  "nwr/landuse=basin",

  // Wetlands
  "nwr/natural=wetland",
  "nwr/wetland",

  // ---------------------------------------------------------------------------
  // Landuse and landcover
  // Mapbox landuse / landcover alternatives
  // ---------------------------------------------------------------------------
  "nwr/landuse",
  "nwr/landcover",

  // Agriculture
  "nwr/landuse=farmland",
  "nwr/landuse=farmyard",
  "nwr/landuse=orchard",
  "nwr/landuse=vineyard",
  "nwr/landuse=meadow",
  "nwr/landuse=plant_nursery",

  // Forest / wood
  "nwr/natural=wood",
  "nwr/landuse=forest",

  // Grass / scrub / heath
  "nwr/landuse=grass",
  "nwr/natural=grassland",
  "nwr/natural=scrub",
  "nwr/natural=heath",

  // Rock / sand / bare surfaces
  "nwr/natural=bare_rock",
  "nwr/natural=rock",
  "nwr/natural=scree",
  "nwr/natural=sand",
  "nwr/natural=beach",
  "nwr/natural=dune",

  // Glacier, not very relevant for Czech Republic, but equivalent to Mapbox class
  "nwr/natural=glacier",

  // Parks and recreation
  "nwr/leisure=park",
  "nwr/leisure=garden",
  "nwr/leisure=recreation_ground",
  "nwr/leisure=nature_reserve",

  // Sport pitches
  "nwr/leisure=pitch",
  "nwr/sport",

  // Cemeteries
  "nwr/landuse=cemetery",
  "nwr/amenity=grave_yard",

  // Residential / commercial / industrial
  "nwr/landuse=residential",
  "nwr/landuse=commercial",
  "nwr/landuse=retail",
  "nwr/landuse=industrial",
  "nwr/landuse=quarry",

  // Schools and hospitals as landuse-like features
  "nwr/amenity=school",
  "nwr/amenity=university",
  "nwr/amenity=college",
  "nwr/amenity=kindergarten",
  "nwr/amenity=hospital",
  "nwr/healthcare=hospital",

  // ---------------------------------------------------------------------------
  // Protected areas and national parks
  // Mapbox national-park alternative
  // ---------------------------------------------------------------------------
  "wr/boundary=national_park",
  "r/boundary=national_park",
  "wr/boundary=protected_area",
  "r/boundary=protected_area",
  "nwr/leisure=nature_reserve",
  "nwr/protect_class",

  // ---------------------------------------------------------------------------
  // Administrative boundaries
  // Mapbox admin source alternative
  // ---------------------------------------------------------------------------
  "wr/boundary=administrative",
  "r/boundary=administrative",

  // Country borders and regional/local administrative boundaries
  "wr/admin_level=2",
  "r/admin_level=2",
  "wr/admin_level=4",
  "r/admin_level=4",
  "wr/admin_level=6",
  "r/admin_level=6",
  "wr/admin_level=7",
  "r/admin_level=7",
  "wr/admin_level=8",
  "r/admin_level=8",

  // Disputed boundaries, if present
  "nwr/disputed=yes",
  "wr/boundary=disputed",
  "r/boundary=disputed",

  // ---------------------------------------------------------------------------
  // Buildings and addresses
  // ---------------------------------------------------------------------------
  "nwr/building",
  "nwr/building:part",
  "nwr/entrance",
  "nwr/addr:housenumber",
  "nwr/addr:street",
  "nwr/addr:city",

  // ---------------------------------------------------------------------------
  // Places and labels
  // Mapbox place / settlement labels alternative
  // ---------------------------------------------------------------------------
  "n/place",
  "w/place",
  "r/place",

  // ---------------------------------------------------------------------------
  // POI features
  // Mapbox poi-label alternatives
  // ---------------------------------------------------------------------------
  "nwr/amenity",
  "nwr/tourism",
  "nwr/shop",
  "nwr/historic",
  "nwr/leisure",
  "nwr/sport",
  "nwr/healthcare",
  "nwr/emergency",
  "nwr/man_made",

  // Important natural POIs
  "nwr/natural=peak",
  "nwr/natural=cave_entrance",
  "nwr/natural=spring",
  "nwr/tourism=viewpoint",

  // Visitor amenities
  "nwr/amenity=toilets",
  "nwr/amenity=drinking_water",
  "nwr/amenity=shelter",
  "nwr/amenity=bench",
  "nwr/tourism=information",
  "nwr/tourism=picnic_site",
  "nwr/tourism=camp_site",

  // Food and drink
  "nwr/amenity=restaurant",
  "nwr/amenity=cafe",
  "nwr/amenity=fast_food",
  "nwr/amenity=pub",
  "nwr/amenity=bar",

  // Medical
  "nwr/amenity=pharmacy",
  "nwr/amenity=clinic",
  "nwr/amenity=doctors",
  "nwr/amenity=dentist",

  // Motorist amenities
  "nwr/amenity=fuel",
  "nwr/amenity=parking",
  "nwr/amenity=charging_station",
  "nwr/amenity=car_wash",

  // ---------------------------------------------------------------------------
  // Public transport
  // ---------------------------------------------------------------------------
  "nw/public_transport",
  "n/highway=bus_stop",
  "nw/amenity=bus_station",
  "nw/railway=station",
  "nw/railway=halt",
  "nw/railway=tram_stop",

  // ---------------------------------------------------------------------------
  // Barriers, fences, gates, hedges
  // Mapbox gate-fence-hedge alternative
  // ---------------------------------------------------------------------------
  "nw/barrier",
  "nw/barrier=gate",
  "nw/barrier=fence",
  "nw/barrier=hedge",
  "nw/barrier=wall",
  "nw/barrier=retaining_wall",

  // ---------------------------------------------------------------------------
  // Land / coastal structures
  // Approximation of Mapbox structure class = land
  // ---------------------------------------------------------------------------
  "nw/man_made=pier",
  "nw/man_made=breakwater",
  "nw/man_made=groyne",
  "nw/man_made=embankment",
  "nw/embankment=yes"
];

const WATER_OSM_FILTERS = [
  // ---------------------------------------------------------------------------
  // Main water lines
  // ---------------------------------------------------------------------------
  "nw/waterway=river",
  "nw/waterway=stream",
  "nw/waterway=canal",
  "nw/waterway=drain",
  "nw/waterway=ditch",
  "nw/waterway=riverbank",

  // ---------------------------------------------------------------------------
  // Water polygons
  // ---------------------------------------------------------------------------
  "nwr/natural=water",
  "nwr/water",
  "nwr/water=lake",
  "nwr/water=pond",
  "nwr/water=reservoir",
  "nwr/water=river",
  "nwr/water=canal",
  "nwr/water=basin",
  "nwr/landuse=reservoir",
  "nwr/landuse=basin",

  // ---------------------------------------------------------------------------
  // Water-related structures
  // Weirs are not included here because they are exported separately
  // and then merged into the final file.
  // ---------------------------------------------------------------------------
  "nw/waterway=dam",
  "nw/waterway=waterfall",
  "nw/waterway=lock_gate",
  "nw/waterway=sluice_gate",

  "nw/man_made=pier",
  "nw/man_made=breakwater",
  "nw/man_made=groyne",
  "nw/man_made=embankment",
  "nw/embankment=yes",

  // ---------------------------------------------------------------------------
  // Wetlands
  // ---------------------------------------------------------------------------
  "nwr/natural=wetland",
  "nwr/wetland",

  // ---------------------------------------------------------------------------
  // Ferries and water transport
  // ---------------------------------------------------------------------------
  "r/route=ferry",
  "w/route=ferry",
  "nw/ferry",

  // ---------------------------------------------------------------------------
  // Landuse / landcover visible in the water style
  // ---------------------------------------------------------------------------
  "nwr/landuse",
  "nwr/natural",

  "nwr/landuse=forest",
  "nwr/natural=wood",
  "nwr/natural=scrub",
  "nwr/natural=grassland",
  "nwr/landuse=grass",
  "nwr/landuse=farmland",
  "nwr/landuse=meadow",
  "nwr/landuse=orchard",
  "nwr/landuse=vineyard",

  "nwr/leisure=park",
  "nwr/leisure=garden",
  "nwr/leisure=pitch",
  "nwr/leisure=nature_reserve",
  "nwr/sport",

  // ---------------------------------------------------------------------------
  // Roads, paths, bridges, tunnels near water
  // ---------------------------------------------------------------------------
  "nw/highway",
  "nw/bridge",
  "nw/tunnel",
  "nw/ford",
  "nw/layer",
  "nw/oneway",

  "w/highway=path",
  "w/highway=footway",
  "w/highway=cycleway",
  "w/highway=bridleway",
  "w/highway=pedestrian",
  "w/highway=steps",
  "w/highway=track",
  "w/highway=service",
  "w/highway=residential",
  "w/highway=unclassified",

  "nw/foot",
  "nw/bicycle",
  "nw/horse",
  "nw/sac_scale",
  "nw/trail_visibility",
  "nw/surface",
  "nw/smoothness",
  "nw/tracktype",

  // ---------------------------------------------------------------------------
  // Buildings, places, POI and labels
  // ---------------------------------------------------------------------------
  "nwr/building",
  "nwr/building:part",
  "nwr/entrance",
  "nwr/addr:housenumber",

  "n/place",
  "w/place",
  "r/place",

  "nwr/amenity",
  "nwr/tourism",
  "nwr/shop",
  "nwr/historic",
  "nwr/leisure",
  "nwr/healthcare",
  "nwr/emergency",
  "nwr/man_made",

  "nwr/natural=peak",
  "nwr/natural=spring",
  "nwr/natural=cave_entrance",
  "nwr/tourism=viewpoint",

  // ---------------------------------------------------------------------------
  // Administrative boundaries
  // ---------------------------------------------------------------------------
  "nwr/boundary=administrative",
  "r/boundary=administrative",
  "nwr/admin_level=2",
  "r/admin_level=2",
  "nwr/admin_level=4",
  "r/admin_level=4",
  "nwr/admin_level=6",
  "r/admin_level=6",
  "nwr/admin_level=7",
  "r/admin_level=7",
  "nwr/admin_level=8",
  "r/admin_level=8"
];

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        reject(new Error(`${command} failed with code ${code}\n${stderr}`));
      }
    });
  });
}

function parseBbox(raw) {
  if (Array.isArray(raw)) return raw.map(Number);
  if (typeof raw === "string") return raw.split(",").map(Number);
  return null;
}

function isValidBbox(bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return false;

  const [west, south, east, north] = bbox.map(Number);

  if ([west, south, east, north].some((n) => Number.isNaN(n))) return false;
  if (west >= east) return false;
  if (south >= north) return false;
  if (south < -90 || north > 90) return false;
  if (west < -180 || east > 180) return false;

  return true;
}

function isValidKind(kind) {
  return kind === "hiking" || kind === "weirs";
}

function isValidStyle(style) {
  return style === "topographic" || style === "touristic" || style === "water";
}

async function cleanup(files) {
  for (const file of files) {
    if (!file) continue;
    await fs.unlink(file).catch(() => {});
  }
}

async function createFilteredPbf({ bbox, kind, outputFile }) {
  const [west, south, east, north] = bbox;
  const stamp = Date.now();
  const cutFile = path.join(EXPORT_DIR, `cut_${stamp}.osm.pbf`);

  try {
    if (kind === "hiking") {
      await runCommand("osmium", [
        "extract",
        `--bbox=${west},${south},${east},${north}`,
        "--strategy=smart",
        "-S",
        "types=route",
        DATA_FILE,
        "-o",
        cutFile,
        "--overwrite"
      ]);

      await runCommand("osmium", [
        "tags-filter",
        cutFile,
        "r/route=hiking",
        "r/route=foot",
        "-o",
        outputFile,
        "--overwrite"
      ]);
    } else if (kind === "weirs") {
      await runCommand("osmium", [
        "extract",
        `--bbox=${west},${south},${east},${north}`,
        "--strategy=complete_ways",
        DATA_FILE,
        "-o",
        cutFile,
        "--overwrite"
      ]);

      await runCommand("osmium", [
        "tags-filter",
        cutFile,
        "nw/waterway=weir",
        "-o",
        outputFile,
        "--overwrite"
      ]);
    } else {
      throw new Error("Invalid kind");
    }
  } finally {
    await cleanup([cutFile]);
  }
}

async function createTouristicPbf({ bbox, outputFile }) {
  const [west, south, east, north] = bbox;
  const stamp = Date.now();
  const cutFile = path.join(EXPORT_DIR, `touristic_cut_${stamp}.osm.pbf`);

  try {
    await runCommand("osmium", [
      "extract",
      `--bbox=${west},${south},${east},${north}`,
      "--strategy=smart",
      DATA_FILE,
      "-o",
      cutFile,
      "--overwrite"
    ]);

    await runCommand("osmium", [
      "tags-filter",
      cutFile,
      ...TOURISTIC_OSM_FILTERS,
      "-o",
      outputFile,
      "--overwrite"
    ]);
  } finally {
    await cleanup([cutFile]);
  }
}

async function createWaterPbf({ bbox, outputFile }) {
  const [west, south, east, north] = bbox;
  const stamp = Date.now();
  const cutFile = path.join(EXPORT_DIR, `water_cut_${stamp}.osm.pbf`);

  try {
    await runCommand("osmium", [
      "extract",
      `--bbox=${west},${south},${east},${north}`,
      "--strategy=complete_ways",
      DATA_FILE,
      "-o",
      cutFile,
      "--overwrite"
    ]);

    await runCommand("osmium", [
      "tags-filter",
      cutFile,
      ...WATER_OSM_FILTERS,
      "-o",
      outputFile,
      "--overwrite"
    ]);
  } finally {
    await cleanup([cutFile]);
  }
}

async function readGeojson(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  return JSON.parse(raw);
}

async function writeGeojson(filePath, geojson) {
  await fs.writeFile(
    filePath,
    JSON.stringify(geojson, null, 2),
    "utf8"
  );
}

function decodeImageDataUrl(dataUrl) {
  const match = /^data:image\/(png|jpeg);base64,(.+)$/.exec(dataUrl || "");

  if (!match) {
    throw new Error("Invalid image data URL");
  }

  return {
    extension: match[1] === "jpeg" ? "jpg" : "png",
    buffer: Buffer.from(match[2], "base64")
  };
}

function lonLatToWebMercator(lon, lat) {
  const maxLat = 85.05112878;
  const clampedLat = Math.max(Math.min(lat, maxLat), -maxLat);

  const radius = 6378137;
  const x = radius * lon * Math.PI / 180;
  const y =
    radius *
    Math.log(Math.tan(Math.PI / 4 + clampedLat * Math.PI / 360));

  return [x, y];
}

function mergeFeatureCollections(...collections) {
  return {
    type: "FeatureCollection",
    features: collections.flatMap((collection) => {
      if (!collection || !Array.isArray(collection.features)) {
        return [];
      }

      return collection.features;
    })
  };
}

async function createTouristicGeojson({ bbox, outputFile }) {
  const stamp = Date.now();

  const touristicPbf = path.join(EXPORT_DIR, `touristic_${stamp}.osm.pbf`);
  const touristicGeojson = path.join(EXPORT_DIR, `touristic_${stamp}.geojson`);

  const hikingPbf = path.join(EXPORT_DIR, `hiking_routes_${stamp}.osm.pbf`);
  const hikingGeojson = path.join(EXPORT_DIR, `hiking_routes_${stamp}.geojson`);

  try {
    // 1) Turistický podklad podle TOURISTIC_OSM_FILTERS
    await createTouristicPbf({
      bbox,
      outputFile: touristicPbf
    });

    await runCommand("osmium", [
      "export",
      touristicPbf,
      "-o",
      touristicGeojson,
      "--overwrite"
    ]);

    // 2) Barevné KČT turistické trasy přes vlastní Python skript
    await createFilteredPbf({
      bbox,
      kind: "hiking",
      outputFile: hikingPbf
    });

    await runCommand("python3", [
      path.join(SCRIPT_DIR, "hiking_to_geojson.py"),
      hikingPbf,
      hikingGeojson
    ]);

    const baseData = await readGeojson(touristicGeojson);
    const hikingData = await readGeojson(hikingGeojson);

    // 3) Spojení do jednoho GeoJSONu
    const merged = mergeFeatureCollections(baseData, hikingData);

    await writeGeojson(outputFile, merged);
  } finally {
    await cleanup([
      touristicPbf,
      touristicGeojson,
      hikingPbf,
      hikingGeojson
    ]);
  }
}

async function createWaterGeojson({ bbox, outputFile }) {
  const stamp = Date.now();

  const waterPbf = path.join(EXPORT_DIR, `water_${stamp}.osm.pbf`);
  const waterGeojson = path.join(EXPORT_DIR, `water_${stamp}.geojson`);

  const weirsPbf = path.join(EXPORT_DIR, `weirs_${stamp}.osm.pbf`);
  const weirsGeojson = path.join(EXPORT_DIR, `weirs_${stamp}.geojson`);

  try {
    // 1) Water base data according to WATER_OSM_FILTERS
    await createWaterPbf({
      bbox,
      outputFile: waterPbf
    });

    await runCommand("osmium", [
      "export",
      waterPbf,
      "-o",
      waterGeojson,
      "--overwrite"
    ]);

    // 2) Dedicated weir data
    await createFilteredPbf({
      bbox,
      kind: "weirs",
      outputFile: weirsPbf
    });

    await runCommand("osmium", [
      "export",
      weirsPbf,
      "-o",
      weirsGeojson,
      "--overwrite"
    ]);

    // 3) Merge water base + weirs
    const waterData = await readGeojson(waterGeojson);
    const weirsData = await readGeojson(weirsGeojson);

    const merged = mergeFeatureCollections(waterData, weirsData);

    await writeGeojson(outputFile, merged);
  } finally {
    await cleanup([
      waterPbf,
      waterGeojson,
      weirsPbf,
      weirsGeojson
    ]);
  }
}

app.get("/api/preview", async (req, res) => {
  const kind = req.query.kind;
  const bbox = parseBbox(req.query.bbox);

  if (!isValidKind(kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }

  if (!isValidBbox(bbox)) {
    return res.status(400).json({ error: "Invalid bbox" });
  }

  const stamp = Date.now();
  const filteredFile = path.join(EXPORT_DIR, `preview_${kind}_${stamp}.osm.pbf`);
  const geojsonFile = path.join(EXPORT_DIR, `preview_${kind}_${stamp}.geojson`);

  try {
    await createFilteredPbf({ bbox, kind, outputFile: filteredFile });

    if (kind === "weirs") {
      await runCommand("osmium", [
        "export",
        filteredFile,
        "-o",
        geojsonFile,
        "--overwrite"
      ]);
    } else {
      await runCommand("python3", [
        path.join(SCRIPT_DIR, "hiking_to_geojson.py"),
        filteredFile,
        geojsonFile
      ]);
    }

    const raw = await fs.readFile(geojsonFile, "utf8");
    const geojson = JSON.parse(raw);

    res.json(geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Preview failed",
      details: error.message
    });
  } finally {
    await cleanup([filteredFile, geojsonFile]);
  }
});

app.post("/api/download-geojson", async (req, res) => {
  const {
    kind,
    bbox,
    style,
    includeTouristicBase,
    includeWaterBase
  } = req.body;

  if (!isValidKind(kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }

  if (!isValidBbox(bbox)) {
    return res.status(400).json({ error: "Invalid bbox" });
  }

  if (style && !isValidStyle(style)) {
    return res.status(400).json({ error: "Invalid style" });
  }

  const stamp = Date.now();

  const shouldExportTouristicGeojson =
    style === "touristic" &&
    kind === "hiking" &&
    includeTouristicBase === true;

  const shouldExportWaterGeojson =
    style === "water" &&
    kind === "weirs" &&
    includeWaterBase === true;

  const outputName = shouldExportTouristicGeojson
    ? `touristic_hiking_${stamp}.geojson`
    : shouldExportWaterGeojson
      ? `water_weirs_${stamp}.geojson`
      : `${kind}_${stamp}.geojson`;

  const outputFile = path.join(EXPORT_DIR, outputName);
  const tempPbfFile = path.join(EXPORT_DIR, `${kind}_${stamp}.osm.pbf`);

  let success = false;

  try {
    if (shouldExportTouristicGeojson) {
      await createTouristicGeojson({
        bbox,
        outputFile
      });
    } else if (shouldExportWaterGeojson) {
      await createWaterGeojson({
        bbox,
        outputFile
      });
    } else {
      await createFilteredPbf({
        bbox,
        kind,
        outputFile: tempPbfFile
      });

      if (kind === "hiking") {
        await runCommand("python3", [
          path.join(SCRIPT_DIR, "hiking_to_geojson.py"),
          tempPbfFile,
          outputFile
        ]);
      } else if (kind === "weirs") {
        await runCommand("osmium", [
          "export",
          tempPbfFile,
          "-o",
          outputFile,
          "--overwrite"
        ]);
      }
    }

    success = true;

    res.json({
      ok: true,
      downloadUrl: `/downloads/${path.basename(outputFile)}`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "GeoJSON download failed",
      details: error.message
    });
  } finally {
    await cleanup([tempPbfFile]);

    if (!success) {
      await cleanup([outputFile]);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});