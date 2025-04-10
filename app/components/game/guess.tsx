//
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";

// Define type for Leaflet's Icon Default prototype
interface IconDefaultPrototype {
  _getIconUrl?: string;
}

// Fix Leaflet icon issues in Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
  });
};

// Create custom marker icons
const createCustomIcon = (color: string = "blue") => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
  });
};

// Define TypeScript interfaces
interface Location {
  id: string;
  latitude: number;
  longitude: number;
  panoId: string;
  country: string;
  city?: string;
}

interface Guess {
  latitude: number;
  longitude: number;
}

interface Region {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Add Google Street View types to Window interface
declare global {
  interface Window {
    google: {
      maps: {
        StreetViewService: new () => StreetViewService;
        StreetViewPanorama: new (element: HTMLElement, options: StreetViewPanoramaOptions) => StreetViewPanorama;
        StreetViewStatus: {
          OK: string;
          ZERO_RESULTS: string;
          [key: string]: string;
        };
        LatLng: new (lat: number, lng: number) => GoogleMapsLatLng;
      };
    };
    initGoogleMaps?: () => void;
  }
}

// Google Maps types
interface GoogleMapsLatLng {
  lat(): number;
  lng(): number;
}

interface GoogleMapsStreetViewPanoramaData {
  location: {
    latLng: GoogleMapsLatLng;
    pano: string;
  };
}

interface StreetViewService {
  getPanorama(
    request: StreetViewPanoramaRequest,
    callback: (data: GoogleMapsStreetViewPanoramaData, status: string) => void
  ): void;
}

interface StreetViewPanoramaRequest {
  location: GoogleMapsLatLng;
  radius: number;
  source?: string;
}

interface StreetViewPanoramaOptions {
  pano: string;
  visible: boolean;
  pov: {
    heading: number;
    pitch: number;
  };
  zoom: number;
  linksControl: boolean;
  panControl: boolean;
  enableCloseButton: boolean;
  addressControl: boolean;
  fullscreenControl: boolean;
}

interface StreetViewPanorama {
  setPano(panoId: string): void;
  setVisible(visible: boolean): void;
  setPov(pov: { heading: number; pitch: number }): void;
  setZoom(zoom: number): void;
}

// Define regions around the world with good Street View coverage
const worldRegions: Region[] = [
  // North America
  { minLat: 25, maxLat: 49, minLng: -125, maxLng: -70 },
  // Europe
  { minLat: 36, maxLat: 65, minLng: -10, maxLng: 30 },
  // Japan
  { minLat: 30, maxLat: 45, minLng: 130, maxLng: 145 },
  // Australia
  { minLat: -40, maxLat: -20, minLng: 140, maxLng: 155 },
  // South America
  { minLat: -35, maxLat: 5, minLng: -75, maxLng: -35 },
  // South Africa
  { minLat: -35, maxLat: -25, minLng: 15, maxLng: 32 },
];

// Map Click Handler Component
function MapClickHandler({ setUserGuess }: { setUserGuess: (guess: Guess) => void }) {
  useMapEvents({
    click: (e) => {
      console.log("Map clicked at:", e.latlng);
      setUserGuess({
        latitude: e.latlng.lat,
        longitude: e.latlng.lng,
      });
    },
  });

  return null;
}

// Map Controls Component
function MapControls() {
  const map = useMap();

  return (
    <div className="absolute top-2 right-2 z-[400] flex flex-col space-y-2">
      <button
        onClick={() => map.zoomIn()}
        className="w-10 h-10 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none"
        title="Zoom in"
      >
        <span className="text-xl">+</span>
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="w-10 h-10 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none"
        title="Zoom out"
      >
        <span className="text-xl">−</span>
      </button>
      <button
        onClick={() => map.setView([20, 0], 2)}
        className="w-10 h-10 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none"
        title="Reset view"
      >
        <span className="text-xl">⟲</span>
      </button>
    </div>
  );
}

// Component to draw line between guess and actual location
function DistanceLine({ userGuess, actualLocation }: { userGuess: Guess; actualLocation: Location }) {
  const map = useMap();

  useEffect(() => {
    if (!userGuess || !actualLocation) return;

    const linePoints: [number, number][] = [
      [userGuess.latitude, userGuess.longitude],
      [actualLocation.latitude, actualLocation.longitude],
    ];

    const polyline = L.polyline(linePoints, {
      color: "red",
      weight: 2,
      opacity: 0.7,
      dashArray: "5, 10",
    }).addTo(map);

    return () => {
      map.removeLayer(polyline);
    };
  }, [map, userGuess, actualLocation]);

  return null;
}

export default function GameComponent() {
  // Google Street View references
  const panoramaRef = useRef<StreetViewPanorama | null>(null);
  const streetViewContainerRef = useRef<HTMLDivElement | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);
  const [mapsScriptLoading, setMapsScriptLoading] = useState<boolean>(false);

