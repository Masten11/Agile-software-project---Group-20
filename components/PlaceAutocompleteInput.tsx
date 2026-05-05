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
    return <p className="text-sm text-gray-500">Loading location search...</p>;
  }

  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

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
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
      </Autocomplete>
    </div>
  );
}