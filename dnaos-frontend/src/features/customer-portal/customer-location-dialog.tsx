"use client";

import { useEffect, useRef, useState } from "react";
import { Crosshair, MapPin, X } from "lucide-react";
import { useGoogleMaps } from "@/hooks/use-google-maps";
import { createCustomerSite, type CustomerSite } from "./customer-order-api";

type Props = {
  onClose: () => void;
  onCreated: (site: CustomerSite) => void;
};

type PlaceInfo = {
  formatted: string;
  lat: number;
  lng: number;
  province: string;
  district: string;
  subdistrict: string;
  postalCode: string;
};

function extractComponent(components: google.maps.GeocoderAddressComponent[], type: string): string {
  return components.find((c) => c.types.includes(type))?.long_name ?? "";
}

async function reverseGeocode(lat: number, lng: number): Promise<PlaceInfo> {
  return new Promise((resolve, reject) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status !== "OK" || !results?.[0]) {
        reject(new Error("Geocode failed"));
        return;
      }
      const result = results[0];
      const components = result.address_components;
      resolve({
        formatted: result.formatted_address,
        lat,
        lng,
        province: extractComponent(components, "administrative_area_level_1"),
        district: extractComponent(components, "administrative_area_level_2"),
        subdistrict:
          extractComponent(components, "sublocality_level_1") ||
          extractComponent(components, "locality"),
        postalCode: extractComponent(components, "postal_code"),
      });
    });
  });
}

export function CustomerLocationDialog({ onClose, onCreated }: Props) {
  const mapsReady = useGoogleMaps();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);
  const autocompleteInputRef = useRef<HTMLInputElement>(null);

  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [siteName, setSiteName] = useState("");
  const [locating, setLocating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasKey = !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Init map after Google Maps is ready
  useEffect(() => {
    if (!mapsReady || !mapRef.current || mapInstanceRef.current) return;

    const defaultCenter = { lat: 13.7563, lng: 100.5018 }; // Bangkok

    const map = new google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 14,
      disableDefaultUI: true,
      zoomControl: true,
      clickableIcons: false,
    });

    const marker = new google.maps.Marker({
      map,
      draggable: true,
      visible: false,
    });

    marker.addListener("dragend", async () => {
      const pos = marker.getPosition();
      if (!pos) return;
      try {
        const info = await reverseGeocode(pos.lat(), pos.lng());
        setPlace(info);
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = info.formatted;
      } catch {
        // keep previous place
      }
    });

    map.addListener("click", async (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      marker.setPosition(e.latLng);
      marker.setVisible(true);
      try {
        const info = await reverseGeocode(e.latLng.lat(), e.latLng.lng());
        setPlace(info);
        if (autocompleteInputRef.current) autocompleteInputRef.current.value = info.formatted;
      } catch {
        // ignore
      }
    });

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Auto-locate on open
    locateMe(map, marker);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapsReady]);

  // Autocomplete
  useEffect(() => {
    if (!mapsReady || !autocompleteInputRef.current) return;
    const autocomplete = new google.maps.places.Autocomplete(autocompleteInputRef.current, {
      componentRestrictions: { country: "TH" },
      fields: ["formatted_address", "geometry", "address_components"],
    });
    autocomplete.addListener("place_changed", async () => {
      const p = autocomplete.getPlace();
      if (!p.geometry?.location) return;
      const lat = p.geometry.location.lat();
      const lng = p.geometry.location.lng();
      const components = p.address_components ?? [];
      const info: PlaceInfo = {
        formatted: p.formatted_address ?? "",
        lat,
        lng,
        province: extractComponent(components, "administrative_area_level_1"),
        district: extractComponent(components, "administrative_area_level_2"),
        subdistrict:
          extractComponent(components, "sublocality_level_1") ||
          extractComponent(components, "locality"),
        postalCode: extractComponent(components, "postal_code"),
      };
      setPlace(info);
      const map = mapInstanceRef.current;
      const marker = markerRef.current;
      if (map && marker) {
        map.setCenter({ lat, lng });
        map.setZoom(16);
        marker.setPosition({ lat, lng });
        marker.setVisible(true);
      }
    });
    return () => google.maps.event.clearInstanceListeners(autocomplete);
  }, [mapsReady]);

  function locateMe(map?: google.maps.Map, marker?: google.maps.Marker) {
    const m = map ?? mapInstanceRef.current;
    const mk = marker ?? markerRef.current;
    if (!m || !mk) return;
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        m.setCenter({ lat, lng });
        m.setZoom(17);
        mk.setPosition({ lat, lng });
        mk.setVisible(true);
        try {
          const info = await reverseGeocode(lat, lng);
          setPlace(info);
          if (autocompleteInputRef.current) autocompleteInputRef.current.value = info.formatted;
        } catch {
          // ignore
        }
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!place || !siteName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result = await createCustomerSite({
        siteName: siteName.trim(),
        address: place.formatted,
        province: place.province,
        district: place.district,
        subdistrict: place.subdistrict,
        postalCode: place.postalCode,
        gpsLat: place.lat,
        gpsLng: place.lng,
      });
      onCreated(result.site);
    } catch {
      setError("บันทึกไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Top bar */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h2 className="text-base font-bold">เพิ่มโลเคชั่น</h2>
        <button onClick={onClose} className="rounded-full p-1 hover:bg-muted">
          <X className="size-5" />
        </button>
      </div>

      {!hasKey && (
        <div className="mx-4 mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-700">
          ยังไม่ได้ตั้งค่า Google Maps API Key
        </div>
      )}

      {/* Map */}
      <div className="relative flex-1">
        <div ref={mapRef} className="h-full w-full" />

        {/* Center pin icon */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <MapPin className="size-8 text-primary drop-shadow-md -translate-y-4" />
        </div>

        {/* Locate me button */}
        <button
          type="button"
          onClick={() => locateMe()}
          disabled={!mapsReady || locating}
          className="absolute bottom-4 right-4 flex items-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-medium shadow-md disabled:opacity-50"
        >
          <Crosshair className={`size-4 ${locating ? "animate-spin text-primary" : ""}`} />
          {locating ? "กำลังหาตำแหน่ง…" : "ตำแหน่งของฉัน"}
        </button>

        {!mapsReady && hasKey && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/80">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="border-t bg-background p-4 space-y-3">
        {error && (
          <div className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
        )}

        {/* Search input */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ค้นหาสถานที่</label>
          <input
            ref={autocompleteInputRef}
            type="text"
            placeholder="พิมพ์ชื่อสถานที่หรือที่อยู่..."
            disabled={!mapsReady}
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          />
        </div>

        {place && (
          <div className="flex items-start gap-1.5 rounded-lg bg-muted/50 px-2.5 py-2">
            <MapPin className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <p className="text-xs text-muted-foreground">{place.formatted}</p>
          </div>
        )}

        {/* Note/label */}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">ชื่อที่อยู่ / โน้ต *</label>
          <input
            type="text"
            value={siteName}
            onChange={(e) => setSiteName(e.target.value)}
            placeholder="เช่น บ้าน, ไซต์งานพระราม 9"
            className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-xl border py-2.5 text-sm font-medium">
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || !siteName.trim() || !place}
              className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {saving ? "กำลังบันทึก…" : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
