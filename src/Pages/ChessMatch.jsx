import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
const ChessMatch = () => {
  const [game] = useState(new Chess()); // The game object is directly manipulated
  const [fen, setFen] = useState("start");
  const [moveNum, setMoveNum] = useState(0);
  const [matchResult, setMatchResult] = useState("");
  const storedData = sessionStorage.getItem("tourData");
  const teamData = sessionStorage.getItem("teamData");
  const matchInfo = sessionStorage.getItem("matchInfo");
  const navigate = useNavigate();
  const [teamInfo, setTeamInfo] = useState(() => JSON.parse(teamData));
  const [matchData, setMatchData] = useState(() => JSON.parse(matchInfo));
  const [tourData, setTourData] = useState(() => JSON.parse(storedData));
  const [isLoading, setIsLoading] = useState(false);
  const [blackMV, setBlackMV] = useState(0);
  const [whiteMV, setWhiteMV] = useState(0);
  const [lastTurn, setLastTurn] = useState("white");
  const [lastMV, setLastMV] = useState("");
  const [mVList, setMVList] = useState([]);
  const [whitePieceCounts, setWhitePieceCounts] = useState({});
  const [blackPieceCounts, setBlackPieceCounts] = useState({});
  const [whiteWinProbability, setWhiteWinProbability] = useState(0);
  const [blackWinProbability, setBlackWinProbability] = useState(0);
  const { MID } = useParams();

  const findPieceInfo = (fenValue) => {
    const [pieces, turn, castling, enPassant, halfMove, fullMove] =
      fenValue.split(" ");
    const pieceCounts = {
      white: {
        pawn: 0,
        rook: 0,
        knight: 0,
        bishop: 0,
        queen: 0,
        king: 0,
      },
      black: {
        pawn: 0,
        rook: 0,
        knight: 0,
        bishop: 0,
        queen: 0,
        king: 0,
      },
    };

    pieces.split("/").forEach((row, rowIndex) => {
      let fileIndex = 0;
      for (let i = 0; i < row.length; i++) {
        if (!isNaN(row[i])) {
          fileIndex += parseInt(row[i]);
        } else {
          const color = row[i] === row[i].toLowerCase() ? "black" : "white";
          const pieceName = {
            p: "pawn",
            r: "rook",
            n: "knight",
            b: "bishop",
            q: "queen",
            k: "king",
          }[row[i].toLowerCase()];
          if (!pieceCounts[color][pieceName]) {
            pieceCounts[color][pieceName] = 1;
          } else {
            pieceCounts[color][pieceName]++;
          }
          fileIndex++;
        }
      }
    });

    setWhitePieceCounts(pieceCounts.white);
    setBlackPieceCounts(pieceCounts.black);
  };

  useEffect(() => {
    if (fen !== "start") {
      findPieceInfo(fen);
    }
  }, [fen]);

  useEffect(() => {
    const totalWhitePieces =
      whitePieceCounts.pawn +
      whitePieceCounts.rook +
      whitePieceCounts.knight +
      whitePieceCounts.bishop +
      whitePieceCounts.queen +
      whitePieceCounts.king;

    const totalBlackPieces =
      blackPieceCounts.pawn +
      blackPieceCounts.rook +
      blackPieceCounts.knight +
      blackPieceCounts.bishop +
      blackPieceCounts.queen +
      blackPieceCounts.king;

    const totalPieces = totalWhitePieces + totalBlackPieces;
    console.log("tpta;", totalPieces);
    console.log("white win", whiteWinProbability);
    console.log("black win", blackWinProbability);
    if (totalPieces > 0) {
      setWhiteWinProbability((totalWhitePieces / totalPieces) * 100);
      setBlackWinProbability((totalBlackPieces / totalPieces) * 100);
    } else {
      setWhiteWinProbability(0);
      setBlackWinProbability(0);
    }
  }, [whitePieceCounts, blackPieceCounts]);

  const options = {
    chart: {
      type: "bar",
    },
    title: {
      text: "Player Win Probability Comparison",
    },
    xAxis: {
      categories: ["White", "Black"],
    },
    yAxis: {
      title: {
        text: "Win Probability (%)",
      },
    },
    series: [
      {
        data: [whiteWinProbability, blackWinProbability],
      },
    ],
  };
  // Define makeAutoMove inside the component but outside the useEffect
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
        findPieceInfo(data.fen);
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
      makeAutoMove();
    }, 1000);
    return () => clearInterval(timer);
  }, [matchResult]);

  return (
    <>
      <div className="flex flex-row w-full justify-between h-[90vh] px-4 gap-10">
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
        <div className="flex flex-col gap-10">
          <div className="flex flex-row text-white w-[300px] justify-between">
            <div className="w-[50%]">
              White Pieces:
              {["pawn", "rook", "knight", "bishop", "queen", "king"].map(
                (pieceName) => (
                  <div key={pieceName}>
                    {pieceName}: {whitePieceCounts[pieceName] || 0}
                  </div>
                )
              )}
            </div>
            <div className="w-[50%]">
              Black Pieces:
              {["pawn", "rook", "knight", "bishop", "queen", "king"].map(
                (pieceName) => (
                  <div key={pieceName}>
                    {pieceName}: {blackPieceCounts[pieceName] || 0}
                  </div>
                )
              )}
            </div>
          </div>
          <div>
            <HighchartsReact highcharts={Highcharts} options={options} />
          </div>
        </div>
        <div className="flex flex-col text-white  ">
          <div className="flex flex-row px-60">{matchResult}</div>
          <div className="flex flex-row text-xl font-bold">
            <div className="w-[50%]">
              White (gpt-4o) {lastTurn === "white" && "{==  " + lastMV}
            </div>
            <div className="w-[50%]">
              Black (gpt-4o){lastTurn === "black" && "{==  " + lastMV}
            </div>
          </div>

          <div className="flex flex-row">
            <div className="w-[50%]">Moves: {whiteMV}</div>
            <div className="w-[50%]">Moves: {blackMV}</div>
          </div>

          <div className="flex flex-row h-[80%] overflow-y-auto items-start">
            <div className="w-[50%] flex flex-col-reverse pl-6">
              {mVList.length &&
                mVList.map(
                  (mv, index) =>
                    mv.message === "white" && <div key={index}>{mv.move}</div>
                )}
            </div>
            <div className="w-[50%] flex flex-col-reverse pl-6">
              {mVList.length &&
                mVList.map(
                  (mv, index) =>
                    mv.message === "black" && <div key={index}>{mv.move}</div>
                )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChessMatch;
