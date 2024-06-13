const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const getPieceRepresentation = (piece) => {
    const unicodePieces = {
        r: "♜",
        n: "♞",
        b: "♝",
        q: "♛",
        k: "♚",
        R: "♖",
        N: "♘",
        B: "♗",
        Q: "♕",
        K: "♔",
    };

    if (piece.type === 'p') {
        return piece.color === 'b' ? "/images/bp.png" : "/images/wp.png";
    } else {
        return unicodePieces[piece.type] || "";
    }
};

const handleMove = (sourceSquare, targetSquare) => {
    console.log("Move from", sourceSquare, "to", targetSquare);
    const move = {
        from: `${String.fromCharCode(97 + sourceSquare.col)}${8 - sourceSquare.row}`,
        to: `${String.fromCharCode(97 + targetSquare.col)}${8 - targetSquare.row}`,
        promotion: "q",
    };
    socket.emit("move", move);
};

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = ""; 
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => { 
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 == 0 ? "light" : "dark" 
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color == "w" ? "white" : "black"
                );

                const pieceRepresentation = getPieceRepresentation(square);
                
                if (square.type === 'p') {
                    const pieceImage = document.createElement("img");
                    pieceImage.src = pieceRepresentation;
                    pieceImage.classList.add('piece-image');
                    pieceImage.draggable = playerRole === square.color;

                    pieceImage.addEventListener("dragstart", (e) => {
                        if (pieceImage.draggable) {
                            draggedPiece = pieceElement;
                            sourceSquare = { row: rowindex, col: squareindex };
                            e.dataTransfer.setData("text/plain", ""); 
                        }
                    });

                    pieceImage.addEventListener("dragend", (e) => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });

                    pieceElement.appendChild(pieceImage);
                } else {
                    pieceElement.innerText = pieceRepresentation;
                    pieceElement.draggable = playerRole === square.color;

                    pieceElement.addEventListener("dragstart", (e) => {
                        if (pieceElement.draggable) {
                            draggedPiece = pieceElement;
                            sourceSquare = { row: rowindex, col: squareindex };
                            e.dataTransfer.setData("text/plain", ""); 
                        }
                    });

                    pieceElement.addEventListener("dragend", (e) => {
                        draggedPiece = null;
                        sourceSquare = null;
                    });
                }

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSquare = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSquare); 
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

socket.on("playerRole", (role) => {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", () => {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", (fen) => {
    chess.load(fen);
    renderBoard();
});

socket.on("move", (move) => {
    chess.move(move);
    renderBoard();
});

document.addEventListener("DOMContentLoaded", () => {
    renderBoard();
});
