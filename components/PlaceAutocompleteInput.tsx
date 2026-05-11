"use client";

import { useRef } from "react";
import { Autocomplete, useLoadScript } from "@react-google-maps/api";

const libraries: "places"[] = ["places"];

type SelectedPlace = {
  address: string;
  placeId?: string;
  lat?: number;
  lng?: number;
};

type PlaceAutocompleteInputProps = {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  onPlaceSelected?: (place: SelectedPlace) => void;
};

export default function PlaceAutocompleteInput({
  label,
  value,
  placeholder = "Search location...",
  onChange,
  onPlaceSelected,
}: PlaceAutocompleteInputProps) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries,
  });

  const handlePlaceChanged = () => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const address = place.formatted_address || place.name || "";

    onChange(address);

    onPlaceSelected?.({
      address,
      placeId: place.place_id,
      lat: place.geometry?.location?.lat(),
      lng: place.geometry?.location?.lng(),
    });
  };

  if (loadError) {
    return <p className="text-sm text-red-500">Google Maps failed to load.</p>;
  }

  if (!isLoaded) {
    return <p className="text-sm text-zinc-500">Loading location search...</p>;
  }

  return (
    <div className="space-y-3">
      <p 
        className="text-xs tracking-widest uppercase"
        style={{ 
          color: "var(--text-muted)", 
          fontFamily: "var(--font-body)" 
        }}
      >
        {label}
      </p>

      <Autocomplete
        onLoad={(autocomplete) => {
          autocompleteRef.current = autocomplete;
        }}
        onPlaceChanged={handlePlaceChanged}
        options={{
          componentRestrictions: { country: "se" },
          fields: ["formatted_address", "name", "place_id", "geometry"],
        }}
      >
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full flex items-center justify-between px-5 py-4 rounded-2xl text-sm outline-none transition-all duration-200"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            color: "var(--text-primary)",
            fontFamily: "var(--font-body)",
          }}
          onFocus={(e) => (e.target.style.borderColor = "var(--border-active)")}
          onBlur={(e) => (e.target.style.borderColor = "var(--border-subtle)")}
        />
      </Autocomplete>
    </div>
  );
}