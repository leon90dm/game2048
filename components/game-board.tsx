'use client'

import React, { useState, useEffect, useCallback } from 'react'

type Tile = {
  value: number
  id: number
}

type GameState = {
  board: Tile[][]
  score: number
  bestScore: number
  gameOver: boolean
  won: boolean
}

const GRID_SIZE = 4
const WINNING_TILE = 2048

// Helper functions moved outside the component
const isGameOver = (board: Tile[][]) => {
  // Check if there are any empty cells
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (!board[i][j]) return false
    }
  }

  // Check if any adjacent cells have the same value
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      const value = board[i][j].value
      if (
        (i < GRID_SIZE - 1 && board[i + 1][j].value === value) ||
        (j < GRID_SIZE - 1 && board[i][j + 1].value === value)
      ) {
        return false
      }
    }
  }

  return true
}

const hasWon = (board: Tile[][]) => {
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if (board[i][j] && board[i][j].value === WINNING_TILE) {
        return true
      }
    }
  }
  return false
}

export function GameBoard() {
  const [gameState, setGameState] = useState<GameState>({
    board: [],
    score: 0,
    bestScore: 0,
    gameOver: false,
    won: false
  })

  const addRandomTile = useCallback((board: Tile[][]) => {
    const emptyTiles = []
    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        if (!board[i][j]) {
          emptyTiles.push({ i, j })
        }
      }
    }
    if (emptyTiles.length > 0) {
      const { i, j } = emptyTiles[Math.floor(Math.random() * emptyTiles.length)]
      board[i][j] = {
        value: Math.random() < 0.9 ? 2 : 4,
        id: Date.now()
      }
    }
    return board
  }, [])

  const move = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (gameState.gameOver || gameState.won) return

    let newBoard = JSON.parse(JSON.stringify(gameState.board))
    let newScore = gameState.score
    let moved = false

    const moveAndMerge = (line: Tile[]) => {
      // Remove nulls
      line = line.filter(tile => tile !== null)
      
      // Merge tiles
      for (let i = 0; i < line.length - 1; i++) {
        if (line[i] && line[i + 1] && line[i].value === line[i + 1].value) {
          line[i].value *= 2
          newScore += line[i].value
          line[i + 1] = null
          moved = true
          i++
        }
      }
      
      // Remove nulls again and pad with nulls
      line = line.filter(tile => tile !== null)
      while (line.length < GRID_SIZE) {
        line.push(null)
      }
      
      return line
    }

    if (direction === 'left' || direction === 'right') {
      newBoard = newBoard.map(row => {
        const line = direction === 'left' ? row : row.slice().reverse()
        const mergedLine = moveAndMerge(line)
        const newLine = direction === 'left' ? mergedLine : mergedLine.reverse()
        moved = moved || !row.every((tile, index) => tile === newLine[index])
        return newLine
      })
    } else {
      for (let col = 0; col < GRID_SIZE; col++) {
        let line = newBoard.map(row => row[col])
        line = direction === 'up' ? moveAndMerge(line) : moveAndMerge(line.reverse()).reverse()
        const newLine = line
        moved = moved || !newBoard.every((row, index) => row[col] === newLine[index])
        for (let row = 0; row < GRID_SIZE; row++) {
          newBoard[row][col] = newLine[row]
        }
      }
    }

    if (moved) {
      newBoard = addRandomTile(newBoard)
      const gameOver = isGameOver(newBoard)
      const won = hasWon(newBoard)
      setGameState(prevState => ({
        ...prevState,
        board: newBoard,
        score: newScore,
        gameOver,
        won
      }))
    }
  }, [gameState, addRandomTile])

  const initializeGame = useCallback(() => {
    let newBoard = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
    newBoard = addRandomTile(newBoard)
    newBoard = addRandomTile(newBoard)
    setGameState(prevState => ({
      board: newBoard,
      score: 0,
      bestScore: prevState.bestScore,
      gameOver: false,
      won: false
    }))
  }, [addRandomTile])

  useEffect(() => {
    initializeGame()
    const storedBestScore = localStorage.getItem('bestScore')
    if (storedBestScore) {
      setGameState(prevState => ({ ...prevState, bestScore: parseInt(storedBestScore, 10) }))
    }
  }, [initializeGame])

  useEffect(() => {
    if (gameState.score > gameState.bestScore) {
      setGameState(prevState => ({ ...prevState, bestScore: gameState.score }))
      localStorage.setItem('bestScore', gameState.score.toString())
    }
  }, [gameState.score, gameState.bestScore])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!gameState.gameOver && !gameState.won) {
        switch (event.key) {
          case 'ArrowUp':
            move('up')
            break
          case 'ArrowDown':
            move('down')
            break
          case 'ArrowLeft':
            move('left')
            break
          case 'ArrowRight':
            move('right')
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [gameState, move])

  const getTileColor = (value: number) => {
    const colors: { [key: number]: string } = {
      2: 'bg-yellow-200',
      4: 'bg-yellow-300',
      8: 'bg-orange-300',
      16: 'bg-orange-400',
      32: 'bg-red-400',
      64: 'bg-red-500',
      128: 'bg-blue-400',
      256: 'bg-blue-500',
      512: 'bg-indigo-400',
      1024: 'bg-indigo-500',
      2048: 'bg-purple-500'
    }
    return colors[value] || 'bg-gray-300'
  }

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    move(direction)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <h1 className="text-4xl font-bold mb-4">2048</h1>
      <div className="bg-gray-300 p-4 rounded-lg">
        <div className="grid grid-cols-4 gap-2">
          {gameState.board.map((row, i) =>
            row.map((tile, j) => (
              <div
                key={`${i}-${j}`}
                className={`w-16 h-16 flex items-center justify-center text-2xl font-bold rounded-lg ${
                  tile ? getTileColor(tile.value) : 'bg-gray-200'
                }`}
              >
                {tile ? tile.value : ''}
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-4 flex justify-between w-full max-w-xs">
        <p className="text-xl">Score: {gameState.score}</p>
        <p className="text-xl">Best: {gameState.bestScore}</p>
      </div>
      {gameState.gameOver && <p className="mt-4 text-2xl font-bold text-red-500">Game Over!</p>}
      {gameState.won && <p className="mt-4 text-2xl font-bold text-green-500">You Won!</p>}
      
      {/* Add on-screen controls */}
      <div className="mt-4 grid grid-cols-3 gap-2">
        <button onClick={() => handleMove('left')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">←</button>
        <div className="grid grid-rows-2 gap-2">
          <button onClick={() => handleMove('up')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">↑</button>
          <button onClick={() => handleMove('down')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">↓</button>
        </div>
        <button onClick={() => handleMove('right')} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">→</button>
      </div>
      
      <button
        onClick={initializeGame}
        className="mt-4 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
      >
        New Game
      </button>
    </div>
  )
}