"use client";

import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_API_KEY;

const ProjectMap = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [-111.78, 33.75], 
      zoom: 12,
    });
    mapRef.current = map;

    map.on("load", () => {
      fetch("/api/voters")
        .then((response) => response.json())
        .then((data) => {
          data.forEach((voter) => {
            const { longitude, latitude } = voter;
            if (!longitude || !latitude) return;

            const marker = new mapboxgl.Marker()
              .setLngLat([longitude, latitude])
              .addTo(map);

            const popupContent = `
              <div style="font-size: 0.85rem; line-height: 1.2;">
                <strong>${voter.firstname} ${voter.lastname}</strong><br/>
                ${voter.address}<br/>
                ${voter.cityname}, ${voter.statename} ${voter.zip}<br/>
                <em>${voter.responsename}</em>
              </div>
            `;
            const popup = new mapboxgl.Popup({
              offset: 25,
              closeButton: false,
              closeOnClick: false,
            }).setHTML(popupContent);

            marker.getElement().addEventListener("mouseenter", () => {
              marker.setPopup(popup);
              popup.addTo(map);
            });
            marker.getElement().addEventListener("mouseleave", () => {
              popup.remove();
            });
          });
        })
        .catch((error) =>
          console.error("Error fetching voter data:", error)
        );
    });

    return () => {
      if (map) map.remove();
    };
  }, []);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "500px" }}
      id="project-map"
    />
  );
};

export default ProjectMap;
