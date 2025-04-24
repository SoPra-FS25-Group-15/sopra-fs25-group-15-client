/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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

declare global {
  interface Window {
    google: {
      maps: {
        StreetViewService: any;
        StreetViewStatus: { OK: string };
        LatLng: new (lat: number, lng: number) => any;
        StreetViewPanorama: any;
      };
    };
  }
}

interface GuessMessage {
  latitude: number;
  longitude: number;
}

interface RoundStartDTO {
  round: number;
  latitude: number;
  longitude: number;
  roundTime: number;
}

interface RoundWinnerEvent {
  type: 'ROUND_WINNER';
  winnerUsername: string;
  round: number;
  distance?: number;
}

export default function GameComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();
  const lobbyId = Number(localStorage.getItem('lobbyId'));

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panoramaLoaded, setPanoramaLoaded] = useState(false);
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);

  const stompClientRef = useRef<Client | null>(null);
  const mapRef = useRef<L.Map | null>(null);

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

  // 2) Load coords from localStorage on mount
  useEffect(() => {
    const lat = localStorage.getItem('roundLatitude');
    const lng = localStorage.getItem('roundLongitude');
    if (lat && lng) {
      const latitude = parseFloat(lat);
      const longitude = parseFloat(lng);
      console.log('[GameComponent] Hydrating coords from storage:', { latitude, longitude });
      setLocationCoords({ lat: latitude, lng: longitude });
      setPanoramaLoaded(false);
      fetchPanoramaAt(latitude, longitude);
    }
  }, []);

  // 3) Load Google Maps API once
  useEffect(() => {
    if (!(window as any).google?.maps && !document.getElementById('gmaps-script')) {
      const script = document.createElement('script');
      script.id = 'gmaps-script';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.onload = () => console.log('[GameComponent] Google Maps API loaded');
      document.head.appendChild(script);
    }
  }, []);

  // 4) Fetch Street View panorama
  const fetchPanoramaAt = useCallback((lat: number, lng: number) => {
    if (!window.google?.maps) {
      setTimeout(() => fetchPanoramaAt(lat, lng), 200);
      return;
    }
    const sv = new window.google.maps.StreetViewService();
    sv.getPanorama(
      { location: new window.google.maps.LatLng(lat, lng), radius: 5000 },
      (data: any, status: string) => {
        const container = document.getElementById('street-view-container')!;
        let pano = (container as any).__panoInstance as typeof window.google.maps.StreetViewPanorama;
        if (status === window.google.maps.StreetViewStatus.OK && data.location?.pano) {
          if (!pano) {
            pano = new window.google.maps.StreetViewPanorama(container, {
              pano: data.location.pano,
              visible: true,
              pov: { heading: 0, pitch: 0 },
            });
            (container as any).__panoInstance = pano;
          } else {
            pano.setPano(data.location.pano);
          }
        } else {
          console.warn('[GameComponent] No Street View available at', { lat, lng });
        }
        setPanoramaLoaded(true);
      }
    );
  }, []);

  // 5) STOMP subscription for ROUND_START and ROUND_WINNER
  useEffect(() => {
    if (!user?.token || !lobbyId) {
      console.warn('[GameComponent] Missing token or lobbyId, skipping STOMP setup');
      return;
    }
    const client = new Client({
      webSocketFactory: () =>
        new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        console.log(`[GameComponent] STOMP connected, subscribing to /topic/lobby/${lobbyId}/game`);
        client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg) => {
          let evt: any;
          try {
            evt = JSON.parse(msg.body);
          } catch (err) {
            console.error('[GameComponent] Failed to parse STOMP message:', msg.body, err);
            return;
          }
          console.log('[GameComponent] ← received event:', evt);

          if (evt.type === 'ROUND_START') {
            const dto: RoundStartDTO = evt.payload.roundData;
            console.log('[GameComponent] Handling ROUND_START:', dto);
            setGuessSubmitted(false);
            setUserGuess(null);
            setLocationCoords({ lat: dto.latitude, lng: dto.longitude });
            setPanoramaLoaded(false);
            fetchPanoramaAt(dto.latitude, dto.longitude);
            localStorage.setItem('roundLatitude', dto.latitude.toString());
            localStorage.setItem('roundLongitude', dto.longitude.toString());
          }
          else if (evt.type === 'ROUND_WINNER') {
            const win: RoundWinnerEvent = evt;
            console.log('[GameComponent] Received ROUND_WINNER:', win);
            localStorage.setItem('roundWinnerEvent', JSON.stringify(win));
            router.push(`/games/${code}/results`);
          }
        });
      },
      onStompError: (frame) => {
        console.error('[GameComponent] STOMP error:', frame.headers['message'], frame.body);
      },
      onDisconnect: () => {
        console.log('[GameComponent] STOMP disconnected');
      },
    });

    console.log(`[GameComponent] Activating STOMP client for lobby ${lobbyId}`);
    client.activate();
    stompClientRef.current = client;
    return () => {
      console.log('[GameComponent] Deactivating STOMP client');
      client.deactivate();
    };
  }, [user?.token, lobbyId, code, fetchPanoramaAt, router]);

  // 6) Map invalidation
  function MapSetup() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      map.invalidateSize();
    }, [map]);
    return null;
  }

  // 7) Map click handler for guesses
  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (!guessSubmitted) {
          console.log('[GameComponent] Map clicked, setting userGuess:', e.latlng);
          setUserGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      },
    });
    return null;
  }

  // 8) Submit guess
  const handleSubmit = () => {
    if (!userGuess || !stompClientRef.current?.connected) {
      console.warn('[GameComponent] Cannot submit guess, missing guess or STOMP disconnected');
      return;
    }
    console.log('[GameComponent] Submitting guess:', userGuess);
    stompClientRef.current.publish({
      destination: `/app/lobby/${lobbyId}/game/guess`,
      body: JSON.stringify({ latitude: userGuess.lat, longitude: userGuess.lng } as GuessMessage),
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

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      {/* Fullscreen Street View */}
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
            transform: 'translate(-50%, -50%)',
            color: 'white',
          }}>
            Loading Street View…
          </div>
        )}
      </div>

      {/* Mini Leaflet map */}
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
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ width: '100%', height: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSetup />
            <MapClickHandler />
            {userGuess && (
              <Marker position={[userGuess.lat, userGuess.lng]}>
                <Popup>Your guess</Popup>
              </Marker>
            )}
            {guessSubmitted && (
              <Marker position={[locationCoords.lat, locationCoords.lng]}>
                <Popup>Actual</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      )}

      {/* LOCK IN button */}
      <button
        onClick={handleSubmit}
        disabled={!userGuess || guessSubmitted}
        style={{
          position: 'fixed',
          bottom: '2rem',
          right: '1rem',
          padding: '0.75rem 1.5rem',
          color: '#fff',
          fontWeight: 'bold',
          border: 'none',
          borderRadius: 8,
          backgroundColor:
            userGuess && !guessSubmitted ? '#e53e3e' : '#a0aec0',
          cursor:
            userGuess && !guessSubmitted ? 'pointer' : 'not-allowed',
          zIndex: 10,
        }}
      >
        LOCK IN
      </button>
    </div>
  );
}
