import express from "express";                      // for server and api 
import path from "path";                            // for working with file paths
import fs from "fs/promises";                       // for working with await and async
import { existsSync } from "fs";                    // for checking if file or folder exist 
import { fileURLToPath } from "url";                // to convert file URL to normal file path 
import { execFile } from "child_process";           // for running external programs 

const __filename = fileURLToPath(import.meta.url);  // path to server.js
const __dirname = path.dirname(__filename);         // path to the project folder 

const app = express();                              // to create Express server
const PORT = 3000;                                  // where the server runs

const DATA_FILE = path.join(__dirname, "data", "czech-republic-latest.osm.pbf");  // where osm.pbf data file is located
const EXPORT_DIR = path.join(__dirname, "exports");                               // where Export folder is located
const PUBLIC_DIR = path.join(__dirname, "public");                                // where Public folder is located
const SCRIPT_DIR = path.join(__dirname, "scripts");                               // where Sripts folder is located

// if osm.pbf data file does not exist, displays Error
if (!existsSync(DATA_FILE)) {
  console.error("Missing input file:", DATA_FILE);
  process.exit(1);                                                                // stops the server 
}

app.use(express.json({ limit: "200mb" }));                                        // requests up to 200MB
app.use(express.static(PUBLIC_DIR));                                              // opening files from Public folder + API routes from server 
app.use("/downloads", express.static(EXPORT_DIR));                                // allowing exported files to be downloaded

