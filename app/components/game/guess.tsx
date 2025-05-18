/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Notification, { NotificationProps } from "@/components/general/notification";
import { useGlobalGameState } from "@/contexts/globalGameState";
import { useGlobalUser } from "@/contexts/globalUser";
import { getApiDomain } from "@/utils/domain";
import { Client } from "@stomp/stompjs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import SockJS from "sockjs-client";

// Add a global declaration for the Google Maps API
declare global {
  interface Window {
    google: any;
  }
}

export default function GameComponent() {
  const router = useRouter();
  const { code } = useParams() as { code: string };
  const { user } = useGlobalUser();
  const { gameState } = useGlobalGameState();

  const [lobbyId, setLobbyId] = useState<number | null>(null);
  const [notification, setNotification] = useState<NotificationProps | null>(null);

  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [panoramaLoaded, setPanoramaLoaded] = useState(false);
  const [streetViewFailed, setStreetViewFailed] = useState(false);
  const [userGuess, setUserGuess] = useState<{ lat: number; lng: number } | null>(null);
  const [guessSubmitted, setGuessSubmitted] = useState(false);
  const [remainingTime, setRemainingTime] = useState<number>(0);

  const stompClientRef = useRef<Client | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const panoCache = useRef<Map<string, string>>(new Map());
  const panoInstance = useRef<any>(null);
  const fetchDebounce = useRef<any>(null);

  // ✂️ NEW STATE FOR ACTION-CARD EFFECTS
  const [continentHint, setContinentHint] = useState<string | null>(null);
  const [isBlurred, setIsBlurred] = useState(false);

  // 1) Callback functions
  const fetchPanoramaAt = useCallback((lat: number, lng: number) => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (!window.google?.maps) {
      setTimeout(() => fetchPanoramaAt(lat, lng), 200);
      return;
    }
    if (panoCache.current.has(key)) {
      panoInstance.current?.setPano(panoCache.current.get(key)!);
      setPanoramaLoaded(true);
      return;
    }
    if (fetchDebounce.current) clearTimeout(fetchDebounce.current);
    fetchDebounce.current = setTimeout(() => {
      setPanoramaLoaded(false);
      setStreetViewFailed(false);
      const timeout = setTimeout(() => {
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
              const container = document.getElementById("street-view-container")!;
              if (!panoInstance.current) {
                panoInstance.current = new window.google.maps.StreetViewPanorama(container, {
                  pano: panoId,
                  visible: true,
                  disableDefaultUI: true,
                  pov: { heading: 0, pitch: 0 },
                });
              } else {
                panoInstance.current.setPano(panoId);
              }
            } else {
              setStreetViewFailed(true);
            }
          }
        );
      } catch {
        clearTimeout(timeout);
        setStreetViewFailed(true);
        setPanoramaLoaded(true);
      }
    }, 300);
  }, []);

  const handleSubmit = useCallback(() => {
    if (!userGuess || !stompClientRef.current?.connected) return;
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
  }, [userGuess, lobbyId, locationCoords]);

  // 2) useEffect Handlers

  // 2.1) Load lobbyId from localStorage
  useEffect(() => {
    if (!user) return;
    const stored = localStorage.getItem("lobbyId");
    if (!stored) {
      setNotification({
        type: "error",
        message: "Lobby ID missing, please re-join",
        onClose: () => setNotification(null),
      });
      return;
    }
    setLobbyId(parseInt(stored));
  }, [user]);

  // 2.2) Load actionCardEffects from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("actionCardEffects");
    if (!raw || !user?.token) return;
    try {
      const actionCardEffects: Record<
        string,
        Array<{ effect: string; value?: string; duration?: number }>
      > = JSON.parse(raw);
      const myEffects = actionCardEffects[user.token] || [];
      myEffects.forEach((eff) => {
        if (eff.effect === "blur") {
          setIsBlurred(true);
          setTimeout(() => setIsBlurred(false), (eff.duration ?? 15) * 1000);
        }
        if (eff.effect === "continent") {
          setContinentHint(eff.value ?? null);
        }
      });
    } catch (err) {
      console.error("Error parsing actionCardEffects:", err);
    } finally {
      localStorage.removeItem("actionCardEffects");
    }
  }, [user?.token]);

  // 2.3) Load values from gameState
  useEffect(() => {
    if (!user) return;
    if (!gameState) return;

    if (!gameState.guessScreenAttributes) {
      setNotification({
        type: "error",
        message: "No location received from the server. Please reload the page and try again",
        onClose: () => setNotification(null),
      });
      return;
    }

    if (gameState.guessScreenAttributes?.guessLocation) {
      setPanoramaLoaded(false);
      setStreetViewFailed(false);
      setLocationCoords({
        lat: gameState.guessScreenAttributes.guessLocation.lat,
        lng: gameState.guessScreenAttributes.guessLocation.lon,
      });
      fetchPanoramaAt(
        gameState?.guessScreenAttributes?.guessLocation.lat,
        gameState?.guessScreenAttributes?.guessLocation.lon
      );
    }
    if (gameState.guessScreenAttributes?.time) {
      setRemainingTime(gameState?.guessScreenAttributes?.time);
    }
  }, [
    fetchPanoramaAt,
    gameState,
    gameState?.guessScreenAttributes?.guessLocation,
    gameState?.guessScreenAttributes?.time,
    user,
  ]);

  // 2.4) Load Google Maps API
  useEffect(() => {
    if (!(window as any).google?.maps && !document.getElementById("gmaps-script")) {
      const script = document.createElement("script");
      script.id = "gmaps-script";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  // 2.5) STOMP subscription for game events
  useEffect(() => {
    if (!user?.token || !lobbyId) return;
    const client = new Client({
      webSocketFactory: () => new SockJS(`${getApiDomain()}/ws/lobby-manager?token=${user.token}`),
      connectHeaders: { Authorization: `Bearer ${user.token}` },
      reconnectDelay: 5000,
      onConnect: () => {
        client.subscribe(`/topic/lobby/${lobbyId}/game`, (msg) => {
          const evt: any = JSON.parse(msg.body);
          switch (evt.type) {
            case "ROUND_START": {
              const { roundData: dto, actionCardEffects } = evt.payload;
              if (actionCardEffects) {
                localStorage.setItem("actionCardEffects", JSON.stringify(actionCardEffects));
              }

              setGuessSubmitted(false);
              setUserGuess(null);
              setLocationCoords({ lat: dto.latitude, lng: dto.longitude });
              fetchPanoramaAt(dto.latitude, dto.longitude);
              localStorage.setItem("roundLatitude", dto.latitude.toString());
              localStorage.setItem("roundLongitude", dto.longitude.toString());
              setRemainingTime(dto.roundTime);
              localStorage.setItem("roundTime", dto.roundTime.toString());

              setContinentHint(null);
              setIsBlurred(false);

              const myEffects = actionCardEffects?.[user.token] || [];
              myEffects.forEach((eff: { effect: string; value?: string; duration?: number }) => {
                if (eff.effect === "continent") {
                  setContinentHint(eff.value ?? null);
                }
                if (eff.effect === "blur") {
                  setIsBlurred(true);
                  setTimeout(() => setIsBlurred(false), (eff.duration || 15) * 1000);
                }
              });
              break;
            }
            case "ROUND_WINNER":
              localStorage.setItem("roundWinnerEvent", JSON.stringify(evt));
              router.push(`/games/${code}/results`);
              break;
            case "GAME_WINNER":
              localStorage.setItem("gameWinnerEvent", JSON.stringify(evt));
              router.push(`/games/${code}/results`);
              break;
          }
        });
      },
      onStompError: console.error,
      onDisconnect: () => {},
    });
    client.activate();
    stompClientRef.current = client;
    return () => {
      client.deactivate();
    };
  }, [user?.token, lobbyId, fetchPanoramaAt, router, code]);

  // 2.6) Countdown timer
  useEffect(() => {
    if (remainingTime <= 0) {
      if (stompClientRef.current?.connected) {
        stompClientRef.current.publish({
          destination: `/app/lobby/${lobbyId}/game/round-time-expired`,
          body: "",
        });
      }
      return;
    }
    const iv = setInterval(() => setRemainingTime((t) => t - 1), 1000);
    return () => clearInterval(iv);
  }, [remainingTime, guessSubmitted, handleSubmit, lobbyId]);

  // 2.7) Leaflet icon fix
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
    });
  }, []);

  // 3) Functions
  function MapSetup() {
    const map = useMap();
    useEffect(() => {
      mapRef.current = map;
      map.invalidateSize();
    }, [map]);
    return null;
  }

  function MapClickHandler() {
    useMapEvents({
      click(e) {
        if (!guessSubmitted) {
          setUserGuess({ lat: e.latlng.lat, lng: e.latlng.lng });
        }
      },
    });
    return null;
  }

  // 4) Render
  return (
    <div style={{ position: "relative", width: "100%", height: "100vh" }}>
      <div style={{ top: "16px", left: "50%", position: "relative" }}>
        {notification && <Notification {...notification} />}
      </div>

      {remainingTime > 0 && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            right: "1rem",
            padding: "0.5rem 1rem",
            background: "rgba(0,0,0,0.6)",
            color: "#fff",
            borderRadius: 4,
            fontSize: "1.2rem",
            zIndex: 20,
          }}
        >
          ⏱ {remainingTime}s
        </div>
      )}

      {continentHint && (
        <div
          style={{
            position: "absolute",
            top: "1rem",
            left: "1rem",
            padding: "0.5rem 1rem",
            background: "rgba(0,0,0,0.7)",
            color: "#fff",
            borderRadius: 4,
            fontSize: "1.2rem",
            zIndex: 30,
          }}
        >
          Continent: {continentHint}
        </div>
      )}

      {!streetViewFailed && (
        <div
          id="street-view-container"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "black",
            zIndex: 0,
            filter: isBlurred ? "blur(8px)" : "none",
            transition: "filter 0.3s ease-in-out",
          }}
        >
          {!panoramaLoaded && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "white",
              }}
            >
              Loading Street View…
            </div>
          )}
        </div>
      )}

      {/* Mini map + submit button */}
      {gameState?.guessScreenAttributes?.guessLocation && (
        <div
          style={{
            position: "absolute",
            bottom: "6rem",
            right: "1rem",
            width: 256,
            height: 192,
            zIndex: 10,
            border: "1px solid rgba(0,0,0,0.2)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <MapContainer center={[20, 0]} zoom={2} style={{ width: "100%", height: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <MapSetup />
            {remainingTime > 0 && <MapClickHandler />}
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
              disabled={!userGuess || remainingTime <= 0}
              style={{
                position: "absolute",
                bottom: 8,
                left: "50%",
                transform: "translateX(-50%)",
                padding: "0.5rem 1rem",
                borderRadius: 4,
                background: "#007bff",
                color: "white",
                border: "none",
                cursor: userGuess && remainingTime > 0 ? "pointer" : "not-allowed",
                zIndex: 20,
              }}
            >
              Submit Guess
            </button>
          )}
        </div>
      )}

      {locationCoords && remainingTime > 0 && (
        <button
          onClick={handleSubmit}
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "1rem",
            padding: "0.75rem 1.5rem",
            color: "#fff",
            fontWeight: "bold",
            border: "none",
            borderRadius: 8,
            backgroundColor: "#e53e3e",
            cursor: "pointer",
            zIndex: 20,
          }}
        >
          LOCK IN
        </button>
      )}
    </div>
  );
}
