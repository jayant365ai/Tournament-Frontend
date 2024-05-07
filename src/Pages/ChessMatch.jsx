import React, { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { Chess } from 'chess.js';

const ChessMatch = () => {
    const [game] = useState(new Chess());  // The game object is directly manipulated
    const [fen, setFen] = useState("start");

    // Define makeAutoMove inside the component but outside the useEffect
    const makeAutoMove = async () => {
        try {
            console.log(game.turn())
            const response = await fetch('http://localhost:5000/api/chess/move', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ fen: game.fen(), turn: game.turn() })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok.');
            }

            const data = await response.json();
            if (game.move(data.move)) {  // Make sure the move is valid
                setFen(game.fen());
            }
        } catch (error) {
            console.error("Failed to fetch the move: ", error);
        }
    };

    // Effect to handle automatic moves
    useEffect(() => {
        // Trigger the first move right after mounting
        makeAutoMove();

        // Set up a timer to make automatic moves every 2 seconds
        const timer = setInterval(() => {
            makeAutoMove();
        }, 2000);

        return () => clearInterval(timer);  // Proper cleanup on unmount
    }, []);  // Empty dependency array to run only once after mounting

    return (
        <div>
            <Chessboard
                width={400}
                position={fen}
                onDrop={(move) => {
                    const moveObj = { from: move.sourceSquare, to: move.targetSquare, promotion: "q" };
                    if (game.move(moveObj)) {
                        setFen(game.fen());
                        makeAutoMove();  // Optionally trigger another move after user's move
                    }
                }}
            />
            
        </div>
    );
}

export default ChessMatch;
