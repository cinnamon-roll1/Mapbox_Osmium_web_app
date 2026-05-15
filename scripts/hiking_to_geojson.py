import json
import sys
from collections import defaultdict
import osmium

input_file = sys.argv[1]
output_file = sys.argv[2]

routes_by_way = defaultdict(list)

KCT_COLOR_MAP = {
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
    """
    Vrátí dvojici:
    - název barvy: red / blue / green / yellow / white
    - hex barvu pro vykreslení
    """

    for color_name, color_def in KCT_COLOR_MAP.items():
        tag_name = color_def["tag"]

        if tags.get(tag_name):
            return color_name, color_def["hex"]

    osmc_symbol = tags.get("osmc:symbol", "")

    if osmc_symbol:
        for color_name, color_def in KCT_COLOR_MAP.items():
            if (
                osmc_symbol.startswith(f"{color_name}:")
                or f"{color_name}_bar" in osmc_symbol
                or f"{color_name}_backslash" in osmc_symbol
            ):
                return color_name, color_def["hex"]

    colour = tags.get("colour", "").lower()

    if colour in KCT_COLOR_MAP:
        return colour, KCT_COLOR_MAP[colour]["hex"]

    return None, "#666666"


class RouteCollector(osmium.SimpleHandler):
    def relation(self, r):
        if r.tags.get("type") != "route":
            return

        route_type = r.tags.get("route")

        if route_type not in ("hiking", "foot"):
            return

        kct_color, color_hex = detect_kct_color(r.tags)

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

        for m in r.members:
            if m.type == "w":
                routes_by_way[m.ref].append(info)


collector = RouteCollector()
collector.apply_file(input_file, locations=False)

factory = osmium.geom.GeoJSONFactory()
features = []


class WayCollector(osmium.SimpleHandler):
    def way(self, w):
        if w.id not in routes_by_way:
            return

        try:
            geometry = json.loads(factory.create_linestring(w))
        except Exception:
            return

        infos = routes_by_way[w.id]

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

            features.append({
                "type": "Feature",
                "geometry": geometry,
                "properties": properties
            })


ways = WayCollector()
ways.apply_file(input_file, locations=True)

geojson = {
    "type": "FeatureCollection",
    "features": features
}

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(geojson, f, ensure_ascii=False)