"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

const DEFAULT_CENTER = [-111.78, 33.75];
const DEFAULT_ZOOM = 12;

const getStatusTone = (status) => {
  switch ((status || "").toLowerCase()) {
    case "completed":
    case "knocked":
    case "contacted":
      return "#5DCAA5";
    case "attempted":
      return "#EF9F27";
    case "not_home":
      return "#B4B2A9";
    default:
      return "#7F77DD";
  }
};

const normalizeVoter = (voter, index) => {
  const longitude = Number(voter.longitude ?? voter.lng ?? voter.lon);
  const latitude = Number(voter.latitude ?? voter.lat);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  const firstName = voter.firstname || voter.firstName || "";
  const lastName = voter.lastname || voter.lastName || "";
  const fullName =
    voter.fullName ||
    `${firstName} ${lastName}`.trim() ||
    voter.name ||
    `Voter ${index + 1}`;

  return {
    type: "Feature",
    properties: {
      id: voter.id || voter._id || `voter-${index}`,
      fullName,
      firstName,
      lastName,
      address: voter.address || "",
      city: voter.cityname || voter.city || "",
      state: voter.statename || voter.state || "",
      zip: voter.zip || "",
      response:
        voter.responsename || voter.response || voter.status || "Uncontacted",
      status: voter.status || voter.responsename || "uncontacted",
      canvasserName: voter.canvasserName || "",
      phone: voter.phone || "",
      notes: voter.notes || "",
    },
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };
};

const normalizeCanvasser = (canvasser, index) => {
  const longitude = Number(
    canvasser.longitude ?? canvasser.lng ?? canvasser.lon,
  );
  const latitude = Number(canvasser.latitude ?? canvasser.lat);

  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;

  return {
    type: "Feature",
    properties: {
      id: canvasser.id || canvasser._id || `canvasser-${index}`,
      name: canvasser.name || canvasser.fullName || `Canvasser ${index + 1}`,
      status: canvasser.status || "Active",
      turfName: canvasser.turfName || "",
      doorsKnocked: canvasser.doorsKnocked ?? 0,
    },
    geometry: {
      type: "Point",
      coordinates: [longitude, latitude],
    },
  };
};

const buildFeatureCollection = (items, normalizer) => ({
  type: "FeatureCollection",
  features: (items || []).map(normalizer).filter(Boolean),
});

const fitMapToFeatures = (map, ...collections) => {
  const bounds = new mapboxgl.LngLatBounds();
  let hasPoints = false;

  collections.forEach((collection) => {
    if (!collection?.features?.length) return;

    collection.features.forEach((feature) => {
      const geom = feature.geometry;
      if (!geom) return;

      if (geom.type === "Point") {
        bounds.extend(geom.coordinates);
        hasPoints = true;
      }

      if (geom.type === "Polygon") {
        geom.coordinates.flat().forEach((coord) => {
          bounds.extend(coord);
          hasPoints = true;
        });
      }

      if (geom.type === "MultiPolygon") {
        geom.coordinates.flat(2).forEach((coord) => {
          bounds.extend(coord);
          hasPoints = true;
        });
      }
    });
  });

  if (hasPoints) {
    map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 800 });
  }
};

const StatCard = ({ label, value, accent = false, subtext }) => (
  <div className="rounded-2xl border border-gray-200 bg-[#f8f7f5] p-4">
    <div className="mb-1 text-[11px] uppercase tracking-[0.08em] text-[#888780]">
      {label}
    </div>
    <div
      className={`text-2xl font-semibold ${accent ? "text-[#534AB7]" : "text-[#1a1a1a]"}`}
    >
      {value}
    </div>
    {subtext ? (
      <div className="mt-1 text-xs text-[#888780]">{subtext}</div>
    ) : null}
  </div>
);

