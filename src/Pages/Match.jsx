import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";

const Match = () => {
  const navigate = useNavigate();
  const [game] = useState(new Chess());
  const [fen, setFen] = useState("start");
  const [moveNum, setMoveNum] = useState(0);
  const [matchResult, setMatchResult] = useState("");
  const storedData = sessionStorage.getItem("tourData");
  const teamData = sessionStorage.getItem("teamData");
  const matchInfo = sessionStorage.getItem("matchInfo");
  const [teamInfo, setTeamInfo] = useState(() => JSON.parse(teamData));
  const [matchData, setMatchData] = useState(() => JSON.parse(matchInfo));
  const [tourData, setTourData] = useState(() => JSON.parse(storedData));
  const [isLoading, setIsLoading] = useState(false);
  const [blackMV, setBlackMV] = useState(0);
  const [whiteMV, setWhiteMV] = useState(0);
  const [lastTurn, setLastTurn] = useState("white");
  const [lastMV, setLastMV] = useState("");
  const [mVList, setMVList] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [MID, setMID] = useState("");
  const [currMatch, setCurrMatch] = useState({});
  const [nextMatch, setNextMatch] = useState({});
  const TID = "14547936";

  const findParticipantName = (id) => {
    for (let i = 0; i < teamList.length; i++) {
      if (teamList[i].id === id) {
        return teamList[i].name;
      }
    }
    return "Loading...";
  };

  const getAllTeamData = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${
        import.meta.env.VITE_REACT_APP_SERVER
      }api/players/getAll?TID=${TID}`,
    };

    axios
      .request(config)
      .then((response) => {
        console.log("resss", response.data.data);
        setTeamList(response.data.data);
        const teamdataString = JSON.stringify(response.data.data);
        sessionStorage.setItem("teamData", teamdataString);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getOpenMatch = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${
        import.meta.env.VITE_REACT_APP_SERVER
      }api/brackets/getAllBrkt?TID=${TID}`,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(response);
        let transformedMatches = response.data.map((match) => {
          const scores = match.score.split("-").map((score) => parseInt(score));
          const findteam1 = teamList.find((teamItem) => {
            return match.team1Id === teamItem.id;
          });
          const findteam2 = teamList.find((teamItem) => {
            return match.team2Id === teamItem.id;
          });
          return {
            id: match._id,
            nextMatchId: match.nextMatchID,
            state: match.state,
            roundNumber: match.roundNumber,
            participants: [
              {
                id: match.team1Id,
                resultText: scores[0] ? scores[0] : "",
                isWinner: match.team1Id === match.winner,
                status: null,
                name: match.team1Id ? findteam1?.name : " - ",
              },
              {
                id: match.team2Id,
                resultText: scores[1] ? scores[1] : "",
                isWinner: match.team2Id === match.winner,
                status: null,
                name: match.team2Id ? findteam2?.name : " - ",
              },
            ],
          };
        });
        let filteredMatches = transformedMatches.filter(
          (match) => match.state !== "pending"
        );
        setCurrMatch(filteredMatches[0]);
        setNextMatch(filteredMatches[1]);
        setMID(filteredMatches[0].id);
        setMatchList(filteredMatches);
        console.log(filteredMatches);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    getAllTeamData();
    getOpenMatch();
  }, []);

  const makeAutoMove = async () => {
    try {
      console.log(game.turn());
      const response = await fetch(
        `${import.meta.env.VITE_REACT_APP_SERVER}api/chess/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fen: game.fen(),
            turn: game.turn(),
            MID,
            MVN: moveNum,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Network response was not ok.");
      }

      const data = await response.json();
      console.log(data);
      if (data.message === "White wins") {
        console.log(data.message);
        setMatchResult("White wins");
        submitScore();
      } else if (data.message === "Black wins") {
        console.log(data.message);
        setMatchResult("Black wins");
        submitScore();
      } else if (data.message === "Draw") {
        console.log(data.message);
        setMatchResult("Draw");
      } else if (data.success) {
        // Make sure the move is valid
        setMoveNum(moveNum + 1);
        setFen(data.fen);
        setBlackMV(data.blackMoves);
        setWhiteMV(data.whiteMoves);
        setLastTurn(data.message);
        setLastMV(data.move);
        setMVList(data.movesArr);
      }
    } catch (error) {
      console.log("Failed to fetch the move: ", error);
    }
  };

  const submitScore = () => {
    let WID;
    let scoreList = ``;
    const TID = tourData.TID;
    if (matchResult === "White wins") {
      WID = teamInfo.participants[0].id;
      scoreList = "1-0";
    } else {
      WID = teamInfo.participants[1].id;
      scoreList = "0-1";
    }

    if (!TID || !MID || !WID || scoreList.length < 3) {
      alert("missing field");
      return;
    }

    let data = JSON.stringify({
      scoreList,
      MID,
      TID,
      WID,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: `${import.meta.env.VITE_REACT_APP_SERVER}api/matches/updateScore`,
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        alert("updated scores");
        navigate(`/tournament/${TID}`);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // Effect to handle automatic moves
  useEffect(() => {
    if (matchResult) {
      return; // Return early to prevent setting up the timer
    }
    // Set up a timer to make automatic moves every 2 seconds
    const timer = setInterval(() => {
      if (MID) {
        makeAutoMove();
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [matchResult, MID]);

  return (
    <div className="flex flex-row w-full h-[90vh] px-4 gap-10">
      <Chessboard
        width={400}
        position={fen}
        onDrop={(move) => {
          const moveObj = {
            from: move.sourceSquare,
            to: move.targetSquare,
            promotion: "q",
          };
          if (game.move(moveObj)) {
            setFen(game.fen());
            makeAutoMove(); // Optionally trigger another move after user's move
          }
        }}
      />
      {MID && currMatch && (
        <div className="flex flex-col text-white w-[100%]">
          <div className="flex flex-row px-60">{matchResult}</div>
          <div className="flex flex-row text-xl font-bold">
            <div className="w-[50%]">
              White{" "}
              {"(" + findParticipantName(currMatch.participants[0].id) + ")"}{" "}
              {lastTurn === "white" && "{==  " + lastMV}
            </div>
            <div className="w-[50%]">
              Black{" "}
              {"(" + findParticipantName(currMatch.participants[1].id) + ")"}{" "}
              {lastTurn === "black" && "{==  " + lastMV}
            </div>
          </div>
          <div className="flex flex-row">
            <div className="w-[50%]">Moves: {whiteMV}</div>
            <div className="w-[50%]">Moves: {blackMV}</div>
          </div>
          <div className="flex flex-row h-[80%] overflow-y-auto items-start w-full">
            {!mVList.length && 
            <div className="w-full text-xl font-bold flex flex-row py-4">
              Match will start soon.
            </div>
            }
            <div className="w-[50%] flex flex-col-reverse pl-6">
              {mVList.length > 0 &&
                mVList.map(
                  (mv, index) =>
                    mv.message === "white" && <div key={index}>{mv.move}</div>
                )}
            </div>
            <div className="w-[50%] flex flex-col-reverse pl-6">
              {mVList.length > 0 &&
                mVList.map(
                  (mv, index) =>
                    mv.message === "black" && <div key={index}>{mv.move}</div>
                )}
            </div>
          </div>
          <div className="flex flex-row w-full py-2">
            <div className="flex-col flex border-2 border-white-500 mx-2 w-fit px-4 py-2">
              <div>Next Match: (In next 2 Days)</div>
              <div>
                White{" "}
                {"(" + findParticipantName(nextMatch.participants[0].id) + ")"}{" "}
                v/s
              </div>
              <div>
                Black{" "}
                {"(" + findParticipantName(nextMatch.participants[1].id) + ")"}
              </div>
            </div>
            <div className="hover:scale-[1.02] cursor-pointer flex-col flex border-2 border-white-500 mx-2 w-fit px-10 py-2 items-center justify-center" onClick={() => navigate(`/bracket/${TID}`)}> Open Bracket </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Match;