  const [location, setLocation] = useState<Location | null>(null);
  const [userGuess, setUserGuess] = useState<Guess | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Google Maps API key
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Calculate distance using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Initialize Street View panorama
  const initializeStreetView = useCallback(() => {
    if (!location || !streetViewContainerRef.current || !window.google || !window.google.maps) {
      console.log("Cannot initialize Street View:", {
        location: !!location,
        container: !!streetViewContainerRef.current,
        googleMaps: !!(window.google && window.google.maps),
      });
      return;
    }

    try {
      console.log("Initializing Street View with panoId:", location.panoId);

      if (!panoramaRef.current) {
        panoramaRef.current = new window.google.maps.StreetViewPanorama(streetViewContainerRef.current, {
          pano: location.panoId,
          visible: true,
          pov: {
            heading: Math.floor(Math.random() * 360),
            pitch: 0,
          },
          zoom: 0,
          linksControl: false,
          panControl: true,
          enableCloseButton: false,
          addressControl: false,
          fullscreenControl: false,
        });
        console.log("Street View panorama created");
      } else {
        panoramaRef.current.setPano(location.panoId);
        panoramaRef.current.setPov({
          heading: Math.floor(Math.random() * 360),
          pitch: 0,
        });
        panoramaRef.current.setVisible(true);
        console.log("Existing panorama updated");
      }
    } catch (error) {
      console.error("Error initializing Street View:", error);
      setError("Failed to initialize Street View. Please try refreshing the page.");
    }
  }, [location]);

