"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { Client } from '@stomp/stompjs';
import { useGlobalUser } from "@/contexts/globalUser";
import SockJS from 'sockjs-client';
// Define type for Leaflet's Icon Default prototype
interface IconDefaultPrototype {
  _getIconUrl?: string;
}

// Google Maps Event listener type
interface MapsEventListener {
  remove: () => void;
}

// Fix Leaflet icon issues in Next.js
const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};

// Create custom marker icons
const createCustomIcon = (color: string = 'blue') => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
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
        event: {
          addListenerOnce: (instance: object, eventName: string, handler: () => void) => MapsEventListener;
          addListener: (instance: object, eventName: string, handler: () => void) => MapsEventListener;
          removeListener: (listener: MapsEventListener) => void;
        };
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
  getPanorama(request: StreetViewPanoramaRequest, callback: (data: GoogleMapsStreetViewPanoramaData, status: string) => void): void;
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
  motionTracking?: boolean;
  motionTrackingControl?: boolean;
}

interface StreetViewPanorama {
  setPano(panoId: string): void;
  setVisible(visible: boolean): void;
  setPov(pov: { heading: number, pitch: number }): void;
  setZoom(zoom: number): void;
}

// WebSocket message interfaces
interface GuessMessage {
  latitude: number;
  longitude: number;
  guess?: number; // For backward compatibility
}