const TOURISTIC_OSM_FILTERS = [
// Hiking routes relations
  "r/route=hiking",
  "r/route=foot",
// KCT colours of hiking routes
  "r/kct_red",
  "r/kct_blue",
  "r/kct_green",
  "r/kct_yellow",
  "r/kct_white",
// 
  "r/osmc:symbol",
  "r/colour",
// Roads, streets, paths, tracks, steps, crossings (Mapbox road source)
  "nw/highway",
// Roads/paths attributes
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
// Turnings
  "n/highway=turning_circle",
  "n/highway=turning_loop",
  "w/highway=turning_circle",
  "w/highway=turning_loop",
// Construction
  "w/highway=construction",
  "w/construction",
// Road polygons and/or pedestrian areas
  "w/area:highway",
  "w/area=yes",
// Railways (Mapbox major_rail, minor_rail)
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
// Aerialway
  "nw/aerialway",
// Ferry
  "r/route=ferry",
  "w/route=ferry",
  "nw/ferry",
// Aeroway
  "nw/aeroway",
  "nw/aeroway=runway",
  "nw/aeroway=taxiway",
  "nw/aeroway=helipad",
  "nw/aeroway=apron",
  "nw/aeroway=aerodrome",
// Waterway
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
// Water
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
// Landuse and Landcover
  "nwr/landuse",
  "nwr/landcover",
// Agriculture
  "nwr/landuse=farmland",
  "nwr/landuse=farmyard",
  "nwr/landuse=orchard",
  "nwr/landuse=vineyard",
  "nwr/landuse=meadow",
  "nwr/landuse=plant_nursery",
// Forest, wood
  "nwr/natural=wood",
  "nwr/landuse=forest",
// Grass, scrub, heath
  "nwr/landuse=grass",
  "nwr/natural=grassland",
  "nwr/natural=scrub",
  "nwr/natural=heath",
// Rock, sand, ...
  "nwr/natural=bare_rock",
  "nwr/natural=rock",
  "nwr/natural=scree",
  "nwr/natural=sand",
  "nwr/natural=beach",
  "nwr/natural=dune",
// Glacier
  "nwr/natural=glacier",
// Parks, recreations
  "nwr/leisure=park",
  "nwr/leisure=garden",
  "nwr/leisure=recreation_ground",
  "nwr/leisure=nature_reserve",
// Sport
  "nwr/leisure=pitch",
  "nwr/sport",
// Cemetries
  "nwr/landuse=cemetery",
  "nwr/amenity=grave_yard",
// Residential, commercial, industrial
  "nwr/landuse=residential",
  "nwr/landuse=commercial",
  "nwr/landuse=retail",
  "nwr/landuse=industrial",
  "nwr/landuse=quarry",
// Education, healthcare
  "nwr/amenity=school",
  "nwr/amenity=university",
  "nwr/amenity=college",
  "nwr/amenity=kindergarten",
  "nwr/amenity=hospital",
  "nwr/healthcare=hospital",
// National parks, protected areas
  "wr/boundary=national_park",
  "r/boundary=national_park",
  "wr/boundary=protected_area",
  "r/boundary=protected_area",
  "nwr/leisure=nature_reserve",
  "nwr/protect_class",
// Administrative boundaries
  "wr/boundary=administrative",
  "r/boundary=administrative",
// Country and regional borders
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
// Disputed borders
  "nwr/disputed=yes",
  "wr/boundary=disputed",
  "r/boundary=disputed",
// Buildings, adresses
  "nwr/building",
  "nwr/building:part",
  "nwr/entrance",
  "nwr/addr:housenumber",
  "nwr/addr:street",
  "nwr/addr:city",
// Places and settlements
  "n/place",
  "w/place",
  "r/place",
// Points of interest (for touristic map)
  "nwr/shop=bakery",
  "nwr/shop=convenience",
  "nwr/shop=food",
  "nwr/shop=pastry",
  "nwr/shop=supermarket",
  "nwr/historic",
  "nwr/leisure",
  "nwr/natural=peak",
  "nwr/natural=cave_entrance",
  "nwr/natural=spring",
  "nwr/tourism=viewpoint",
  "nwr/amenity=toilets",
  "nwr/amenity=drinking_water",
  "nwr/amenity=shelter",
  "nwr/amenity=bench",
  "nwr/tourism=information",
  "nwr/tourism=picnic_site",
  "nwr/tourism=camp_site",
  "nwr/amenity=restaurant",
  "nwr/amenity=cafe",
  "nwr/amenity=fast_food",
  "nwr/amenity=pub",
  "nwr/amenity=bar",
  "nwr/amenity=pharmacy",
  "nwr/amenity=clinic",
  "nwr/amenity=doctors",
  "nwr/amenity=dentist",
  "nwr/amenity=fuel",
  "nwr/amenity=parking",
  "nwr/amenity=charging_station",
  "nwr/amenity=car_wash",
// Public Transport 
  "nw/public_transport",
  "n/highway=bus_stop",
  "nw/amenity=bus_station",
  "nw/railway=station",
  "nw/railway=halt",
  "nw/railway=tram_stop",
// Gate, fence, hedge
  "nw/barrier",
  "nw/barrier=gate",
  "nw/barrier=fence",
  "nw/barrier=hedge",
  "nw/barrier=wall",
  "nw/barrier=retaining_wall",
// Land structures 
  "nw/man_made=pier",
  "nw/man_made=breakwater",
  "nw/man_made=groyne",
  "nw/man_made=embankment",
  "nw/embankment=yes"
];

