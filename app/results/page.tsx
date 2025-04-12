/* eslint-disable prefer-const */
"use client";

import React, { useState, useEffect } from "react";
import { Row, Button, Spin, Alert, Typography } from "antd";
import { TrophyOutlined } from "@ant-design/icons";
import { useRouter, useParams, useSearchParams } from "next/navigation";

const { Title, Text } = Typography;

interface PlayerResult {
  userId: string;
  score: number;
}

interface GameResults {
  gameId: string;
  status: string;
  rounds: number;
  results: {
    players: PlayerResult[];
  };
}

// Adjust the container style so it doesn't override your dark root layout.
const containerStyle: React.CSSProperties = {
  padding: "2rem",
  width: "100%",
  color: "#fff",
};

const headerStyle: React.CSSProperties = {
  textAlign: "center",
  marginBottom: "3rem",
};

const podiumWrapperStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-end",
  gap: "20px",
  position: "relative",
  width: "100%",
  marginBottom: "2rem",
};

const podiumCardBaseStyle: React.CSSProperties = {
  width: "200px",
  borderRadius: "12px",
  boxShadow: "0 8px 16px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column",
  justifyContent: "flex-end",
  alignItems: "center",
  paddingBottom: "1rem",
  color: "#fff",
};

const firstStyle: React.CSSProperties = {
  ...podiumCardBaseStyle,
  height: "250px",
  backgroundColor: "#d4af37", // refined gold
};

const secondStyle: React.CSSProperties = {
  ...podiumCardBaseStyle,
  height: "200px",
  backgroundColor: "#c0c0c0", // silver
};

const thirdStyle: React.CSSProperties = {
  ...podiumCardBaseStyle,
  height: "200px",
  backgroundColor: "#cd7f32", // bronze
};

const rankLabelStyle: React.CSSProperties = {
  marginTop: "10px",
  fontSize: "1.2rem",
  fontWeight: 600,
};

const winnerCardStyle: React.CSSProperties = {
  ...podiumCardBaseStyle,
  height: "250px",
  backgroundColor: "#d4af37",
  width: "250px",
};

// New team type now includes an array of member names.
interface Team {
  members: string[];
  score: number;
}

// Helper: compute teams by grouping players sequentially.
// Instead of assigning a team name, we list all team members' names.
function computeTeams(players: PlayerResult[], playersPerTeam: number): Team[] {
  const teams: Team[] = [];
  for (let i = 0; i < players.length; i += playersPerTeam) {
    const teamPlayers = players.slice(i, i + playersPerTeam);
    const members = teamPlayers.map(player => player.userId);
    const score = teamPlayers.reduce((acc, curr) => acc + curr.score, 0);
    teams.push({ members, score });
  }
  teams.sort((a, b) => b.score - a.score);
  return teams;
}

// Sprinkles component adds animated sparkles with colorful forms.
const Sprinkles: React.FC = () => {
  const sprinklesCount = 30;
  const colors = ["#FFD700", "#FFA500", "#FF4500", "#FF69B4", "#ADFF2F", "#00FA9A"];
  const shapes = ["circle", "square", "triangle", "diamond", "star"];
  const sprinkles = Array.from({ length: sprinklesCount }).map((_, i) => {
    const left = Math.random() * 100;
    const top = Math.random() * 100;
    const size = Math.random() * 10 + 10; // 10px to 20px
    const delay = Math.random() * 2;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const shape = shapes[Math.floor(Math.random() * shapes.length)];

    let shapeStyle: React.CSSProperties = {};
    if (shape === "circle") {
      shapeStyle.borderRadius = "50%";
    } else if (shape === "square") {
      shapeStyle.borderRadius = "0";
    } else if (shape === "triangle") {
      shapeStyle.clipPath = "polygon(50% 0%, 0% 100%, 100% 100%)";
    } else if (shape === "diamond") {
      shapeStyle.clipPath = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
    } else if (shape === "star") {
      shapeStyle.clipPath =
        "polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)";
    }

    return (
      <div
        key={i}
        style={{
          position: "absolute",
          left: `${left}%`,
          top: `${top}%`,
          width: `${size}px`,
          height: `${size}px`,
          backgroundColor: color,
          opacity: 0,
          animation: `fadeInOut 3s ease-in-out ${delay}s forwards`,
          ...shapeStyle,
        }}
      />
    );
  });
  return (
    <div style={{ pointerEvents: "none", position: "absolute", width: "100%", height: "100%" }}>
      {sprinkles}
    </div>
  );
};