export default function ProjectMap({
  voters = null,
  canvassers = [],
  turfGeoJson = null,
  projectName = "Canvassing Turf",
  center = DEFAULT_CENTER,
  zoom = DEFAULT_ZOOM,
  height = 520,
  fetchVotersOnMount = true,
}) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const [fetchedVoters, setFetchedVoters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState("");

  const effectiveVoters = voters ?? fetchedVoters;

  const voterCollection = useMemo(
    () => buildFeatureCollection(effectiveVoters, normalizeVoter),
    [effectiveVoters],
  );

  const canvasserCollection = useMemo(
    () => buildFeatureCollection(canvassers, normalizeCanvasser),
    [canvassers],
  );

  const totalVoters = voterCollection.features.length;
  const totalCanvassers = canvasserCollection.features.length;
  const knockedCount = voterCollection.features.filter((f) =>
    ["completed", "knocked", "contacted"].includes(
      String(f.properties.status || "").toLowerCase(),
    ),
  ).length;

  useEffect(() => {
    if (voters !== null || !fetchVotersOnMount) return;

    let cancelled = false;

    const fetchData = async () => {
      try {
        setLoading(true);
        setMapError("");

        const res = await fetch("/api/voters");
        const data = await res.json();

        if (!res.ok)
          throw new Error(data.message || "Failed to load voter data");

        if (!cancelled) {
          setFetchedVoters(Array.isArray(data) ? data : data.voters || []);
        }
      } catch (err) {
        if (!cancelled) {
          setMapError(err.message || "Failed to load voter data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [voters, fetchVotersOnMount]);

  useEffect(() => {
    if (mapRef.current || !mapContainerRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center,
      zoom,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.NavigationControl(), "top-right");
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 16,
    });

    map.on("load", () => {
      if (!map.getSource("voters")) {
        map.addSource("voters", {
          type: "geojson",
          data: voterCollection,
          cluster: true,
          clusterMaxZoom: 14,
          clusterRadius: 45,
        });

        map.addLayer({
          id: "voter-clusters",
          type: "circle",
          source: "voters",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#AFA9EC",
            "circle-radius": [
              "step",
              ["get", "point_count"],
              18,
              20,
              22,
              50,
              28,
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        map.addLayer({
          id: "voter-cluster-count",
          type: "symbol",
          source: "voters",
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-size": 11,
          },
          paint: {
            "text-color": "#3C3489",
          },
        });

        map.addLayer({
          id: "voter-points",
          type: "circle",
          source: "voters",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-radius": 6,
            "circle-color": [
              "case",
              [
                "==",
                ["downcase", ["to-string", ["get", "status"]]],
                "completed",
              ],
              "#5DCAA5",
              ["==", ["downcase", ["to-string", ["get", "status"]]], "knocked"],
              "#5DCAA5",
              [
                "==",
                ["downcase", ["to-string", ["get", "status"]]],
                "contacted",
              ],
              "#5DCAA5",
              [
                "==",
                ["downcase", ["to-string", ["get", "status"]]],
                "attempted",
              ],
              "#EF9F27",
              [
                "==",
                ["downcase", ["to-string", ["get", "status"]]],
                "not_home",
              ],
              "#B4B2A9",
              "#7F77DD",
            ],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (!map.getSource("canvassers")) {
        map.addSource("canvassers", {
          type: "geojson",
          data: canvasserCollection,
        });

        map.addLayer({
          id: "canvasser-points",
          type: "circle",
          source: "canvassers",
          paint: {
            "circle-radius": 8,
            "circle-color": "#EF9F27",
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
      }

      if (turfGeoJson && !map.getSource("turf-boundaries")) {
        map.addSource("turf-boundaries", {
          type: "geojson",
          data: turfGeoJson,
        });

        map.addLayer({
          id: "turf-fill",
          type: "fill",
          source: "turf-boundaries",
          paint: {
            "fill-color": "#AFA9EC",
            "fill-opacity": 0.12,
          },
        });

        map.addLayer({
          id: "turf-outline",
          type: "line",
          source: "turf-boundaries",
          paint: {
            "line-color": "#534AB7",
            "line-width": 2,
          },
        });
      }

      fitMapToFeatures(
        map,
        turfGeoJson || null,
        voterCollection,
        canvasserCollection,
      );
    });

    map.on("mouseenter", "voter-points", (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates;

      if (!coords) return;

      const statusColor = getStatusTone(props.status);

      popupRef.current
        .setLngLat(coords)
        .setHTML(
          `
          <div style="min-width:220px;font-size:12px;line-height:1.35;">
            <div style="font-weight:600;color:#1a1a1a;margin-bottom:4px;">
              ${props.fullName || "Voter"}
            </div>
            <div style="color:#666;margin-bottom:4px;">
              ${props.address || ""}
              ${props.city ? `<br/>${props.city}, ${props.state || ""} ${props.zip || ""}` : ""}
            </div>
            <div style="display:inline-flex;align-items:center;gap:6px;margin-top:4px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:999px;background:${statusColor};"></span>
              <span style="color:#444;">${props.response || props.status || "Uncontacted"}</span>
            </div>
            ${
              props.canvasserName
                ? `<div style="margin-top:6px;color:#888;">Assigned: ${props.canvasserName}</div>`
                : ""
            }
            ${
              props.notes
                ? `<div style="margin-top:6px;color:#888;">${props.notes}</div>`
                : ""
            }
          </div>
        `,
        )
        .addTo(map);
    });

    map.on("mouseleave", "voter-points", () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
    });

    map.on("mouseenter", "canvasser-points", (e) => {
      map.getCanvas().style.cursor = "pointer";

      const feature = e.features?.[0];
      if (!feature) return;

      const props = feature.properties || {};
      const coords = feature.geometry?.coordinates;
      if (!coords) return;

      popupRef.current
        .setLngLat(coords)
        .setHTML(
          `
          <div style="min-width:180px;font-size:12px;line-height:1.35;">
            <div style="font-weight:600;color:#1a1a1a;margin-bottom:4px;">
              ${props.name || "Canvasser"}
            </div>
            <div style="color:#666;">${props.status || "Active"}</div>
            ${
              props.turfName
                ? `<div style="margin-top:4px;color:#888;">Turf: ${props.turfName}</div>`
                : ""
            }
            <div style="margin-top:4px;color:#888;">Doors knocked: ${props.doorsKnocked || 0}</div>
          </div>
        `,
        )
        .addTo(map);
    });

    map.on("mouseleave", "canvasser-points", () => {
      map.getCanvas().style.cursor = "";
      popupRef.current?.remove();
    });

    map.on("click", "voter-clusters", (e) => {
      const features = map.queryRenderedFeatures(e.point, {
        layers: ["voter-clusters"],
      });

      const clusterId = features?.[0]?.properties?.cluster_id;
      const source = map.getSource("voters");

      if (!source || clusterId == null) return;

      source.getClusterExpansionZoom(clusterId, (err, nextZoom) => {
        if (err) return;
        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: nextZoom,
          duration: 500,
        });
      });
    });

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [center, zoom, turfGeoJson, voterCollection, canvasserCollection]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const voterSource = map.getSource("voters");
    if (voterSource) {
      voterSource.setData(voterCollection);
    }

    const canvasserSource = map.getSource("canvassers");
    if (canvasserSource) {
      canvasserSource.setData(canvasserCollection);
    }

    const turfSource = map.getSource("turf-boundaries");
    if (turfSource && turfGeoJson) {
      turfSource.setData(turfGeoJson);
    }

    fitMapToFeatures(
      map,
      turfGeoJson || null,
      voterCollection,
      canvasserCollection,
    );
  }, [voterCollection, canvasserCollection, turfGeoJson]);

  return (
    <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 inline-flex rounded-full border border-[#AFA9EC] bg-[#EEEDFE] px-2.5 py-1 text-xs font-semibold text-[#3C3489]">
            Turf map
          </div>
          <h2 className="text-xl font-bold text-gray-900">{projectName}</h2>
          <p className="mt-1 text-sm text-gray-500">
            Ready for live canvasser feed data, door activity, and turf-level
            visibility.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:min-w-[360px]">
          <StatCard
            label="Voter points"
            value={totalVoters.toLocaleString()}
            accent
            subtext={loading ? "Loading..." : "Mapped records"}
          />
          <StatCard
            label="Knocked / contacted"
            value={knockedCount.toLocaleString()}
            subtext="Progress-ready"
          />
          <StatCard
            label="Canvassers"
            value={totalCanvassers.toLocaleString()}
            subtext="Live-ready"
          />
        </div>
      </div>

      {mapError ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mapError}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f8f7f5] px-3 py-1.5 text-xs text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#7F77DD]" />
          Uncontacted
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f8f7f5] px-3 py-1.5 text-xs text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EF9F27]" />
          Attempted
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f8f7f5] px-3 py-1.5 text-xs text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#5DCAA5]" />
          Knocked / contacted
        </span>
        <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-[#f8f7f5] px-3 py-1.5 text-xs text-gray-600">
          <span className="h-2.5 w-2.5 rounded-full bg-[#EF9F27]" />
          Canvasser location
        </span>
      </div>

      <div
        className="overflow-hidden rounded-3xl border border-gray-200 bg-[#f8f7f5]"
        style={{ height }}
      >
        <div ref={mapContainerRef} className="h-full w-full" id="project-map" />
      </div>
    </section>
  );
}