const WATER_OSM_FILTERS = [
// Waterway
  "nw/waterway=river",
  "nw/waterway=stream",
  "nw/waterway=canal",
  "nw/waterway=drain",
  "nw/waterway=ditch",
  "nw/waterway=riverbank",
// Water 
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
// Water structures (without weirs, those are imported separately)
  "nw/waterway=dam",
  "nw/waterway=waterfall",
  "nw/waterway=lock_gate",
  "nw/waterway=sluice_gate",
  "nw/man_made=pier",
  "nw/man_made=breakwater",
  "nw/man_made=groyne",
  "nw/man_made=embankment",
  "nw/embankment=yes",
// Wetland
  "nwr/natural=wetland",
  "nwr/wetland",
// Ferry
  "r/route=ferry",
  "w/route=ferry",
  "nw/ferry",
// Landuse, landcover
  "nwr/landuse",
  "nwr/landuse=forest",
  "nwr/landuse=grass",
  "nwr/landuse=farmland",
  "nwr/landuse=meadow",
  "nwr/landuse=orchard",
  "nwr/landuse=vineyard",
  "nwr/natural",
  "nwr/natural=wood",
  "nwr/natural=scrub",
  "nwr/natural=grassland",
  "nwr/leisure=park",
  "nwr/leisure=garden",
  "nwr/leisure=pitch",
  "nwr/leisure=nature_reserve",
// Roads, paths, bridges, tunnels
  "nw/highway",
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
  "nw/bridge",
  "nw/tunnel",
  "nw/ford",
  "nw/layer",
  "nw/oneway",
  "nw/foot",
  "nw/bicycle",
  "nw/horse",
  "nw/sac_scale",
  "nw/trail_visibility",
  "nw/surface",
  "nw/smoothness",
  "nw/tracktype",
// Buldings, addresses
  "nwr/building",
  "nwr/building:part",
  "nwr/entrance",
  "nwr/addr:housenumber",
// Places and settlements
  "n/place",
  "w/place",
  "r/place",
// Points of interest
  "nwr/amenity=bar",
  "nwr/amenity=biergarten",
  "nwr/amenity=cafe",
  "nwr/amenity=fast_food",
  "nwr/amenity=pub",
  "nwr/amenity=restaurant",
  "nwr/amenity=boat_rental",
  "nwr/amenity=boat_storage",
  "nwr/amenity=boat_sharing",
  "nwr/amenity=hospital",
  "nwr/amenity=pharmacy",
  "nwr/tourism=camp_site",
  "nwr/tourism=attraction",
  "nwr/shop=bakery",
  "nwr/shop=convenience",
  "nwr/shop=food",
  "nwr/shop=supermarket",
  "nwr/shop=boat",
  "nwr/shop=outdoor",
  "nwr/shop=sports",
  "nwr/shop=rental",
  "nwr/historic",
  "nwr/natural=peak",
  "nwr/natural=spring",
  "nwr/natural=cave_entrance",
// Administrative boundaries
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

// Runs a command from a server with command options (args), wait until finishes. Answer: finished or not 
// Promise = js container for future result. Resolve = if finished successfully, Reject = if finished with error
// execFile = Node.js function to strat another program (similar to writing in Terminal) - running automatically
function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    function commandResult(error, stdout, stderr) {
      if (error) {
        reject(new Error(`${command} failed\n${stderr || error.message}`));
        return;
      }
      resolve({ stdout, stderr });
    }
    // running execFile 
    execFile(
      command,
      args,
      { maxBuffer: 200 * 1024 * 1024 }, // 200MB
      commandResult
    );
  });
}

// convertng bbox value into numbers 
// If bboxValue is an array, it converts its values to numbers
// It bboxValue is a string, it will split by commas
function parseBbox(bboxValue) {
  if (Array.isArray(bboxValue)) {
    const west = Number(bboxValue[0]);
    const south = Number(bboxValue[1]);
    const east = Number(bboxValue[2]);
    const north = Number(bboxValue[3]);

    return [west, south, east, north];
  }

  if (typeof bboxValue === "string") {
    const bboxParts = bboxValue.split(",");

    const west = Number(bboxParts[0]);
    const south = Number(bboxParts[1]);
    const east = Number(bboxParts[2]);
    const north = Number(bboxParts[3]);

    return [west, south, east, north];
  }

  return null;
}

// Chechs if values of bbox are valid 
// If bbox values are not an array and dont have exactly four items, returning false
// If they are arrays, it names them "west", "south", "east", "north"
// Returning only if they (west,south,east,north) are numbers, and if theyre in a right range 
function isValidBbox(bbox) {
  if (!Array.isArray(bbox) || bbox.length !== 4) {
    return false;
  }

  const west = Number(bbox[0]);
  const south = Number(bbox[1]);
  const east = Number(bbox[2]);
  const north = Number(bbox[3]);

  return (
    !Number.isNaN(west) &&
    !Number.isNaN(south) &&
    !Number.isNaN(east) &&
    !Number.isNaN(north) &&
    west < east &&
    south < north &&
    west >= -180 &&
    east <= 180 &&
    south >= -90 &&
    north <= 90
  );
}

// Allowing "hiking" or "weirs"
function isValidKind(kind) {
  return kind === "hiking" || kind === "weirs";
}

// Deleting of temporary files 
async function cleanup(files) {
  for (const file of files) {
    if (!file) {
      continue;
    }

    try {
      await fs.unlink(file);
    } catch (error) {                                   // The file may already be deleted or may not exist.
    }
  }
}

