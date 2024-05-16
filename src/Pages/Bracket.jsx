import React, { useEffect, useState } from "react";
import {
  SingleEliminationBracket,
  DoubleEliminationBracket,
  Match,
  MATCH_STATES,
  SVGViewer,
  createTheme,
} from "@g-loot/react-tournament-brackets";
import axios from "axios";
import { useWindowSize } from "@uidotdev/usehooks";
import SvgViewer from "@g-loot/react-tournament-brackets/dist/cjs/svg-viewer";
import { useParams } from "react-router-dom";

const Bracket = () => {
  const teamData = sessionStorage.getItem("teamData");
  const { TID } = useParams();
  const size = useWindowSize();
  const [matchList, setMatchList] = useState([]);
  const [teamList, setTeamList] = useState(() => JSON.parse(teamData));
  const matches = [
    {
      id: 260005,
      name: "Final - Match",
      nextMatchId: null, // Id for the nextMatch in the bracket, if it's final match it must be null OR undefined
      tournamentRoundText: "4", // Text for Round Header
      startTime: "2021-05-30",
      state: "DONE", // 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | 'DONE' | 'SCORE_DONE' Only needed to decide walkovers and if teamNames are TBD (to be decided)
      participants: [
        {
          id: "c016cb2a-fdd9-4c40-a81f-0cc6bdf4b9cc", // Unique identifier of any kind
          resultText: "WON", // Any string works
          isWinner: false,
          status: null, // 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY' | null
          name: "giacomo123",
        },
        {
          id: "9ea9ce1a-4794-4553-856c-9a3620c0531b",
          resultText: null,
          isWinner: true,
          status: null, // 'PLAYED' | 'NO_SHOW' | 'WALK_OVER' | 'NO_PARTY'
          name: "Ant",
        },
      ],
    },
  ];

  const getData = () => {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `${import.meta.env.VITE_REACT_APP_SERVER}api/brackets/getAllBrkt?TID=${TID}`,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(response);
        const transformedMatches = response.data.map((match) => {
            const scores = match.score.split("-").map(score => parseInt(score));
            const findteam1 = teamList.find((teamItem) => {
                return match.team1Id === teamItem.id;
            })
            const findteam2 = teamList.find((teamItem) => {
                return match.team2Id === teamItem.id;
            })
          return {
            id: match._id,
            nextMatchId: match.nextMatchID,
            tournamentRoundText: match.roundNumber,
            state: match.state === "complete" ? "DONE" : "NO_SHOW",
            participants: [
              {
                id: match.team1Id,
                resultText: `${scores[0] || scores[0] === 0 ? scores[0] : "TBH"}`,
                isWinner: match.team1Id === match.winner,
                status: null,
                name: match.team1Id ? findteam1?.name : " - ",
              },
              {
                id: match.team2Id,
                resultText: `${scores[1] || scores[1] === 0 ? scores[1] : "TBH"}`,
                isWinner: match.team2Id === match.winner,
                status: null,
                name: match.team2Id ? findteam2?.name : " - ",
              },
            ],
          };
        });
        console.log(matches);
        setMatchList(transformedMatches);
        console.log(matchList);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <div className="min-w-[100%] min-h-[90vh] py-4 px-10 flex flex-col gap-2">
      {matchList.length && (
        <SingleEliminationBracket
          matches={matchList}
          matchComponent={Match}
          options={{
            style: {
              roundHeader: { backgroundColor: "#AAA" },
              connectorColor: "#FF8C00",
              connectorColorHighlight: "#000",
            },
          }}
          svgWrapper={({ children, ...props }) => (
            <SvgViewer
              background="#FFF"
              SVGBackground="#FFF"
              width={size.width + 50}
              height={size.height + 50}
              {...props}
            >
              {children}
            </SvgViewer>
          )}
        />
      )}
    </div>
  );
};

export default Bracket;
