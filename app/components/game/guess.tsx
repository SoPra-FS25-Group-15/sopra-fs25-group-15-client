/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

// Add a global declaration for the Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useRouter, useParams } from 'next/navigation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMapEvents,
  useMap
} from 'react-leaflet';
import { useGlobalUser } from '@/contexts/globalUser';
import { getApiDomain } from '@/utils/domain';

export default function GameComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();
  const lobbyId = Number(localStorage.getItem('lobbyId'));

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panoramaLoaded, setPanoramaLoaded] = useState(false);
  const [streetViewFailed, setStreetViewFailed] = useState(false);
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Cache pano IDs: key "lat,lng" -> panoId
  const panoCache = useRef<Map<string, string>>(new Map());
  // Single StreetViewPanorama instance
  const panoInstance = useRef<any>(null);
  // Debounce timeout handle
  const fetchDebounce = useRef<any>(null);

  // 1) Fix Leaflet icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
      iconUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl:
        'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    });
  }, []);

  // 2) Hydrate coords from storage
  useEffect(() => {
    const lat = localStorage.getItem('roundLatitude');
    const lng = localStorage.getItem('roundLongitude');
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      console.log('[GameComponent] Hydrating coords:', { latitude, longitude });
      setLocationCoords({ lat: latitude, lng: longitude });
      setPanoramaLoaded(false);
      setStreetViewFailed(false);
      fetchPanoramaAt(latitude, longitude);
    }
  }, []);

  // 3) Inject Google Maps API
  useEffect(() => {
    if (!(window as any).google?.maps && !document.getElementById('gmaps-script')) {
      console.log('[GameComponent] Injecting Google Maps API script');
      const script = document.createElement('script');
      script.id = 'gmaps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=streetview`;
      script.async = true;
      script.defer = true;
      script.onload = () => console.log('[GameComponent] Google Maps API loaded');
      document.head.appendChild(script);
    }
  }, []);

  // 4) Fetch Street View — with cache, reuse, and debounce
  const fetchPanoramaAt = useCallback((lat: number, lng: number) => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;

    if (!window.google?.maps) {
      console.warn('[GameComponent] Google Maps not ready, retrying in 200ms');
      setTimeout(() => fetchPanoramaAt(lat, lng), 200);
      return;
    }

    // If we have cached panoId, reuse immediately
    if (panoCache.current.has(key)) {
      const panoId = panoCache.current.get(key)!;
      console.log('[GameComponent] Cache hit, updating existing panorama to', panoId);
      if (panoInstance.current) {
        panoInstance.current.setPano(panoId);
      }
      setPanoramaLoaded(true);
      return;
    }

    // Debounce rapid calls
    if (fetchDebounce.current) {
      clearTimeout(fetchDebounce.current);
    }
    fetchDebounce.current = setTimeout(() => {
      console.log('[GameComponent] Issuing StreetViewService.getPanorama for', key);
      setPanoramaLoaded(false);
      setStreetViewFailed(false);

      const timeout = setTimeout(() => {
        console.warn('[GameComponent] Street View load timed out—falling back');
        setStreetViewFailed(true);
        setPanoramaLoaded(true);
      }, 7000);

      try {
        const sv = new window.google.maps.StreetViewService();
        sv.getPanorama(
          { location: new window.google.maps.LatLng(lat, lng), radius: 5000 },
          (data: any, status: string) => {
            clearTimeout(timeout);
            setPanoramaLoaded(true);

            if (status === window.google.maps.StreetViewStatus.OK && data.location?.pano) {
              const panoId = data.location.pano;
              panoCache.current.set(key, panoId);

              const container = document.getElementById('street-view-container')!;
              if (!panoInstance.current) {
                console.log('[GameComponent] Creating new panorama instance');
                panoInstance.current = new window.google.maps.StreetViewPanorama(container, {
                  pano: panoId,
                  visible: true,
                  disableDefaultUI: true,
                  pov: { heading: 0, pitch: 0 },
                });
              } else {
                console.log('[GameComponent] Reusing panorama instance with', panoId);
                panoInstance.current.setPano(panoId);
              }
            } else {
              console.warn('[GameComponent] No SV imagery at this location:', status);
              setStreetViewFailed(true);
            }
          }
        );
      } catch (e) {
        clearTimeout(timeout);
        console.error('[GameComponent] Failed to call getPanorama:', e);
        setStreetViewFailed(true);
        setPanoramaLoaded(true);
      }
    }, 300);
  }, []);

  // 5) STOMP subscription
  useEffect(() => {
    if (!user?.token || !lobbyId) {
      console.warn('[GameComponent] Skipping STOMP (no token or lobbyId)');
      return;
    }
    console.log('[GameComponent] STOMP → setting up for lobby', lobbyId);
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('[GameComponent] STOMP connected, subscribing /topic/lobby/' + lobbyId + '/game');
        client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg) => {
          const evt = JSON.parse(msg.body);
          console.log('[GameComponent] ← event:', evt);

          if (evt.type === 'ROUND_START') {
            const dto = evt.payload.roundData;
            console.log('[GameComponent] Handling ROUND_START:', dto);
            setGuessSubmitted(false);
            setUserGuess(null);
            setLocationCoords({ lat: dto.latitude, lng: dto.longitude });
            fetchPanoramaAt(dto.latitude, dto.longitude);
            localStorage.setItem('roundLatitude', dto.latitude.toString());
            localStorage.setItem('roundLongitude', dto.longitude.toString());
          } else if (evt.type === 'ROUND_WINNER') {
            localStorage.setItem('roundWinnerEvent', JSON.stringify(evt));
            router.push(`/games/${code}/results`);
          }
        });
      },
      onStompError: (frame) => console.error('[GameComponent] STOMP error:', frame),
      onDisconnect: () => console.log('[GameComponent] STOMP disconnected'),
    });

    client.activate();
    stompClientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [user?.token, lobbyId, fetchPanoramaAt, router, code]);

  // 6) Map invalidation
  function MapSetup() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      map.invalidateSize();
    }, [map]);
    return null;
  }

  // 7) Map click handler
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (!guessSubmitted) {
          console.log('[GameComponent] Map click:', e.latlng);
          setUserGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      },
    });
    return null;
  }

  // 8) Submit guess
  const handleSubmit = () => {
    if (!userGuess || !stompClientRef.current?.connected) {
      console.warn('[GameComponent] Cannot submit guess');
      return;
    }
    console.log('[GameComponent] Publishing guess:', userGuess);
    stompClientRef.current.publish({
      destination: `/app/lobby/${lobbyId}/game/guess`,
      body: JSON.stringify({ latitude: userGuess.lat, longitude: userGuess.lng }),
    });
    setGuessSubmitted(true);
    if (mapRef.current && locationCoords) {
      mapRef.current.fitBounds(
        [
          [userGuess.lat, userGuess.lng],
          [locationCoords.lat, locationCoords.lng],
        ],
        { padding: [20, 20] }
      );
    }
  };

  // ————————— Debug render state —————————
  console.log(
    '[GameComponent] render:',
    'locationCoords=', locationCoords,
    'userGuess=', userGuess,
    'guessSubmitted=', guessSubmitted
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Fullscreen Street View */}
      {!streetViewFailed && (
        <div
          id="street-view-container"
          style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'black',
            zIndex: 0,
          }}
        >
          {!panoramaLoaded && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', color: 'white',
            }}>
              Loading Street View…
            </div>
          )}
        </div>
      )}

      {/* Mini map + submit button */}
      {locationCoords && (
        <div
          style={{
            position: 'absolute',
            bottom: '6rem',
            right: '1rem',
            width: 256,
            height: 192,
            zIndex: 10,
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: 8,
            overflow: 'hidden',
          }}
        >
          <MapContainer center={[20, 0]} zoom={2} style={{ width: '100%', height: '100%' }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSetup />
            <MapClickHandler />
            {userGuess && (
              <Marker position={[userGuess.lat, userGuess.lng]}>
                <Popup>Your guess</Popup>
              </Marker>
            )}
            {guessSubmitted && locationCoords && (
              <Marker position={[locationCoords.lat, locationCoords.lng]}>
                <Popup>Target</Popup>
              </Marker>
            )}
          </MapContainer>
          {!guessSubmitted && (
            <button
              onClick={handleSubmit}
              disabled={!userGuess}
              style={{
                position: 'absolute',
                bottom: 8,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '0.5rem 1rem',
                borderRadius: 4,
                background: '#007bff',
                color: 'white',
                border: 'none',
                cursor: userGuess ? 'pointer' : 'not-allowed',
                zIndex: 20,
              }}
            >
              Submit Guess
            </button>
          )}
        </div>
      )}

      {/* LOCK IN button */}
      {locationCoords && (
        <button
          onClick={handleSubmit}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '1rem',
            padding: '0.75rem 1.5rem',
            color: '#fff',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: 8,
            backgroundColor: '#e53e3e',
            cursor: 'pointer',
            zIndex: 20,
          }}
        >
          LOCK IN
        </button>
      )}
    </div>
  );
}