interface WebSocketGameState {
  roundNumber: number;
  timeRemaining: number;
  correctLocation?: {
    latitude: number;
    longitude: number;
    country: string;
    city?: string;
  };
  playerGuesses?: Record<string, number>;
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

// Map Click Handler Component - Only allows clicks when guess is not submitted
function MapClickHandler({ setUserGuess, guessSubmitted }: { setUserGuess: (guess: Guess | null) => void, guessSubmitted: boolean }) {
  useMapEvents({
    click: (e) => {
      // Ignore clicks if guess is already submitted
      if (guessSubmitted) {
        console.log("Map click ignored - guess already submitted");
        return;
      }
      
      console.log("Map clicked at:", e.latlng);
      
      // Ensure the longitude is within bounds (-180 to 180)
      let lng = e.latlng.lng;
      if (lng < -180) lng = -180;
      if (lng > 180) lng = 180;
      
      // Update user guess
      const newGuess = {
        latitude: e.latlng.lat,
        longitude: lng
      };
      console.log("Setting new user guess:", newGuess);
      
      setUserGuess(newGuess);
    }
  });

  return null;
}

// Map Bounds Handler
function MapBoundsHandler() {
  const map = useMap();
  
  useEffect(() => {
    // Add event listener for dragend to ensure map stays within bounds
    const handleDragEnd = () => {
      const center = map.getCenter();
      let lng = center.lng;
      let lat = center.lat;
      
      // Restrict longitude to -180 to 180
      if (lng < -180) lng = -180;
      if (lng > 180) lng = 180;
      
      // Restrict latitude to -90 to 90
      if (lat < -90) lat = -90;
      if (lat > 90) lat = 90;
      
      // If the center has been modified, pan to the corrected position
      if (lng !== center.lng || lat !== center.lat) {
        map.panTo([lat, lng], { animate: false });
      }
    };
    
    map.on('dragend', handleDragEnd);
    
    return () => {
      map.off('dragend', handleDragEnd);
    };
  }, [map]);
  
  return null;
}

// Map Resize Handler Component
function MapResizeHandler() {
  const map = useMap();
  
  useEffect(() => {
    // Initial resize
    map.invalidateSize(true);
    
    // Handle window resize events
    const handleResize = () => {
      map.invalidateSize(true);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Schedule multiple resizes
    const resizeTimeouts = [100, 500, 1000].map(delay => 
      setTimeout(() => map.invalidateSize(true), delay)
    );
    
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeTimeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [map]);
  
  return null;
}

// Component to draw line between guess and actual location
function DistanceLine({ userGuess, actualLocation }: { userGuess: Guess, actualLocation: Location }) {
  const map = useMap();
  const lineRef = useRef<L.Polyline | null>(null);

  useEffect(() => {
    if (!userGuess || !actualLocation) return;
    
    const linePoints: [number, number][] = [
      [userGuess.latitude, userGuess.longitude],
      [actualLocation.latitude, actualLocation.longitude]
    ];
    
    // Remove existing line if it exists
    if (lineRef.current) {
      map.removeLayer(lineRef.current);
    }
    
    // Create new line
    lineRef.current = L.polyline(linePoints, {
      color: 'red',
      weight: 2,
      opacity: 0.7,
      dashArray: '5, 10'
    }).addTo(map);
    
    // Clean up function
    return () => {
      if (lineRef.current) {
        map.removeLayer(lineRef.current);
        lineRef.current = null;
      }
    };
  }, [map, userGuess, actualLocation]);

  return null;
}

// Component to manage map interactivity based on game state
function MapInteractivityManager({ guessSubmitted }: { guessSubmitted: boolean }) {
  const map = useMap();
  
  useEffect(() => {
    if (guessSubmitted) {
      // Disable all interactions after guess is submitted
      map.dragging.disable();
      map.touchZoom.disable();
      map.doubleClickZoom.disable();
      map.scrollWheelZoom.disable();
      map.boxZoom.disable();
      map.keyboard.disable();
      
      // Handle tap with type safety
      // @ts-expect-error - Leaflet types don't include tap, but it exists at runtime for touch devices
      if (map.tap) {
        // @ts-expect-error - Accessing tap property which exists at runtime
        map.tap.disable();
      }
      
      // Add a class to indicate map is locked
      const mapContainer = map.getContainer();
      if (mapContainer) {
        mapContainer.classList.add('map-locked');
        mapContainer.style.cursor = 'default';
      }
      
      console.log("Map interactions disabled after guess submission");
    } else {
      // Re-enable all interactions for a new round
      map.dragging.enable();
      map.touchZoom.enable();
      map.doubleClickZoom.enable();
      map.scrollWheelZoom.enable();
      map.boxZoom.enable();
      map.keyboard.enable();
      
      // Handle tap with type safety
      // @ts-expect-error - Leaflet types don't include tap, but it exists at runtime for touch devices
      if (map.tap) {
        // @ts-expect-error - Accessing tap property which exists at runtime
        map.tap.enable();
      }
      
      // Remove the locked class
      const mapContainer = map.getContainer();
      if (mapContainer) {
        mapContainer.classList.remove('map-locked');
        mapContainer.style.cursor = '';
      }
      
      console.log("Map interactions enabled for new round");
    }
  }, [map, guessSubmitted]);
  
  return null;
}

export default function GameComponent({ lobbyId = 1, userId = 1 }: { lobbyId?: number; userId?: number }) {
  // Google Street View references
  const panoramaRef = useRef<StreetViewPanorama | null>(null);
  const streetViewContainerRef = useRef<HTMLDivElement | null>(null);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);
  const [mapsScriptLoading, setMapsScriptLoading] = useState<boolean>(false);
  // State to track panorama loading
  const [panoramaLoaded, setPanoramaLoaded] = useState<boolean>(false);

  const [location, setLocation] = useState<Location | null>(null);
  const [userGuess, setUserGuess] = useState<Guess | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState<boolean>(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showMap] = useState<boolean>(true);
  const mapRef = useRef<L.Map | null>(null);
  // Add a ref for the button to check rendering
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const { user } = useGlobalUser();
  // WebSocket client
  const stompClientRef = useRef<Client | null>(null);
  const [gameState, setGameState] = useState<WebSocketGameState | null>(null);
  
  // Google Maps API key
  const googleApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  // Initialize WebSocket connection
  useEffect(() => {
    if (!lobbyId || !userId || !user) return;
    
    // The key difference: pass token as URL parameter instead of only in headers
    const socketUrl = `http://localhost:8080/ws/lobby?token=${user.token}`;
    
    if (!user.token) {
      console.error("Token is missing");
      return;
    }
    
    const stompClient = new Client({
      // Use SockJS with token in the URL
      webSocketFactory: () => new SockJS(socketUrl),
      // Still include token in connect headers for subsequent STOMP frames
      connectHeaders: {
        'Authorization': `Bearer ${user.token}`,
      },
      debug: function (str) {
        console.log(`STOMP: ${str}`);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });
    
    stompClient.onConnect = () => {
      console.log('Connected to WebSocket');
      
      // Subscribe to lobby game state updates
      stompClient.subscribe(`/topic/lobby/${lobbyId}/game/state`, (message) => {
        try {
          const gameState = JSON.parse(message.body);
          setGameState(gameState);
          
          if (gameState.correctLocation) {
            const serverLocation = {
              id: `server-location-${gameState.roundNumber}`,
              latitude: gameState.correctLocation.latitude,
              longitude: gameState.correctLocation.longitude,
              panoId: '',
              country: gameState.correctLocation.country,
              city: gameState.correctLocation.city
            };
            setLocation(serverLocation);
            
            if (gameState.playerGuesses && gameState.playerGuesses[userId.toString()]) {
              setDistance(gameState.playerGuesses[userId.toString()]);
            }
          }
        } catch (error) {
          console.error('Error parsing game state message:', error);
        }
      });
      
      // Subscribe to personal game result
      stompClient.subscribe(`/user/queue/lobby/${lobbyId}/game/result`, (message) => {
        try {
          const result = JSON.parse(message.body);
          console.log('Received personal result:', result);
        } catch (error) {
          console.error('Error parsing result message:', error);
        }
      });
    };
    
    stompClient.onStompError = (frame) => {
      console.error('STOMP error:', frame.headers.message);
      setError(`WebSocket error: ${frame.headers.message}`);
    };
    
    try {
      stompClient.activate();
      stompClientRef.current = stompClient;
    } catch (error) {
      console.error('Error activating STOMP client:', error);
    }
    
    return () => {
      if (stompClientRef.current && stompClientRef.current.connected) {
        try {
          stompClientRef.current.deactivate();
        } catch (error) {
          console.error('Error deactivating STOMP client:', error);
        }
      }
    };
  }, [lobbyId, userId, user]);
  

  // Initialize Street View panorama
  const initializeStreetView = useCallback(() => {
    console.log("initializeStreetView called - location:", !!location, "streetViewContainer:", !!streetViewContainerRef.current, "googleMaps:", !!(window.google && window.google.maps));
    
    if (!location || !streetViewContainerRef.current || !window.google || !window.google.maps) {
      console.log("Cannot initialize Street View:", {
        location: !!location,
        container: !!streetViewContainerRef.current,
        googleMaps: !!(window.google && window.google.maps)
      });
      return;
    }
    
    // Reset panorama loaded state when initializing a new panorama
    setPanoramaLoaded(false);
    console.log("Setting panoramaLoaded to FALSE before initializing new panorama");
    
    try {
      console.log("Initializing Street View with panoId:", location.panoId);
      
      // Make sure container is visible and properly sized
      if (streetViewContainerRef.current) {
        streetViewContainerRef.current.style.width = '100%';
        streetViewContainerRef.current.style.height = '100%';
      }
      
      if (!panoramaRef.current) {
        // Try to get a fresh container element
        const container = document.getElementById('street-view-container') || streetViewContainerRef.current;
        
        console.log("Creating new panorama instance");
        panoramaRef.current = new window.google.maps.StreetViewPanorama(container, {
          pano: location.panoId,
          visible: true,
          pov: {
            heading: Math.floor(Math.random() * 360),
            pitch: 0
          },
          zoom: 0,
          linksControl: false,
          panControl: true,
          enableCloseButton: false,
          addressControl: false,
          fullscreenControl: false
        });
        
        // Add event listener for when panorama is fully loaded
        if (panoramaRef.current) {
          console.log("Adding status_changed listener to new panorama");
          // Using status_changed event to detect when panorama is ready
          window.google.maps.event.addListenerOnce(panoramaRef.current, 'status_changed', () => {
            console.log("Street View panorama tiles loaded");
            setPanoramaLoaded(true);
            console.log("DEBUG: Panorama loaded state set to TRUE");
          });
        }
        
        console.log("Street View panorama created", panoramaRef.current);
      } else {
        console.log("Updating existing panorama");
        panoramaRef.current.setPano(location.panoId);
        panoramaRef.current.setPov({
          heading: Math.floor(Math.random() * 360),
          pitch: 0
        });
        panoramaRef.current.setVisible(true);
        
        // Add event listener for when the new panorama is loaded
        console.log("Adding status_changed listener to existing panorama");
        window.google.maps.event.addListenerOnce(panoramaRef.current, 'status_changed', () => {
          console.log("Existing panorama tiles loaded");
          setPanoramaLoaded(true);
          console.log("DEBUG: Panorama loaded state set to TRUE");
        });
        
        console.log("Existing panorama updated");
      }
    } catch (error) {
      console.error("Error initializing Street View:", error);
      setError("Failed to initialize Street View. Please try refreshing the page.");
    }
  }, [location]);

  // Fetch random Street View location
  const fetchRandomStreetViewLocation = useCallback(async (retryCount = 0, tier = 0): Promise<boolean> => {
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
          streetViewService.getPanorama({
            location: location,
            radius: searchRadius,
            source: 'outdoor'
          }, (data: GoogleMapsStreetViewPanoramaData, status: string) => {
            if (status === window.google.maps.StreetViewStatus.OK) {
              resolve(data);
            } else {
              reject(status);
            }
          });
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
            country: geoResponse.data.address.country || 'Unknown',
            city: geoResponse.data.address.city || 
                  geoResponse.data.address.town || 
                  geoResponse.data.address.village || 
                  geoResponse.data.address.county ||
                  'Unknown'
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
            country: 'Unknown',
            city: 'Unknown'
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
  }, [initializeStreetView, lobbyId]);

  // Load Google Maps API script
  const loadGoogleMapsScript = useCallback(() => {
    if (mapsScriptLoading || googleMapsLoaded) return;
    
    setMapsScriptLoading(true);
    console.log("Attempting to load Google Maps script");
    
    // Create script element
    const script = document.createElement('script');
    script.id = 'google-maps-script';
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
  }, [googleApiKey, location, initializeStreetView, fetchRandomStreetViewLocation, googleMapsLoaded, mapsScriptLoading]);

  // Fix Leaflet icon issues and add styles
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Fix icon issues
    fixLeafletIcons();
    
    // Load the necessary CSS
    if (!document.querySelector('link[href*="leaflet.css"]')) {
      const linkEl = document.createElement('link');
      linkEl.rel = 'stylesheet';
      linkEl.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/leaflet.css';
      document.head.appendChild(linkEl);
    }
    
    // Add custom CSS for the locked map state
    const style = document.createElement('style');
    style.textContent = `
      .map-locked {
        pointer-events: none !important;
      }
      .map-locked .leaflet-marker-icon {
        pointer-events: none !important;
      }
      .locked-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0,0,0,0.05);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      }
      .locked-icon {
        font-size: 24px;
        color: rgba(0,0,0,0.5);
        background: rgba(255,255,255,0.7);
        border-radius: 50%;
        padding: 10px;
      }
      button:disabled {
        opacity: 0.5;
        cursor: not-allowed !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  // Load Google Maps API
  useEffect(() => {
    if (!googleApiKey || googleApiKey === "YOUR_API_KEY_HERE") {
      setError("Google Maps API key is not set. Please check your .env.local file.");
      setLoading(false);
      return;
    }

    if (typeof window !== 'undefined' && !googleMapsLoaded && !mapsScriptLoading) {
      loadGoogleMapsScript();
    }
  }, [googleApiKey, googleMapsLoaded, mapsScriptLoading, loadGoogleMapsScript]);

  // Initialize Street View after location update
  useEffect(() => {
    if (location && googleMapsLoaded && streetViewContainerRef.current) {
      console.log("Location updated, initializing Street View");
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        initializeStreetView();
        // Force resize event to help panorama render correctly
        if (window.google && window.google.maps) {
          const resizeEvent = window.document.createEvent('UIEvents');
          resizeEvent.initUIEvent('resize', true, false, window, 0);
          window.dispatchEvent(resizeEvent);
        }
      }, 500);
    }
  }, [location, googleMapsLoaded, initializeStreetView]);

  // Handle proper map resizing when panorama loads
  useEffect(() => {
    if (panoramaLoaded && mapRef.current) {
      console.log("Panorama loaded, forcing map refresh");
      
      // Initial resize
      mapRef.current.invalidateSize(true);
      
      // Multiple scheduled resizes with increasing delays to ensure map tiles load
      const delays = [100, 300, 500, 1000, 2000];
      delays.forEach(delay => {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.invalidateSize(true);
            console.log(`Map size invalidated after ${delay}ms`);
          }
        }, delay);
      });

      // One final resize after everything should be stable
      setTimeout(() => {
        if (mapRef.current) {
          // Force bounds update to ensure all tiles are properly loaded
          const currentCenter = mapRef.current.getCenter();
          mapRef.current.setView(currentCenter, mapRef.current.getZoom());
          console.log("Map view reset to refresh tiles");
        }
      }, 2500);
    }
  }, [panoramaLoaded]);

  // Handle submit guess using WebSocket
  const handleSubmitGuess = useCallback(() => {
    if (!userGuess || !location || !stompClientRef.current || !stompClientRef.current.connected) return;
    
    console.log("Submitting guess:", userGuess);
    
    // Set local state for UI feedback
    setGuessSubmitted(true);
    console.log("DEBUG: Guess submitted set to TRUE");
    
    // Adjust map to show both markers
    if (mapRef.current) {
      console.log("Fitting map to bounds");
      const bounds = L.latLngBounds(
        [userGuess.latitude, userGuess.longitude],
        [location.latitude, location.longitude]
      );
      mapRef.current.fitBounds(bounds, { padding: [30, 30] });
    }
    
    try {
      // Send guess to backend via WebSocket
      // Modified to send coordinates instead of pre-calculating distance
      const guessMessage: GuessMessage = {
        latitude: userGuess.latitude,
        longitude: userGuess.longitude
      };
      
      stompClientRef.current.publish({
        destination: `/app/lobby/${lobbyId}/game/guess`,
        body: JSON.stringify(guessMessage)
      });
      
      console.log("Guess sent to server:", guessMessage);
      
    } catch (err) {
      console.error('Error submitting guess:', err);
    }
  }, [userGuess, location, lobbyId, userId]);

  // Handle new location - this could be triggered by server in a multiplayer context
  const handleNewLocation = useCallback(() => {
    setUserGuess(null);
    setGuessSubmitted(false);
    console.log("DEBUG: Guess submitted reset to FALSE");
    setDistance(null);
    
    // Reset map view and panorama loaded state
    setPanoramaLoaded(false);
    console.log("DEBUG: Panorama loaded reset to FALSE");
    if (mapRef.current) {
      mapRef.current.setView([20, 0], 2);
    }
    
    // In a multiplayer game, the host would call this method to start a new round
    if (stompClientRef.current && stompClientRef.current.connected) {
      // Notify server we want to start a new round
      stompClientRef.current.publish({
        destination: `/app/lobby/${lobbyId}/game/nextRound`,
        body: JSON.stringify({})
      });
    } else {
      // For single player mode or testing
      fetchRandomStreetViewLocation();
    }
  }, [fetchRandomStreetViewLocation, lobbyId]);

  // Start the game - only called by the host
  const startGame = useCallback((roundCount: number = 5, roundTime: number = 60) => {
    if (!stompClientRef.current || !stompClientRef.current.connected) return;
    
    stompClientRef.current.publish({
      destination: `/app/lobby/${lobbyId}/game/start`,
      body: JSON.stringify({
        roundCount: roundCount,
        roundTime: roundTime
      })
    });
    
    console.log(`Game started with ${roundCount} rounds, ${roundTime} seconds per round`);
  }, [lobbyId]);

  // Effect to log debug info about button visibility
  useEffect(() => {
    if (!guessSubmitted && panoramaLoaded) {
      console.log("Button should be visible - checking...");
      
      // Small delay to allow React to render
      setTimeout(() => {
        const button = document.getElementById('main-lock-button');
        if (!button) {
          console.error("Button expected but not found in DOM!");
        } else {
          console.log("Button is present as expected");
        }
      }, 100);
    }
  }, [guessSubmitted, panoramaLoaded, userGuess]);

  // Handle game state updates from the server
  useEffect(() => {
    if (!gameState) return;
    
    console.log("Game state updated:", gameState);
    
    // If the server provides the correct location and round is over
    if (gameState.correctLocation && gameState.timeRemaining === 0) {
      // Show the correct location on the map
      const serverLocation: Location = {
        id: `server-location-${gameState.roundNumber}`,
        latitude: gameState.correctLocation.latitude,
        longitude: gameState.correctLocation.longitude,
        panoId: location?.panoId || '', // Keep the current panoId if available
        country: gameState.correctLocation.country,
        city: gameState.correctLocation.city
      };
      
      setLocation(serverLocation);
      setGuessSubmitted(true);
    }
    
    // Update distance if provided by the server
    if (gameState.playerGuesses && gameState.playerGuesses[userId.toString()]) {
      const serverDistance = gameState.playerGuesses[userId.toString()];
      setDistance(serverDistance);
    }
    
  }, [gameState, location, userId]);

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
    <div className="relative h-screen w-full overflow-hidden">
      {/* Debug overlay */}
      {panoramaLoaded && (
        <div className="absolute top-0 left-0 bg-black bg-opacity-50 text-white p-2 z-[1005] text-xs" style={{ maxWidth: '300px' }}>
          <p>panoramaLoaded: {panoramaLoaded ? 'true' : 'false'}</p>
          <p>guessSubmitted: {guessSubmitted ? 'true' : 'false'}</p>
          <p>userGuess: {userGuess ? 'set' : 'not set'}</p>
          <p>showMap: {showMap ? 'true' : 'false'}</p>
          <p>buttonRef exists: {buttonRef.current ? 'yes' : 'no'}</p>
          <p>Button should be visible: {(!guessSubmitted && panoramaLoaded) ? 'yes' : 'no'}</p>
          <p>WebSocket: {stompClientRef.current?.connected ? 'connected' : 'disconnected'}</p>
          {gameState && (
            <>
              <p>Round: {gameState.roundNumber}</p>
              <p>Time: {gameState.timeRemaining}s</p>
            </>
          )}
        </div>
      )}

      {/* Game timer display */}
      {gameState && (
        <div className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white px-4 py-2 rounded-lg z-[1004]">
          <p className="text-center">
            <span className="font-bold">Round {gameState.roundNumber}</span> • 
            <span className={gameState.timeRemaining < 10 ? 'text-red-500 font-bold ml-2' : 'ml-2'}>
              {gameState.timeRemaining}s
            </span>
          </p>
        </div>
      )}

      {/* Google Street View - Takes up entire screen */}
      <div className="w-full h-full">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div 
            ref={streetViewContainerRef} 
            id="street-view-container"
            className="w-full h-full"
            style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
          />
        )}
      </div>
      
      {/* Location info overlay - displays after guess is submitted */}
      {guessSubmitted && location && (
        <div className="absolute top-14 left-0 right-0 mx-auto w-max bg-black bg-opacity-70 text-white p-3 z-[1004] rounded-lg shadow-lg">
          <p>
            <span className="font-bold">Actual location:</span> {location.city || 'Unknown'}, {location.country || 'Unknown'}
          </p>
          {distance !== null && (
            <div>
              <p>
                <span className="font-bold">Distance:</span> {distance.toFixed(2)} kilometers away
              </p>
            </div>
          )}
          {/* Only show new location button for the host or in single player mode */}
          <button
            onClick={handleNewLocation}
            className="w-full mt-2 py-1 bg-green-500 hover:bg-green-600 rounded text-white"
          >
            {gameState ? 'Next Round' : 'New Location'}
          </button>
        </div>
      )}
      
      {/* Map overlay */}
      {showMap && panoramaLoaded && (
        <div 
          className="absolute rounded-lg shadow-lg overflow-hidden"
          style={{
            width: '300px',
            height: '225px',
            right: '20px',
            bottom: '100px',
            zIndex: 1001,
            position: 'absolute'
          }}
          id="map-container"
        >
          {/* Map container with full height */}
          <div className="h-full w-full relative" id="map-inner-container">
            <MapContainer
              center={[20, 0]}
              zoom={2}
              style={{ height: '100%', width: '100%', position: 'absolute', top: 0, left: 0 }}
              worldCopyJump={false}
              attributionControl={false}
              zoomControl={false}
              maxBounds={[[-90, -180], [90, 180]]}
              maxBoundsViscosity={1.0}
              minZoom={2}
              ref={(map) => {
                if (map) {
                  mapRef.current = map;
                  // Force immediate resize
                  map.invalidateSize(true);
                  
                  // Add additional resize calls with increasing delays
                  setTimeout(() => map.invalidateSize(true), 100);
                  setTimeout(() => map.invalidateSize(true), 500);
                  setTimeout(() => map.invalidateSize(true), 1000);
                }
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                bounds={[[-90, -180], [90, 180]]}
                noWrap={true}
              />
              
              <MapClickHandler setUserGuess={setUserGuess} guessSubmitted={guessSubmitted} />
              <MapResizeHandler />
              <MapBoundsHandler />
              <MapInteractivityManager guessSubmitted={guessSubmitted} />
              
              {/* User guess marker */}
              {userGuess && (
                <Marker 
                  position={[userGuess.latitude, userGuess.longitude]}
                  icon={createCustomIcon('blue')}
                >
                  <Popup>Your guess</Popup>
                </Marker>
              )}
              
              {/* Actual location marker when submitted */}
              {guessSubmitted && location && (
                <Marker
                  position={[location.latitude, location.longitude]}
                  icon={createCustomIcon('red')}
                >
                  <Popup>
                    Actual location: {location.city || 'Unknown'}, {location.country || 'Unknown'}
                  </Popup>
                </Marker>
              )}
              
              {/* Draw line between points if guessed */}
              {guessSubmitted && userGuess && location && (
                <DistanceLine 
                  userGuess={userGuess} 
                  actualLocation={location} 
                />
              )}
            </MapContainer>
            
            {/* Add a visual locked overlay when the guess is submitted */}
            {guessSubmitted && (
              <div className="locked-overlay">
                <div className="locked-icon">🔒</div>
              </div>
            )}
          </div>
          
          {/* Map controls - positioned as overlay in the upper left corner */}
          <div className="absolute top-2 left-2 z-[1002] flex flex-col space-y-2">
            <button 
              onClick={() => !guessSubmitted && mapRef.current?.zoomIn()} 
              className={`w-8 h-8 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none ${guessSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Zoom in"
              disabled={guessSubmitted}
            >
              <span className="text-lg">+</span>
            </button>
            <button 
              onClick={() => !guessSubmitted && mapRef.current?.zoomOut()} 
              className={`w-8 h-8 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none ${guessSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Zoom out"
              disabled={guessSubmitted}
            >
              <span className="text-lg">−</span>
            </button>
            <button 
              onClick={() => !guessSubmitted && mapRef.current?.setView([20, 0], 2)} 
              className={`w-8 h-8 bg-white flex items-center justify-center rounded shadow hover:bg-gray-100 focus:outline-none ${guessSubmitted ? 'opacity-50 cursor-not-allowed' : ''}`}
              title="Reset view"
              disabled={guessSubmitted}
            >
              <span className="text-lg">⟲</span>
            </button>
          </div>
          
          {/* Current guess info */}
          {userGuess && !guessSubmitted && (
            <div className="absolute top-1 right-1 bg-white bg-opacity-75 p-1 rounded text-xs" style={{ zIndex: 1002 }}>
              <p className="font-semibold">Your guess:</p>
              <p>Lat: {userGuess.latitude.toFixed(4)}</p>
              <p>Lng: {userGuess.longitude.toFixed(4)}</p>
            </div>
          )}
        </div>
      )}
    
      {/* Main Lock In Button - Centered at bottom */}
      <div
        id="main-lock-button-container"
        style={{
          position: 'fixed',
          bottom: '3rem',
          right: '1rem',
          display: 'flex',
          zIndex: 9999,
          pointerEvents: 'auto'
        }}
      >
        <button
          id="main-lock-button"
          ref={buttonRef}
          onClick={handleSubmitGuess}
          disabled={!userGuess || guessSubmitted || (gameState ? gameState.timeRemaining <= 0 : false)}
          className={`
            py-3 rounded-lg 
            font-bold text-white text-lg
            shadow-lg border-2 border-white
            transition-colors duration-200
            ${userGuess && !guessSubmitted ? 'bg-red-600 hover:bg-red-700 cursor-pointer' : 'bg-gray-500 cursor-not-allowed'}
          `}
          style={{
            position: 'relative',
            display: (!guessSubmitted && panoramaLoaded) ? 'block' : 'none',
            opacity: 1,
            visibility: (!guessSubmitted && panoramaLoaded) ? 'visible' : 'hidden',
            width: '300px'
          }}
        >
          {'LOCK IN'}
        </button>
      </div>
      
      {/* Game controls - for host only */}
      {!gameState && (
        <div 
          className="absolute top-4 left-4 z-[1004] bg-black bg-opacity-70 p-3 rounded-lg shadow-lg"
        >
          <button
            onClick={() => startGame(5, 60)}
            className="py-2 px-4 bg-green-500 hover:bg-green-600 text-white rounded-lg"
          >
            Start Game (5 rounds)
          </button>
        </div>
      )}
    </div>
  );}