// Render individual podium for 3 or more players.
const renderIndividualPodium = (sortedPlayers: PlayerResult[], showSprinkles: boolean) => (
  <div style={{ position: "relative", width: "100%" }}>
    {showSprinkles && <Sprinkles />}
    <div style={podiumWrapperStyle}>
      <div style={{ textAlign: "center" }}>
        <div style={secondStyle}>
          <Title level={4} style={{ color: "#333", margin: 0 }}>2nd</Title>
          <Text style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {sortedPlayers[1].userId}
          </Text>
          <Text>Score: {sortedPlayers[1].score}</Text>
        </div>
        <div style={rankLabelStyle}>2nd Place</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={firstStyle}>
          <TrophyOutlined style={{ fontSize: "3rem", marginBottom: "0.5rem" }} />
          <Title level={3} style={{ color: "#333", margin: 0 }}>1st</Title>
          <Text style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
            {sortedPlayers[0].userId}
          </Text>
          <Text>Score: {sortedPlayers[0].score}</Text>
        </div>
        <div style={rankLabelStyle}>1st Place</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={thirdStyle}>
          <Title level={4} style={{ color: "#333", margin: 0 }}>3rd</Title>
          <Text style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {sortedPlayers[2].userId}
          </Text>
          <Text>Score: {sortedPlayers[2].score}</Text>
        </div>
        <div style={rankLabelStyle}>3rd Place</div>
      </div>
    </div>
  </div>
);

// Render individual winner (2 players): center the winner card.
const renderIndividualWinner = (sortedPlayers: PlayerResult[], showSprinkles: boolean) => (
  <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
    {showSprinkles && <Sprinkles />}
    <div style={winnerCardStyle}>
      <TrophyOutlined style={{ fontSize: "3rem", marginBottom: "0.5rem" }} />
      <Title level={3} style={{ color: "#333", margin: 0 }}>Winner</Title>
      <Text style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
        {sortedPlayers[0].userId}
      </Text>
      <Text>Score: {sortedPlayers[0].score}</Text>
    </div>
  </div>
);

// Render team podium, showing the top three teams with team members' names.
const renderTeamPodium = (teams: Team[], showSprinkles: boolean) => (
  <div style={{ position: "relative", width: "100%" }}>
    {showSprinkles && <Sprinkles />}
    <div style={podiumWrapperStyle}>
      {teams.length >= 3 && (
        <>
          <div style={{ textAlign: "center" }}>
            <div style={secondStyle}>
              <Title level={4} style={{ color: "#333", margin: 0 }}>2nd</Title>
              <Text style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                {teams[1].members.join(", ")}
              </Text>
              <Text>Score: {teams[1].score}</Text>
            </div>
            <div style={rankLabelStyle}>2nd Place</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={firstStyle}>
              <TrophyOutlined style={{ fontSize: "3rem", marginBottom: "0.5rem" }} />
              <Title level={3} style={{ color: "#333", margin: 0 }}>1st</Title>
              <Text style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
                {teams[0].members.join(", ")}
              </Text>
              <Text>Score: {teams[0].score}</Text>
            </div>
            <div style={rankLabelStyle}>1st Place</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={thirdStyle}>
              <Title level={4} style={{ color: "#333", margin: 0 }}>3rd</Title>
              <Text style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
                {teams[2].members.join(", ")}
              </Text>
              <Text>Score: {teams[2].score}</Text>
            </div>
            <div style={rankLabelStyle}>3rd Place</div>
          </div>
        </>
      )}
    </div>
  </div>
);

