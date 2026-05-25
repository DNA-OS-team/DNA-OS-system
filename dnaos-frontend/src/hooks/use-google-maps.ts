"use client";

import { useEffect, useState } from "react";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    google?: any;
    __googleMapsLoading?: boolean;
  }
}

function isMapsReady() {
  return typeof window !== "undefined" && !!window.google?.maps;
}

export function useGoogleMaps(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isMapsReady()) {
      setReady(true);
      return;
    }

    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) return;

    if (window.__googleMapsLoading) {
      const interval = setInterval(() => {
        if (isMapsReady()) {
          setReady(true);
          clearInterval(interval);
        }
      }, 100);
      return () => clearInterval(interval);
    }

    window.__googleMapsLoading = true;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=th`;
    script.async = true;
    script.onload = () => setReady(true);
    document.head.appendChild(script);
  }, []);

  return ready;
}