  // Fetch random Street View location
  const fetchRandomStreetViewLocation = useCallback(
    async (retryCount = 0, tier = 0): Promise<boolean> => {
      if (!window.google || !window.google.maps) {
        console.log("Google Maps not loaded, delaying location fetch");
        setTimeout(() => fetchRandomStreetViewLocation(retryCount, tier), 2000);
        return false;
      }

      try {
        setLoading(true);
        setError(null);

        console.log(`Fetching random location (retry: ${retryCount}, tier: ${tier})`);

        // Select a random region and generate coordinates
        const region = worldRegions[Math.floor(Math.random() * worldRegions.length)];
        const lat = Math.random() * (region.maxLat - region.minLat) + region.minLat;
        const lng = Math.random() * (region.maxLng - region.minLng) + region.minLng;

        // Define search radius based on tier (increasing with each retry)
        const searchRadius = 1000 * Math.pow(5, tier); // 1km, 5km, 25km, 125km, etc.

        console.log(`Search parameters: lat=${lat.toFixed(4)}, lng=${lng.toFixed(4)}, radius=${searchRadius}m`);

        // Create a new Street View service instance
        const streetViewService = new window.google.maps.StreetViewService();

        try {
          // Find a panorama
          const panoramaData = await new Promise<GoogleMapsStreetViewPanoramaData>((resolve, reject) => {
            const location = new window.google.maps.LatLng(lat, lng);
            streetViewService.getPanorama(
              {
                location: location,
                radius: searchRadius,
                source: "outdoor",
              },
              (data: GoogleMapsStreetViewPanoramaData, status: string) => {
                if (status === window.google.maps.StreetViewStatus.OK) {
                  resolve(data);
                } else {
                  reject(status);
                }
              }
            );
          });

          const panoLocation = panoramaData.location;
          const finalLat = panoLocation.latLng.lat();
          const finalLng = panoLocation.latLng.lng();
          const panoId = panoLocation.pano;

          console.log(`Found panorama at ${finalLat.toFixed(4)}, ${finalLng.toFixed(4)}, ID: ${panoId}`);

          try {
            // Use reverse geocoding to get country and city
            const geoResponse = await axios.get(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${finalLat}&lon=${finalLng}&zoom=10`
            );

            const newLocation = {
              id: panoId,
              latitude: finalLat,
              longitude: finalLng,
              panoId: panoId,
              country: geoResponse.data.address.country || "Unknown",
              city:
                geoResponse.data.address.city ||
                geoResponse.data.address.town ||
                geoResponse.data.address.village ||
                geoResponse.data.address.county ||
                "Unknown",
            };

            console.log("Location data:", newLocation);
            setLocation(newLocation);

            setTimeout(initializeStreetView, 300);
            setLoading(false);
            return true;
          } catch (geoErr) {
            console.warn("Geocoding failed:", geoErr);
            // Continue with limited location info
            const newLocation = {
              id: panoId,
              latitude: finalLat,
              longitude: finalLng,
              panoId: panoId,
              country: "Unknown",
              city: "Unknown",
            };

            setLocation(newLocation);
            setTimeout(initializeStreetView, 300);
            setLoading(false);
            return true;
          }
        } catch (svError) {
          console.warn("Failed to find panorama:", svError);

          // Move to the next tier if current tier failed
          if (tier < 4) {
            return await fetchRandomStreetViewLocation(retryCount, tier + 1);
          }

          // If we've exhausted all tiers, try a completely fresh attempt
          if (retryCount < 3) {
            return await fetchRandomStreetViewLocation(retryCount + 1, 0);
          }

          // If all retries with all tiers failed
          setError("Could not find a valid Street View location after multiple attempts. Please try again.");
          setLoading(false);
          return false;
        }
      } catch (err) {
        console.error("General error in fetchRandomStreetViewLocation:", err);

        if (tier < 4 && retryCount < 3) {
          return await fetchRandomStreetViewLocation(retryCount, tier + 1);
        }

        setError("Error finding a location. Please try again.");
        setLoading(false);
        return false;
      }
    },
    [initializeStreetView]
  );

  // Load Google Maps API script
  const loadGoogleMapsScript = useCallback(() => {
    if (mapsScriptLoading || googleMapsLoaded) return;

    setMapsScriptLoading(true);
    console.log("Attempting to load Google Maps script");

    // Create script element
    const script = document.createElement("script");
    script.id = "google-maps-script";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleApiKey}&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    window.initGoogleMaps = () => {
      console.log("Google Maps API loaded successfully");
      setGoogleMapsLoaded(true);
      setMapsScriptLoading(false);

      if (location) {
        setTimeout(initializeStreetView, 300);
      } else {
        fetchRandomStreetViewLocation();
      }
    };

    script.onerror = (error) => {
      console.error("Error loading Google Maps script:", error);
      setMapsScriptLoading(false);
      setError("Failed to load Google Maps. Please check your API key and internet connection.");
    };

    document.head.appendChild(script);
  }, [
    googleApiKey,
    location,
    initializeStreetView,
    fetchRandomStreetViewLocation,
    googleMapsLoaded,
    mapsScriptLoading,
  ]);

  // Fix Leaflet icon issues
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Fix icon issues
    fixLeafletIcons();

    // Load the necessary CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkEl = document.createElement("link");
      linkEl.rel = "stylesheet";
      linkEl.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css";
      document.head.appendChild(linkEl);
    }
  }, []);

  // Load Google Maps API
  useEffect(() => {
    if (!googleApiKey || googleApiKey === "YOUR_API_KEY_HERE") {
      setError("Google Maps API key is not set. Please check your .env.local file.");
      setLoading(false);
      return;
    }

    if (typeof window !== "undefined" && !googleMapsLoaded && !mapsScriptLoading) {
      loadGoogleMapsScript();
    }
  }, [googleApiKey, googleMapsLoaded, mapsScriptLoading, loadGoogleMapsScript]);

  // Initialize Street View after location update
  useEffect(() => {
    if (location && googleMapsLoaded && streetViewContainerRef.current) {
      console.log("Location updated, initializing Street View");
      initializeStreetView();
    }
  }, [location, googleMapsLoaded, initializeStreetView]);

  // Handle submit guess
  const handleSubmitGuess = async () => {
    if (!userGuess || !location) return;

    const calculatedDistance = calculateDistance(
      userGuess.latitude,
      userGuess.longitude,
      location.latitude,
      location.longitude
    );

    setDistance(calculatedDistance);
    setGuessSubmitted(true);

    // Adjust map to show both markers
    if (mapRef.current) {
      console.log("Fitting map to bounds");
      const bounds = L.latLngBounds([userGuess.latitude, userGuess.longitude], [location.latitude, location.longitude]);
      mapRef.current.fitBounds(bounds, { padding: [50, 50] });
    }

    try {
      // Submit guess to API
      await axios.post("/api/guesses", {
        locationId: location.id,
        guessLatitude: userGuess.latitude,
        guessLongitude: userGuess.longitude,
        distance: calculatedDistance,
      });
    } catch (err) {
      console.error("Error submitting guess:", err);
    }
  };

  // Handle new location
  const handleNewLocation = () => {
    setUserGuess(null);
    setGuessSubmitted(false);
    setDistance(null);

    // Reset map view
    if (mapRef.current) {
      mapRef.current.setView([20, 0], 2);
    }

    fetchRandomStreetViewLocation();
  };

  // Calculate score based on distance
  const calculateScore = (distanceKm: number): number => {
    if (distanceKm < 1) return 5000;
    if (distanceKm < 5) return 4500;
    if (distanceKm < 10) return 4000;
    if (distanceKm < 50) return 3000;
    if (distanceKm < 100) return 2000;
    if (distanceKm < 500) return 1000;
    if (distanceKm < 1000) return 500;
    if (distanceKm < 5000) return 250;
    if (distanceKm < 10000) return 100;
    return 0;
  };

  if (loading && !location) {
    return (
      <div className="flex justify-center items-center h-screen flex-col">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <div>Loading game resources...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center max-w-xl">
          <p className="text-red-500 mb-3 font-bold text-lg">{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (!googleMapsLoaded) {
                loadGoogleMapsScript();
              } else {
                fetchRandomStreetViewLocation();
              }
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">GeoGuessor - Google Street View Edition</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Google Street View */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="h-96 relative">
              {loading ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <div
                  ref={streetViewContainerRef}
                  className="w-full h-full"
                  style={{ width: "100%", height: "100%", minHeight: "384px" }}
                />
              )}

              {/* Location info overlay - correctly positioned here */}
              {guessSubmitted && location && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white p-3 z-10">
                  <p>
                    <span className="font-bold">Actual location:</span> {location.city || "Unknown"},{" "}
                    {location.country || "Unknown"}
                  </p>
                  {distance !== null && (
                    <div>
                      <p>
                        <span className="font-bold">Distance:</span> {distance.toFixed(2)} kilometers away
                      </p>
                      <p>
                        <span className="font-bold">Score:</span> {calculateScore(distance)} points
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4">
              {!guessSubmitted ? (
                <button
                  onClick={handleSubmitGuess}
                  disabled={!userGuess}
                  className={`w-full py-2 rounded text-white ${
                    userGuess ? "bg-blue-500 hover:bg-blue-600" : "bg-gray-300"
                  }`}
                >
                  {userGuess ? "Submit Guess" : "Select a location on the map"}
                </button>
              ) : (
                <button
                  onClick={handleNewLocation}
                  className="w-full py-2 bg-green-500 hover:bg-green-600 rounded text-white"
                >
                  Try Another Location
                </button>
              )}
            </div>
          </div>

          {/* World Map - Fixed to ensure proper display */}
          <div className="bg-white rounded-lg shadow overflow-hidden" style={{ height: "400px", position: "relative" }}>
            {/* Essential inline styles to ensure map displays */}
            <style jsx>{`
              .map-container {
                height: 100%;
                width: 100%;
                position: relative;
                z-index: 0;
              }
              .leaflet-container {
                height: 100%;
                width: 100%;
                z-index: 0;
              }
            `}</style>

            <div className="map-container">
              <MapContainer
                center={[20, 0]}
                zoom={2}
                style={{ height: "100%", width: "100%" }}
                worldCopyJump={true}
                attributionControl={true}
                ref={(map) => {
                  if (map) {
                    console.log("Map reference set");
                    mapRef.current = map;

                    // Force map to recalculate its size after mounting
                    setTimeout(() => {
                      if (mapRef.current) {
                        mapRef.current.invalidateSize(true);
                      }
                    }, 200);
                  }
                }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapClickHandler setUserGuess={setUserGuess} />
                <MapControls />

                {/* User guess marker */}
                {userGuess && (
                  <Marker position={[userGuess.latitude, userGuess.longitude]} icon={createCustomIcon("blue")}>
                    <Popup>Your guess</Popup>
                  </Marker>
                )}

                {/* Actual location marker when submitted */}
                {guessSubmitted && location && (
                  <Marker position={[location.latitude, location.longitude]} icon={createCustomIcon("red")}>
                    <Popup>
                      Actual location: {location.city || "Unknown"}, {location.country || "Unknown"}
                    </Popup>
                  </Marker>
                )}

                {/* Draw line between points if guessed */}
                {guessSubmitted && userGuess && location && (
                  <DistanceLine userGuess={userGuess} actualLocation={location} />
                )}
              </MapContainer>
            </div>

            {/* Map instructions */}
            <div className="absolute bottom-2 left-2 bg-white bg-opacity-75 p-2 rounded shadow z-50 text-sm">
              <p>Click anywhere on the map to make your guess</p>
            </div>

            {/* Current guess info */}
            {userGuess && !guessSubmitted && (
              <div className="absolute top-2 left-2 bg-white bg-opacity-75 p-2 rounded shadow z-50">
                <p className="text-sm font-semibold">Your guess:</p>
                <p className="text-xs">Lat: {userGuess.latitude.toFixed(4)}</p>
                <p className="text-xs">Lng: {userGuess.longitude.toFixed(4)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Game instructions */}
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h2 className="text-xl font-semibold mb-2">How to Play</h2>
          <ol className="list-decimal pl-5">
            <li>Look around in Google Street View to figure out where you are</li>
            <li>Click anywhere on the world map to place your guess</li>
            <li>Click &ldquo;Submit Guess&rdquo; to see how close you were</li>
            <li>The closer your guess, the higher your score!</li>
          </ol>
          <p className="mt-2 text-sm text-gray-600">
            Tip: Use landmarks, road signs, architecture, and other clues to determine your location.
          </p>
        </div>
      </div>
    </div>
  );
}