// Render team winner: center the winning team card with all team members' names.
const renderTeamWinner = (teams: Team[], showSprinkles: boolean) => (
  <div style={{ display: "flex", justifyContent: "center", textAlign: "center" }}>
    {showSprinkles && <Sprinkles />}
    <div style={winnerCardStyle}>
      <TrophyOutlined style={{ fontSize: "3rem", marginBottom: "0.5rem" }} />
      <Title level={3} style={{ color: "#333", margin: 0 }}>Winning Team</Title>
      <Text style={{ fontSize: "1.4rem", fontWeight: "bold" }}>
        {teams[0].members.join(", ")}
      </Text>
      <Text>Score: {teams[0].score}</Text>
    </div>
  </div>
);

const GameResultsPage: React.FC = () => {
  const router = useRouter();
  const { gameId } = useParams() as { gameId: string };
  const searchParams = useSearchParams();
  const pptParam = searchParams.get("playersPerTeam");
  const playersPerTeam: number = pptParam ? parseInt(pptParam, 10) : 1;

  const [gameResults, setGameResults] = useState<GameResults | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [showSprinkles, setShowSprinkles] = useState<boolean>(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        // Make a fetch request to the game results REST API endpoint.
        const response = await fetch(`/games/${gameId}/results`, {
          headers: {
            "Content-Type": "application/json",
            // Include Authorization header if needed, e.g.:
            // "Authorization": "Bearer <token>"
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch game results");
        }
        const data: GameResults = await response.json();
        setGameResults(data);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [gameId]);

  useEffect(() => {
    const timer = setTimeout(() => setShowSprinkles(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  const backToHome = () => {
    router.push("/");
  };

  if (loading) {
    return (
      <div style={{ ...containerStyle, textAlign: "center", paddingTop: "4rem" }}>
        <Spin size="large" tip="Loading game results...">
          <div style={{ minHeight: "100vh" }} />
        </Spin>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ ...containerStyle, textAlign: "center", paddingTop: "4rem" }}>
        <Alert message="Error" description={error} type="error" showIcon />
        <Button type="primary" style={{ marginTop: "1rem" }} onClick={backToHome}>
          Back to Home
        </Button>
      </div>
    );
  }

  if (!gameResults) {
    return null;
  }

  const totalPlayers = gameResults.results.players.length;
  const sortedPlayers = [...gameResults.results.players].sort((a, b) => b.score - a.score);
  // For team mode, compute teams (with members list).
  const teams = playersPerTeam > 1 ? computeTeams(sortedPlayers, playersPerTeam) : [];

  let content;
  if (playersPerTeam === 1) {
    if (totalPlayers === 2) {
      content = renderIndividualWinner(sortedPlayers, showSprinkles);
    } else {
      content = renderIndividualPodium(sortedPlayers, showSprinkles);
    }
  } else {
    if (
      (totalPlayers === 4 && playersPerTeam === 2) ||
      (totalPlayers === 6 && playersPerTeam === 3) ||
      (totalPlayers === 8 && playersPerTeam === 4)
    ) {
      content = renderTeamWinner(teams, showSprinkles);
    } else if (
      (totalPlayers === 6 && playersPerTeam === 2) ||
      (totalPlayers === 8 && playersPerTeam === 2)
    ) {
      content = renderTeamPodium(teams, showSprinkles);
    } else {
      content = renderIndividualPodium(sortedPlayers, showSprinkles);
    }
  }

  return (
    <div style={containerStyle}>
      <style jsx global>{`
        @keyframes fadeInOut {
          0% { opacity: 1; transform: scale(0.8) translateY(0); }
          50% { opacity: 1; transform: scale(1.2) translateY(-10px); }
          100% { opacity: 0; transform: scale(0.8) translateY(0); }
        }
      `}</style>

      <header style={headerStyle}>
        <Title level={2}>Game Results</Title>
        <Text type="secondary">Game ID: {gameResults.gameId}</Text>
        <br />
        <Text type="secondary">Rounds: {gameResults.rounds}</Text>
      </header>

      {content}

      <Row justify="center" style={{ marginTop: "3rem" }}>
        <Button type="primary" size="large" onClick={backToHome}>
          Back to Home
        </Button>
      </Row>
    </div>
  );
};

export default GameResultsPage;
