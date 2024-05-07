import axios from "axios";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

const Tournament = () => {
  const storedData = sessionStorage.getItem("tourData");
  const navigate = useNavigate();
  const [teamList, setTeamList] = useState([]);
  const [matchList, setMatchList] = useState([]);
  const [tourData, setTourData] = useState(() => JSON.parse(storedData));
  const [teamName, setTeamName] = useState("");
  const [teamSeed, setTeamSeed] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [team1Score, setTeam1Score] = useState("");
  const [team2Score, setTeam2Score] = useState("");
  const [selectedTeam, setSelectedTeam] = useState({});
  const { TID } = useParams();

  const getAllTeamData = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `http://localhost:5000/api/players/getAll?TID=${TID}`,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(response.data.data);
        setTeamList(response.data.data);
        const teamdataString = JSON.stringify(response.data.data);
        sessionStorage.setItem("teamData", teamdataString);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const addTeam = (e) => {
    e.preventDefault();
    if (!teamName || !teamSeed) {
      alert("Enter Name and Seed");
      return;
    }
    let seedInt = parseInt(teamSeed);
    if (teamList.length) {
      const found = teamList.find((team) => {
        return team.seed === seedInt; // Include a return statement
      });
      if (found || seedInt < 1) {
        alert("Seed already exist or smaller than 1");
        return;
      }
    }
    setIsLoading(true);
    let data = JSON.stringify({
      TID,
      participant: {
        teamName,
        teamSeed,
      },
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:5000/api/players/addPlayer",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        alert("Successfully added a team");
        getAllTeamData();
        setIsLoading(false);
      })
      .catch((error) => {
        alert("Failed to add a team");
        setIsLoading(false);
      });
  };

  const startTour = (e) => {
    e.preventDefault();
    let data = JSON.stringify({
      TID,
    });

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:5000/api/brackets/start",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        alert("Tournament Started");
        navigate("/");
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getOpenMatch = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `http://localhost:5000/api/brackets/getAllBrkt?TID=${TID}`,
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
        setMatchList(filteredMatches);
        console.log(matchList);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const submitScore = (e) => {
    e.preventDefault();
    console.log(selectedTeam);
    const MID = selectedTeam.id;
    let WID;
    const tempscore1 = parseInt(team1Score);
    const teamscore2 = parseInt(team2Score);
    const scoreList = `${tempscore1}-${teamscore2}`;
    if (team1Score === team2Score) {
      alert("No Draw Matches");
      return;
    }

    if (team1Score > team2Score) {
      WID = selectedTeam.participants[0].id;
    } else {
      WID = selectedTeam.participants[1].id;
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
      url: "http://localhost:5000/api/matches/updateScore",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        alert("updated scores");
        getOpenMatch();
        setTeam1Score("");
        setTeam2Score("");
        setSelectedTeam({});
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    getAllTeamData();
    getOpenMatch();
  }, []);

  const handleClick = (item) => {
    console.log("clicked", item);
    sessionStorage.setItem("matchInfo", JSON.stringify(item));
    const { id } = item;
    navigate(`/ChessMatch/${id}`);
  };
  return (
    <div className="min-w-[100%] min-h-[90vh] py-4 px-10 flex flex-col gap-2">
      <h1 className="text-4xl font-bold text-white">Teams</h1>
      <div className="text-white flex flex-col gap-2 ">
        {teamList?.length &&
          teamList.map((item) => (
            <div
              className="transition duration-300 ease border-white border-[1px] px-3 py-2 cursor-pointer hover:scale-[1.01]"
              key={item.id}
            >
              Name: {item.name} || TeamId: {item.id} || seed: {item.seed}
            </div>
          ))}
      </div>
      {tourData.state !== "underway" && (
        <div>
          <form
            className="flex flex-row items-center"
            onSubmit={(e) => addTeam(e)}
          >
            <div className="bg-black py-2 pl-4">
              <input
                className="text-white bg-transparent border-white border-r-[1px]"
                type="text"
                name="teamName"
                value={teamName}
                minLength={3}
                required={true}
                onChange={(e) => {
                  console.log(e.currentTarget.value);
                  setTeamName(e.currentTarget.value);
                }}
              />
            </div>
            <div className="bg-black py-2 pl-4">
              <input
                className="text-white bg-transparent border-white border-r-[1px]"
                type="text"
                name="teamSeed"
                value={teamSeed}
                minLength={1}
                required={true}
                onChange={(e) => {
                  console.log(e.currentTarget.value);
                  setTeamSeed(e.currentTarget.value);
                }}
              />
            </div>
            <button
              className="bg-black text-white py-2 px-6"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? "Loading" : "ADD"}
            </button>
          </form>
        </div>
      )}
      {tourData.state === "pending" && (
        <div className="flex flex-row">
          <div className=" flex flex-row bg-black py-2 pl-4 w-fit">
            <p className="flex flex-row text-white bg-transparent border-white pr-4 border-r-[1px]">
              *You cannot add/remove teams after starting tournament
            </p>
          </div>
          <button
            className="bg-black text-white py-2 px-6"
            disabled={isLoading}
            onClick={(e) => startTour(e)}
          >
            Start Tournament
          </button>
        </div>
      )}
      <div className="text-4xl font-bold text-white flex flex-row gap-2 items-center">
        Matches{" "}
        <button
          className="bg-black text-sm ml-2 py-2 px-6"
          onClick={() => {
            navigate(`/bracket/${TID}`);
          }}
        >
          OPEN BRACKET
        </button>
      </div>
      <div className="text-white flex flex-col gap-2 ">
        {matchList?.length &&
          matchList.map((item) => (
            <div
              className="flex flex-col gap-2 transition duration-300 ease border-white border-[1px] px-3 py-2 cursor-pointer hover:scale-[1.01]"
              key={item.id}
              onClick={() => handleClick(item)}
            >
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  setSelectedTeam(item);
                  submitScore(e);
                }}
              >
                <div>
                  MatchID : {item.id} || State: {item.state} || Round:{" "}
                  {item.roundNumber} || WinnerNextMatch: {item.nextMatchId} ||
                  {item.state === "complete" ? (
                    item.participants[0].isWinner ? (
                      "Winner: " + item.participants[0].name
                    ) : (
                      "Winner: " + item.participants[1].name
                    )
                  ) : (
                    <button
                      type="submit"
                      className="bg-black text-white mx-1 px-6"
                      disabled={isLoading}
                    >
                      Submit Score
                    </button>
                  )}
                </div>
                <div>
                  Team1ID : {item?.participants[0]?.id} || Name:{" "}
                  {item.participants[0].name} || Score:{" "}
                  {item.state === "complete" ? (
                    item.participants[0].resultText
                  ) : (
                    <input
                      className="text-white bg-black px-2"
                      type="number"
                      name="team1Score"
                      value={team1Score}
                      minLength={1}
                      required={true}
                      onChange={(e) => {
                        console.log(e.currentTarget.value);
                        setTeam1Score(e.currentTarget.value);
                      }}
                    />
                  )}
                </div>
                <div>
                  Team2ID : {item?.participants[1]?.id} || Name:{" "}
                  {item.participants[1].name} || Score:{" "}
                  {item.state === "complete" ? (
                    item.participants[1].resultText
                  ) : (
                    <input
                      className="text-white bg-black px-2"
                      type="number"
                      name="team2Score"
                      value={team2Score}
                      minLength={1}
                      required={true}
                      onChange={(e) => {
                        console.log(e.currentTarget.value);
                        setTeam2Score(e.currentTarget.value);
                      }}
                    />
                  )}
                </div>
              </form>
            </div>
          ))}
      </div>
    </div>
  );
};

export default Tournament;
