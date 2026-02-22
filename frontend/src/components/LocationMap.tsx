"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";

/* Fix default marker icon issue with bundlers */
const defaultIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

interface LocationMapProps {
    latitude: number;
    longitude: number;
    onLocationChange: (lat: number, lng: number) => void;
}

function MapClickHandler({
    onLocationChange,
}: {
    onLocationChange: (lat: number, lng: number) => void;
}) {
    useMapEvents({
        click(e) {
            onLocationChange(e.latlng.lat, e.latlng.lng);
        },
    });
    return null;
}

function ChangeView({ center }: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.setView(center, 14);
    }, [center, map]);
    return null;
}

export default function LocationMap({
    latitude,
    longitude,
    onLocationChange,
}: LocationMapProps) {
    useEffect(() => {
        L.Marker.prototype.options.icon = defaultIcon;
    }, []);

    const center: [number, number] = [latitude || 28.6139, longitude || 77.209];

    return (
        <div className="h-[300px] w-full rounded-xl overflow-hidden border border-gray-200">
            <MapContainer
                center={center}
                zoom={14}
                scrollWheelZoom
                style={{ height: "100%", width: "100%" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <ChangeView center={center} />
                {latitude && longitude && (
                    <Marker position={[latitude, longitude]} icon={defaultIcon} />
                )}
                <MapClickHandler onLocationChange={onLocationChange} />
            </MapContainer>
        </div>
    );
}
