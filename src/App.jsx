import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import "./App.css";
import Bracket from "./Pages/Bracket";
import Home from "./Pages/Home";
import Tournament from "./Pages/Tournament";
import ChessMatch from "./Pages/ChessMatch";
import RegisterUser from "./Pages/RegisterUser";
import Match from "./Pages/Match";

function App() {
  return (
    <Router>
      <div className="flex flex-row gap-4 min-w-full px-4 text-white">
        <Link to="/">Home</Link>
      </div>
      <Routes>
        <Route path="/tournament/:TID" element={<Tournament />}></Route>
        <Route path="/bracket/:TID" element={<Bracket />}></Route>
        <Route path="/ChessMatch/:MID" element={<ChessMatch />}></Route>
        <Route path="/trnhome" element={<Home />}></Route>
        <Route path="/" element={<RegisterUser />}></Route>
        <Route path="/match" element={<Match />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
