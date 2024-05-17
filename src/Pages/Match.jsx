import React, { useState, useEffect } from "react";
import Chessboard from "chessboardjsx";
import { Chess } from "chess.js";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaChessPawn,
  FaChessRook,
  FaChessBishop,
  FaChessKnight,
  FaChessKing,
  FaChessQueen,
} from "react-icons/fa";
import { LuSwords } from "react-icons/lu";
import { TbFidgetSpinner } from "react-icons/tb";

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
  const [bMVList, setBMVList] = useState([]);
  const [wMVList, setWMVList] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [teamList, setTeamList] = useState([]);
  const [MID, setMID] = useState("");
  const [currMatch, setCurrMatch] = useState();
  const [nextMatch, setNextMatch] = useState();
  const TID = "14547936";

  const [whitePieceCounts, setWhitePieceCounts] = useState({});
  const [blackPieceCounts, setBlackPieceCounts] = useState({});
  const [whiteWinProbability, setWhiteWinProbability] = useState(50);
  const [blackWinProbability, setBlackWinProbability] = useState(50);

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
    console.log(blackWinProbability, "hjda");
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
      setWhiteWinProbability(
        Math.floor((totalWhitePieces / totalPieces) * 100)
      );
      setBlackWinProbability(
        Math.floor((totalBlackPieces / totalPieces) * 100)
      );
    } else {
      setWhiteWinProbability(50);
      setBlackWinProbability(50);
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
        let firstOpenIndex = filteredMatches.findIndex(
          (match) => match.state === "open"
        );
        if (firstOpenIndex === 0) {
          setCurrMatch(filteredMatches[0]);
          setNextMatch(filteredMatches[1]);
          setMID(filteredMatches[0].id);
        } else if (firstOpenIndex === -1) {
          setCurrMatch(filteredMatches[filteredMatches.length - 1]);
          setNextMatch([]);
          setMID(filteredMatches[filteredMatches.length - 1].id);
        } else {
          setCurrMatch(filteredMatches[firstOpenIndex - 1]);
          setNextMatch(filteredMatches[firstOpenIndex]);
          setMID(filteredMatches[firstOpenIndex - 1].id);
        }
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
  //${import.meta.env.VITE_REACT_APP_SERVER}
  const makeAutoMove = async (resetMatch = false) => {
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
            resetMatch,
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
        //submitScore();
      } else if (data.message === "Black wins") {
        console.log(data.message);
        setMatchResult("Black wins");
        //submitScore();
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
        const blackmoves = data.movesArr.filter(
          (obj) => obj.message === "black"
        );
        const whitemoves = data.movesArr.filter(
          (obj) => obj.message === "white"
        );
        console.log(blackmoves, whitemoves, "ajfhe");
        setBMVList(blackmoves);
        setWMVList(whitemoves);
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
    if (MID && MID !== "") {
      const timer = setInterval(() => {
        makeAutoMove();
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [matchResult, MID]);

  return (
    <div className="flex flex-row w-full h-[100vh] py-4 px-6 gap-10">
      <div className="flex flex-col gap-0">
        <div className="w-full h-full flex flex-col justify-between py-2">
          <div className="w-full flex flex-col items-start justify-between gap-3 border-s-2 pl-2">
            <div className="w-full flex flex-col items-start justify-center gap-1">
              <div className="flex flex-row text-white text-sm font-semibold items-center">
                {currMatch && findParticipantName(currMatch.participants[1].id)}{" "}
                <div className="pl-2 font-light text-xs">
                  {" (Moves: " + blackMV + ")"}
                </div>
              </div>
              <div
                className="text-sm font-bold flex flex-row pr-2 items-center justify-end text-white bg-black h-[25px] border-2 border-white transition-all duration-1000 cursor-pointer"
                style={{ width: `${blackWinProbability}%` }}
              >
                {blackWinProbability + "%"}
              </div>
              <div className="py-[1px] text-black bg-white flex-row flex jusity-center items-center">
                {blackPieceCounts.pawn
                  ? Array.from(
                      { length: blackPieceCounts.pawn },
                      (_, index) => <FaChessPawn key={`pawn-black-${index}`} />
                    )
                  : ""}
                {blackPieceCounts.rook
                  ? Array.from(
                      { length: blackPieceCounts.rook },
                      (_, index) => <FaChessRook key={`rook-black-${index}`} />
                    )
                  : ""}
                {blackPieceCounts.knight
                  ? Array.from(
                      { length: blackPieceCounts.knight },
                      (_, index) => (
                        <FaChessKnight key={`knight-black-${index}`} />
                      )
                    )
                  : ""}
                {blackPieceCounts.bishop
                  ? Array.from(
                      { length: blackPieceCounts.bishop },
                      (_, index) => (
                        <FaChessBishop key={`bishop-black-${index}`} />
                      )
                    )
                  : ""}
                {blackPieceCounts.queen
                  ? Array.from(
                      { length: blackPieceCounts.queen },
                      (_, index) => (
                        <FaChessQueen key={`queen-black-${index}`} />
                      )
                    )
                  : ""}
                {blackPieceCounts.king
                  ? Array.from(
                      { length: blackPieceCounts.king },
                      (_, index) => <FaChessKing key={`king-black-${index}`} />
                    )
                  : ""}
              </div>
            </div>
          </div>
        </div>
        <Chessboard
          width={460}
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

        <div className="w-full h-full flex flex-col justify-between py-2">
          <div className="w-full flex flex-col items-start justify-between gap-3 border-s-2 pl-2">
            <div className="w-full flex flex-col items-start justify-center gap-1">
              <div className="flex flex-row text-white text-sm font-semibold items-center">
                {currMatch &&
                  findParticipantName(currMatch?.participants[0]?.id)}{" "}
                <div className="pl-2 font-light text-xs">
                  {" (Moves: " + whiteMV + ")"}
                </div>
              </div>
              <div
                className="text-sm font-bold flex flex-row pr-2 items-center justify-end bg-white h-[25px] border-2 border-black transition-all duration-1000 cursor-pointer"
                style={{ width: `${whiteWinProbability}%` }}
              >
                {whiteWinProbability + "%"}
              </div>
              <div className="py-[1px] bg-black text-white flex-row flex jusity-center items-center">
                {whitePieceCounts.pawn
                  ? Array.from(
                      { length: whitePieceCounts.pawn },
                      (_, index) => <FaChessPawn key={`pawn-${index}`} />
                    )
                  : ""}
                {whitePieceCounts.rook
                  ? Array.from(
                      { length: whitePieceCounts.rook },
                      (_, index) => <FaChessRook key={`rook-${index}`} />
                    )
                  : ""}
                {whitePieceCounts.knight
                  ? Array.from(
                      { length: whitePieceCounts.knight },
                      (_, index) => <FaChessKnight key={`knight-${index}`} />
                    )
                  : ""}
                {whitePieceCounts.bishop
                  ? Array.from(
                      { length: whitePieceCounts.bishop },
                      (_, index) => <FaChessBishop key={`bishop-${index}`} />
                    )
                  : ""}
                {whitePieceCounts.queen
                  ? Array.from(
                      { length: whitePieceCounts.queen },
                      (_, index) => <FaChessQueen key={`queen-${index}`} />
                    )
                  : ""}
                {whitePieceCounts.king
                  ? Array.from(
                      { length: whitePieceCounts.king },
                      (_, index) => <FaChessKing key={`king-${index}`} />
                    )
                  : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col text-white w-[100%] gap-2">
        <div className="border-b-[4px] border-[#291e5c] py-2 text-2xl flex flex-row justify-between items-center w-full">
          <div className="w-[40%] flex flex-row justify-end items-center">
            {currMatch && findParticipantName(currMatch.participants[0].id)}
          </div>
          <div className="w-[20%]">
            <div className="flex flex-row items-center justify-center gap-4">
              <FaChessKing size={20} className="bg-black text-white p-[2px]" />
              {currMatch ? (
                <LuSwords size={30} className="animate-pulse" />
              ) : (
                <TbFidgetSpinner size={30} className="animate-spin" />
              )}
              <FaChessKing size={20} className="bg-white text-black p-[2px]" />
            </div>
          </div>
          <div className="w-[40%] flex flex-row justify-start items-center">
            {currMatch && findParticipantName(currMatch.participants[1].id)}
          </div>
        </div>
        <div className="flex flex-row h-[70%] min-h-[60%] overflow-y-auto items-start justify-between w-full my-auto px-4">
          <div className="w-full items-center justify-start flex flex-col-reverse transition-all duration-500">
            {wMVList.length > 0 &&
              wMVList.map((mv, index) => (
                <div
                  className={`text-sm flex flex-row justify-between w-full ${
                    index % 2 === 0 ? "bg-[#291e5c]" : ""
                  } py-[1px] pl-2`}
                  key={index}
                >
                  <div className="w-[40%] flex flex-row items-center justify-end">
                    {mv.move}
                  </div>
                  <div>{index + 1}</div>
                  <div className="w-[40%] flex flex-row items-center justify-start">
                    {bMVList[index] && bMVList[index].move}
                  </div>
                </div>
              ))}
          </div>
        </div>
        <div className="flex flex-row w-full py-2 pl-2 pr-4 border-t-[4px] border-[#291e5c]">
          <div className="flex-col flex justify-center gap-2 items-center border-2 border-white-500 mx-2 w-[70%] py-2 px-2">
            <div className="text-sm font-semibold">Next Match</div>
            <div className="text-sm flex flex-row justify-between items-center w-full">
              <div className="w-[40%] flex flex-row justify-end items-center">
                {nextMatch && findParticipantName(nextMatch.participants[0].id)}
              </div>
              <div className="w-[18%]">
                <div className="flex flex-row items-center justify-center gap-1">
                  <FaChessKing
                    size={20}
                    className="bg-black text-white p-[2px]"
                  />
                  {nextMatch ? (
                    <LuSwords size={20} className="animate-pulse" />
                  ) : (
                    <TbFidgetSpinner size={20} className="animate-spin" />
                  )}
                  <FaChessKing
                    size={20}
                    className="bg-white text-black p-[2px]"
                  />
                </div>
              </div>
              <div className="w-[40%] flex flex-row justify-start items-center">
                {nextMatch && findParticipantName(nextMatch.participants[1].id)}
              </div>
            </div>
            <div className="text-sm font-light">In Next 2 days</div>
          </div>
          <div className="flex gap-2 flex-col w-[30%]">
            <div
              className="hover:scale-[1.05] transition-all duration-500 cursor-pointer flex-col flex border-2 border-white-500 mx-2 w-full px-8 py-2 items-center justify-center"
              onClick={() => {
                makeAutoMove(true);
                setMatchResult("");
              }}
            >
              Restart Match
            </div>
            <div
              className="hover:scale-[1.05] transition-all duration-500 cursor-pointer flex-col flex border-2 border-white-500 mx-2 w-full px-8 py-2 items-center justify-center"
              onClick={() => navigate(`/bracket/${TID}`)}
            >
              Open Bracket
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Match;
