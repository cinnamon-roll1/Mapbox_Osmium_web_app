import json                                # python tools for json (GeoJSON is written in JSON format)
import sys                                 # system tools (to read command-line arguments)
import osmium                              # for osm.pbf

input_file = sys.argv[1]                   # reading the first argument of command line
output_file = sys.argv[2]                  # reading the second argument of command line

routes_by_way = {}                         # dictionary, where by OSM way ID the hiking route information is stored. for noe, its empty 

KCT_COLOR_MAP = {                          # each colour is defined by OSM tag and hex colour
    "red": {
        "tag": "kct_red",
        "hex": "#e53935"
    },
    "blue": {
        "tag": "kct_blue",
        "hex": "#1e88e5"
    },
    "green": {
        "tag": "kct_green",
        "hex": "#43a047"
    },
    "yellow": {
        "tag": "kct_yellow",
        "hex": "#fdd835"
    },
    "white": {
        "tag": "kct_white",
        "hex": "#ffffff"
    }
}


def detect_kct_color(tags):
    # checking if the route has one of the kct color tags
    for color_name, color_def in KCT_COLOR_MAP.items():
        tag_name = color_def["tag"]

        if tags.get(tag_name):
            return color_name, color_def["hex"]
    # routes without kct color would be shown in grey color 
    return None, "#666666"             

# for reading hiking routes relations from the osm.pbf
class RouteCollector(osmium.SimpleHandler): # SimpleHandler reads osm.pbf
    def relation(self, r): # runs for every relation 
        # skips relations that are not routes 
        if r.tags.get("type") != "route":
            return
        # gets the route type
        route_type = r.tags.get("route") 
        # if not hiking or foot, skips
        if route_type not in ("hiking", "foot"):
            return
        # detect route color from kct tags
        kct_color, color_hex = detect_kct_color(r.tags) 
        # later attached to GeoJSON properties
        info = {
            "relation_id": r.id,
            "route": route_type,
            "name": r.tags.get("name", ""),
            "ref": r.tags.get("ref", ""),
            "colour": r.tags.get("colour", ""),
            "osmc_symbol": r.tags.get("osmc:symbol", ""),

            "kct_red": r.tags.get("kct_red", ""),
            "kct_blue": r.tags.get("kct_blue", ""),
            "kct_green": r.tags.get("kct_green", ""),
            "kct_yellow": r.tags.get("kct_yellow", ""),
            "kct_white": r.tags.get("kct_white", ""),

            "kct_color": kct_color,
            "color": color_hex
        }
        # for each way in the hiking route remembers that this way belongs to this route
        for m in r.members:
            if m.type == "w":
                if m.ref not in routes_by_way:
                    routes_by_way[m.ref] = []

                routes_by_way[m.ref].append(info)


collector = RouteCollector() # creates the route collector
collector.apply_file(input_file, locations=False) # runs relation(self, r) for every relation in the file and not creating geometry yet 

factory = osmium.geom.GeoJSONFactory() # helper to convert osm ways to geojson geometry 
features = [] # for future storing of geojson features 

# for reading OSM ways and creating GeoJSON features
class WayCollector(osmium.SimpleHandler):
    def way(self, w): 
        # skips ways that are not a part of hiking routes 
        if w.id not in routes_by_way: 
            return
        # OSM ways into GeoJSON geometry 
        try:
            geometry = json.loads(factory.create_linestring(w))
        except Exception:
            return
        # all route info connected to the current way 
        infos = routes_by_way[w.id]
        # creating properties to each geojson feature
        for info in infos:
            properties = {
                "osm_id": w.id,
                "relation_id": info["relation_id"],

                "route_type": info["route"],
                "route_types": [info["route"]],

                "name": info["name"],
                "names": [info["name"]] if info["name"] else [],

                "ref": info["ref"],
                "refs": [info["ref"]] if info["ref"] else [],

                "colour": info["colour"],
                "colours": [info["colour"]] if info["colour"] else [],

                "osmc:symbol": info["osmc_symbol"],
                "osmc_symbol": info["osmc_symbol"],
                "osmc_symbols": [info["osmc_symbol"]] if info["osmc_symbol"] else [],

                "kct_red": info["kct_red"],
                "kct_blue": info["kct_blue"],
                "kct_green": info["kct_green"],
                "kct_yellow": info["kct_yellow"],
                "kct_white": info["kct_white"],

                "kct_color": info["kct_color"],
                "color": info["color"],
                "stroke": info["color"],
                "stroke-width": 4
            }
            # adding geojson feature to features list 
            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            })


ways = WayCollector() # creates the way collector
ways.apply_file(input_file, locations=True) # reads input osm.pbf file using WayCollector

# creating geojson 
geojson = {
    "type": "FeatureCollection",
    "features": features
}

# writing geojson into a file 
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(geojson, f, ensure_ascii=False)