// Creating osm.pbf file with hiking routes or weirs for the current map area
// Input: values of bounding box, kind = "hiking" or "weirs", outputFile = where to safe osm.pbf file
// The name of created file is always unique because of using time of downloading in miliseconds in a file name
// Created file is used both for showing paths or weirs in a map window or for export with data regarding on chosen style
async function createFilteredPbf({ bbox, kind, outputFile }) {
  const [west, south, east, north] = bbox;                                     // Creating constants named west, south, ... which contain values from bbox
  const stamp = Date.now();                                                   // Current time in miliseconds
  const cutFile = path.join(EXPORT_DIR, `cut_${stamp}.osm.pbf`);              // EXPORT_DIR is Export folder, `cut_${stamp}.osm.pbf` is a file name, where stamp is time in miliseconds

  // Firstly, cuts a source file to the selected area (bbox size) 
  // Secondly, filters cutted file 
  try {
    if (kind === "hiking") {
      await runCommand("osmium", [
        "extract",
        `--bbox=${west},${south},${east},${north}`,
        "--strategy=complete_ways",
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

// Creating osm.pbf file filtering with TOURISTIC_OSM_FILTERS
// Firstly, cuts a source file to the selected area (bbox size) 
// Secondly, filters a cutted file
async function createTouristicPbf({ bbox, outputFile }) {
  const [west, south, east, north] = bbox;
  const stamp = Date.now();
  const cutFile = path.join(EXPORT_DIR, `touristic_cut_${stamp}.osm.pbf`);

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
      ...TOURISTIC_OSM_FILTERS,
      "-o",
      outputFile,
      "--overwrite"
    ]);
  } finally {
    await cleanup([cutFile]);
  }
}

// Creating osm.pbf file filtering with WATER_OSM_FILTERS
// Firstly, cuts a source file to the selected area (bbox size) 
// Secondly, filters a cutted file
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

// Creating two separate geojson files: touristic + hiking paths 
// Firstly, creates osm.pbf 
// Secondly, creates geojson from osm.pbf
async function createTouristicGeojsonFiles({ bbox }) {
  const stamp = Date.now();                                                        // timestamp for file names

  const touristicPbf = path.join(EXPORT_DIR, `touristic_${stamp}.osm.pbf`);
  const touristicGeojson = path.join(EXPORT_DIR, `touristic_${stamp}.geojson`);

  const hikingPbf = path.join(EXPORT_DIR, `hiking_routes_${stamp}.osm.pbf`);
  const hikingGeojson = path.join(EXPORT_DIR, `hiking_routes_${stamp}.geojson`);

  try {
    // creating osm.pbf filtered and cutted
    await createTouristicPbf({
      bbox,
      outputFile: touristicPbf
    });

    // creating geojson from osm.pbf
    await runCommand("osmium", [
      "export",
      touristicPbf,
      "-o",
      touristicGeojson,
      "--overwrite"
    ]);

    // creating osm.pbf with hiking routes
    await createFilteredPbf({
      bbox,
      kind: "hiking",
      outputFile: hikingPbf
    });

    // creating geojson with coloured hiking routes from osm.pbf
    await runCommand("python3", [
      path.join(SCRIPT_DIR, "hiking_to_geojson.py"),
      hikingPbf,
      hikingGeojson
    ]);

    return [touristicGeojson, hikingGeojson];
  } catch (error) {
    await cleanup([touristicGeojson, hikingGeojson]);                             // if export fails, deletes incompleted geojson files
    throw error;
  } finally {
    await cleanup([touristicPbf, hikingPbf]);                                    // if exports succeded, deletes temporary osm.pbf files
  }
}

// Creating two separate geojson files: water + weirs
// Firstly, creates osm.pbf 
// Secondly, creates geojson from osm.pbf
async function createWaterGeojsonFiles({ bbox }) {
  const stamp = Date.now();                                                      // timestamp for file names
  // Filenames 
  const waterPbf = path.join(EXPORT_DIR, `water_${stamp}.osm.pbf`);
  const waterGeojson = path.join(EXPORT_DIR, `water_${stamp}.geojson`);
  const weirsPbf = path.join(EXPORT_DIR, `weirs_${stamp}.osm.pbf`);
  const weirsGeojson = path.join(EXPORT_DIR, `weirs_${stamp}.geojson`);

  try {
    // creating osm.pbf filtered and cutted
    await createWaterPbf({
      bbox,
      outputFile: waterPbf
    });

    // creating geojson from osm.pbf
    await runCommand("osmium", [
      "export",
      waterPbf,
      "-o",
      waterGeojson,
      "--overwrite"
    ]);

    // creating osm.pbf with weirs
    await createFilteredPbf({
      bbox,
      kind: "weirs",
      outputFile: weirsPbf
    });

    // creating geojson with weirs
    await runCommand("osmium", [
      "export",
      weirsPbf,
      "-o",
      weirsGeojson,
      "--overwrite"
    ]);

    return [waterGeojson, weirsGeojson];
  } catch (error) {
    await cleanup([waterGeojson, weirsGeojson]);                                            // if export fails, deletes incompleted geojson files
    throw error;
  } finally {
    await cleanup([waterPbf, weirsPbf]);                                                    // if exports succeded, deletes temporary osm.pbf files
  }
}

// Api endpoint - preview of hiking routes or weirs by creating temporary geojson 
app.get("/api/preview", async (req, res) => {
  const kind = req.query.kind;            // kind value from url          
  const bbox = parseBbox(req.query.bbox); // bbox values from url and converting to numbers
  // cheking if chosen kind is valid (hiking or weirs)
  if (!isValidKind(kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }
  // checking if bbox values are valid 
  if (!isValidBbox(bbox)) {
    return res.status(400).json({ error: "Invalid bbox" });
  }
  // naming of file 
  const stamp = Date.now();
  const filteredFile = path.join(EXPORT_DIR, `preview_${kind}_${stamp}.osm.pbf`);
  const geojsonFile = path.join(EXPORT_DIR, `preview_${kind}_${stamp}.geojson`);

  try {
    // Creating osm.pbf from current bbox and chosen kind to output file
    await createFilteredPbf({ bbox, kind, outputFile: filteredFile });
    // for weirs
    if (kind === "weirs") {
      await runCommand("osmium", [
        "export",
        filteredFile,
        "-o",
        geojsonFile,
        "--overwrite"
      ]);
      // for hiking paths
    } else {
      await runCommand("python3", [
        path.join(SCRIPT_DIR, "hiking_to_geojson.py"),
        filteredFile,
        geojsonFile
      ]);
    }
    // converting geojson file to js object
    const geojsonText = await fs.readFile(geojsonFile, "utf8");
    const geojson = JSON.parse(geojsonText);
    // sending geojson back to browser 
    res.json(geojson);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Preview failed",
      details: error.message
    });
  } finally {
    await cleanup([filteredFile, geojsonFile]);                        // deleting temporary files after js object is created and shown in the map window
  }
});

// Api endpoint - download current selection into geojson format 
app.post("/api/download-geojson", async (req, res) => {
  const {
    kind,
    bbox,
    style,
    includeTouristicBase,
    includeWaterBase
  } = req.body;                                                           // from app.js
  // checking if kind is valid (hiking or weirs)
  if (!isValidKind(kind)) {
    return res.status(400).json({ error: "Invalid kind" });
  }
  // checking if bbox values are valid
  if (!isValidBbox(bbox)) {
    return res.status(400).json({ error: "Invalid bbox" });
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

  const outputFile = path.join(EXPORT_DIR, `${kind}_${stamp}.geojson`);
  const tempPbfFile = path.join(EXPORT_DIR, `${kind}_${stamp}.osm.pbf`);

  let outputFiles = [];

  try {
    if (shouldExportTouristicGeojson) {
      outputFiles = await createTouristicGeojsonFiles({ bbox });
    } else if (shouldExportWaterGeojson) {
      outputFiles = await createWaterGeojsonFiles({ bbox });
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

      outputFiles = [outputFile];
    }

    res.json({
      ok: true,
      downloadUrls: outputFiles.map((file) => `/downloads/${path.basename(file)}`)
    });
  } catch (error) {
    console.error(error);

    await cleanup(outputFiles);

    res.status(500).json({
      error: "GeoJSON download failed",
      details: error.message
    });
  } finally {
    await cleanup([tempPbfFile]);
  }
});

// Server start 
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
