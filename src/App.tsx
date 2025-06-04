import React, { useState, useEffect } from 'react';

const WINNING_SCORE = 10000;
const MAX_ROLLS = 3;
const DICE_COUNT = 6;

function calculateScore(dice: number[]): number {
  if (!dice || dice.length === 0) return 0;
  if (dice.some(d => d < 1 || d > 6)) return 0; // Validate dice values

  let counts: number[] = Array(7).fill(0);
  dice.forEach((d: number) => counts[d]++);

  if (counts.slice(1).every(c => c === 1)) return 1500;
  if (counts.some(c => c === 6)) return 3000;
  if (counts.some(c => c === 5)) return 2000;
  if (counts.filter(c => c === 3).length === 2) return 2500;
  if (counts.filter(c => c === 2).length === 3) return 1500;
  if (counts.some(c => c === 4) && counts.some(c => c === 2)) return 1500;

  let score = 0;

  for (let i = 1; i <= 6; i++) {
    if (counts[i] >= 6) {
      score += 3000;
      counts[i] -= 6;
    } else if (counts[i] === 5) {
      score += 2000;
      counts[i] -= 5;
    } else if (counts[i] === 4) {
      score += 1000;
      counts[i] -= 4;
    }
  }

  for (let i = 6; i >= 1; i--) {
    if (counts[i] >= 3) {
      switch (i) {
        case 1: score += 300; break;
        case 2: score += 200; break;
        case 3: score += 300; break;
        case 4: score += 400; break;
        case 5: score += 500; break;
        case 6: score += 600; break;
      }
      counts[i] -= 3;
    }
  }

  score += counts[1] * 100;
  score += counts[5] * 50;

  return score;
}

function calculateScoreAndCheckAllDiceScore(dice: number[]): { totalScore: number; allDiceScoring: boolean } {
  if (!dice || dice.length === 0) return { totalScore: 0, allDiceScoring: true };
  if (dice.some(d => d < 1 || d > 6)) return { totalScore: 0, allDiceScoring: false };

  const counts: number[] = Array(7).fill(0);
  dice.forEach((d: number) => counts[d]++);

  let totalScore = 0;
  let scoringDiceCount = 0;

  if (dice.length === 6 && counts.slice(1).every(c => c === 1)) {
    return { totalScore: 1500, allDiceScoring: true };
  }

  const sixOfKind = counts.findIndex(c => c === 6);
  if (sixOfKind !== -1) {
    return { totalScore: 3000, allDiceScoring: true };
  }

  const fiveOfKind = counts.findIndex(c => c === 5);
  if (fiveOfKind !== -1) {
    const remainingDie = dice.find(d => d !== fiveOfKind);
    if (remainingDie === 1 || remainingDie === 5) {
      totalScore = 2000 + (remainingDie === 1 ? 100 : 50);
      return { totalScore, allDiceScoring: true };
    }
    return { totalScore: 2000, allDiceScoring: dice.length === 5 };
  }

  if (counts.filter(c => c === 3).length === 2) {
    return { totalScore: 2500, allDiceScoring: true };
  }

  if (counts.filter(c => c === 2).length === 3) {
    return { totalScore: 1500, allDiceScoring: true };
  }

  const fourOfKind = counts.findIndex(c => c === 4);
  if (fourOfKind !== -1 && counts.some(c => c === 2)) {
    return { totalScore: 1500, allDiceScoring: true };
  }

  for (let i = 1; i <= 6; i++) {
    if (counts[i] === 4) {
      totalScore += 1000;
      scoringDiceCount += 4;
      counts[i] -= 4;
    }
  }

  for (let i = 6; i >= 1; i--) {
    if (counts[i] >= 3) {
      switch (i) {
        case 1: totalScore += 300; break;
        case 2: totalScore += 200; break;
        case 3: totalScore += 300; break;
        case 4: totalScore += 400; break;
        case 5: totalScore += 500; break;
        case 6: totalScore += 600; break;
      }
      scoringDiceCount += 3;
      counts[i] -= 3;
    }
  }

  totalScore += counts[1] * 100;
  totalScore += counts[5] * 50;
  scoringDiceCount += counts[1] + counts[5];

  return { totalScore, allDiceScoring: scoringDiceCount === dice.length };
}

function getAllSubsets(n: number): number[][] {
  const subsets: number[][] = [];
  for (let i = 1; i < (1 << n); i++) {
    const subset: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) subset.push(j);
    }
    subsets.push(subset);
  }
  return subsets;
}

interface DiceProps {
  value: number;
  locked: boolean;
  onClick?: () => void;
}

const Dice: React.FC<DiceProps> = ({ value, locked, onClick }) => (
  <button
    onClick={onClick}
    style={{
      margin: '0.5rem',
      width: '3.5rem',
      height: '3.5rem',
      borderRadius: '0.5rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      border: '2px solid black',
      backgroundColor: locked ? '#4ade80' : 'white',
      cursor: onClick ? 'pointer' : 'default',
    }}
    disabled={!onClick || value === 0}
  >
    {value === 0 ? '?' : value}
  </button>
);

export default function App() {
  const [dice, setDice] = useState<number[]>(Array(DICE_COUNT).fill(0)); // Initialize with 0
  const [lockedDiceValues, setLockedDiceValues] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean[]>(Array(DICE_COUNT).fill(false));
  const [rolls, setRolls] = useState<number>(0);
  const [turnScore, setTurnScore] = useState<number>(0);
  const [playerScores, setPlayerScores] = useState<{ player1: number; player2: number }>({ player1: 0, player2: 0 });
  const [currentPlayer, setCurrentPlayer] = useState<number>(1);
  const [hasLockedThisTurn, setHasLockedThisTurn] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [winner, setWinner] = useState<number | null>(null);
  const [isVsComputer, setIsVsComputer] = useState<boolean>(false);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

  const rollDice = () => {
    if (gameOver) return;

    const newDice = dice.map((val, idx) =>
      locked[idx] ? val : Math.ceil(Math.random() * 6)
    );

    setDice(newDice);
    setRolls(prev => prev + 1);

    const unlockedDice = newDice.filter((_, i) => !locked[i]);
    const hasScoringDice = unlockedDice.some(die => {
      if (die === 1 || die === 5) return true;
      
      const counts: Record<number, number> = {};
      unlockedDice.forEach(d => {
        counts[d] = (counts[d] || 0) + 1;
      });
      return Object.values(counts).some(count => count >= 3);
    });

    if (!hasScoringDice) {
      const diceDisplay = [...lockedDiceValues, ...newDice]
        .map((val, idx) => locked[idx] || idx >= dice.length ? `[${val}]` : `${val}`)
        .join(', ');
      alert(`❌ Farkle! Dice: ${diceDisplay}\n(No scoring combination found.) Player ${currentPlayer}'s turn ends.`);
      resetTurn();
    }
  };

  const toggleLock = (idx: number) => {
    if (gameOver) return;
    const newLocked = [...locked];
    newLocked[idx] = !newLocked[idx];
    setLocked(newLocked);
  };

  const resetTurn = () => {
    setDice(Array(DICE_COUNT).fill(0));
    setLocked(Array(DICE_COUNT).fill(false));
    setLockedDiceValues([]);
    setRolls(0);
    setTurnScore(0);
    setHasLockedThisTurn(false);
    setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
  };

  const resetGame = () => {
    setDice(Array(DICE_COUNT).fill(0));
    setLocked(Array(DICE_COUNT).fill(false));
    setLockedDiceValues([]);
    setRolls(0);
    setTurnScore(0);
    setPlayerScores({ player1: 0, player2: 0 });
    setCurrentPlayer(1);
    setHasLockedThisTurn(false);
    setGameOver(false);
    setWinner(null);
    setGameStarted(false);
  };

  const endTurn = () => {
    if (gameOver) return;

    const currentPlayerKey = currentPlayer === 1 ? 'player1' : 'player2';
    const newScore = playerScores[currentPlayerKey] + turnScore;
    
    setPlayerScores({
      ...playerScores,
      [currentPlayerKey]: newScore
    });

    if (newScore >= WINNING_SCORE) {
      setGameOver(true);
      setWinner(currentPlayer);
    }

    resetTurn();
  };

  const canLock = (): boolean => {
    if (gameOver) return false;

    const lockedVals = dice.filter((_, i) => locked[i]);
    if (lockedVals.length === 0) return false;

    const newLockedSet = [...lockedDiceValues, ...lockedVals];
    const newTotal = calculateScore(newLockedSet);

    return newTotal > 0;
  };

  const confirmLock = () => {
    if (!canLock()) {
      alert("⚠️ You cannot lock these dice. None of them contribute to a score (Farkle).");
      return;
    }

    const lockedVals = dice.filter((_, i) => locked[i]);
    const allDice = [...lockedDiceValues, ...lockedVals];
    const updatedScore = calculateScore(allDice);
    const { allDiceScoring } = calculateScoreAndCheckAllDiceScore(allDice);
    const isHotDiceRoll = allDiceScoring && allDice.length === DICE_COUNT;

    if (isHotDiceRoll) {
      const totalTurnScore = updatedScore;
      alert(`🔥 Hot dice! You locked all 6 dice for a score of ${updatedScore}.\nRolling 6 fresh dice...`);

      const freshDice = Array(DICE_COUNT).fill(0);
      setDice(freshDice);
      setLocked(Array(DICE_COUNT).fill(false));
      setLockedDiceValues([]);
      setHasLockedThisTurn(false);
      setTurnScore(totalTurnScore);
      setRolls(0);
      return;
    }

    const newDice: number[] = [];
    const newLocked: boolean[] = [];

    dice.forEach((value, i) => {
      if (!locked[i]) {
        newDice.push(value);
        newLocked.push(false);
      }
    });

    const updatedLockedDice = [...lockedDiceValues, ...lockedVals];
    setLockedDiceValues(updatedLockedDice);
    setDice(newDice);
    setLocked(newLocked);
    setTurnScore(updatedScore);
    setHasLockedThisTurn(true);

    if (newDice.length === 0) {
      const finalScore = calculateScore(updatedLockedDice);
      if (finalScore === 0) {
        alert("No valid score to lock. Turn ends with Farkle.");
        resetTurn();
        return;
      }

      setPlayerScores(prev => ({
        ...prev,
        [currentPlayer === 1 ? 'player1' : 'player2']: 
          prev[currentPlayer === 1 ? 'player1' : 'player2'] + finalScore
      }));

      if (playerScores[currentPlayer === 1 ? 'player1' : 'player2'] + finalScore >= WINNING_SCORE) {
        setGameOver(true);
        setWinner(currentPlayer);
      }

      alert(`🎉 All dice locked! Score of ${finalScore} added to Player ${currentPlayer}. Switching to Player ${currentPlayer === 1 ? 2 : 1}.`);
      resetTurn();
    }
  };

  const canRoll = (): boolean => {
    return !gameOver && (rolls === 0 || hasLockedThisTurn);
  };

  const findBestSubsetToLock = (): { subset: number[] | null; score: number } => {
    const allSubsets = getAllSubsets(dice.length);
    let maxScore = turnScore;
    let bestSubset: number[] | null = null;

    for (const subset of allSubsets) {
      const subsetDice = subset.map(i => dice[i]);
      const candidateLocked = [...lockedDiceValues, ...subsetDice];
      const candidateScore = calculateScore(candidateLocked);
      if (candidateScore > maxScore) {
        maxScore = candidateScore;
        bestSubset = subset;
      }
    }

    return { subset: bestSubset, score: maxScore };
  };

  const shouldEndTurn = (turnScore: number, remainingDiceCount: number): boolean => {
    if (turnScore >= 500 && remainingDiceCount <= 2) return true;
    if (turnScore >= 750 && remainingDiceCount === 3) return true;
    if (turnScore >= 1000 && remainingDiceCount >= 4) return true;
    return false;
  };

  const aiPlayTurn = () => {
    if (gameOver || currentPlayer !== 2) return;

    if (canRoll()) {
      setTimeout(() => {
        rollDice();
        setTimeout(() => {
          const { subset, score } = findBestSubsetToLock();
          if (subset) {
            const remainingDiceCount = dice.length - subset.length;
            if (shouldEndTurn(score, remainingDiceCount)) {
              endTurn();
            } else {
              setLocked(Array(6).fill(false).map((_, i) => subset.includes(i)));
              confirmLock();
              setTimeout(aiPlayTurn, 1000);
            }
          } else {
            endTurn();
          }
        }, 1000);
      }, 1000);
    } else {
      const { subset, score } = findBestSubsetToLock();
      if (subset) {
        const remainingDiceCount = dice.length - subset.length;
        if (shouldEndTurn(score, remainingDiceCount)) {
          endTurn();
        } else {
          setLocked(Array(6).fill(false).map((_, i) => subset.includes(i)));
          confirmLock();
          setTimeout(aiPlayTurn, 1000);
        }
      } else {
        endTurn();
      }
    }
  };

  useEffect(() => {
    if (isVsComputer && currentPlayer === 2 && gameStarted && !gameOver) {
      aiPlayTurn();
    }
  }, [currentPlayer, gameStarted, gameOver]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(to bottom right, #f1f5f9, #dbeafe)',
        textAlign: 'center',
        padding: '1.5rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      {!gameStarted ? (
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            🎲 Farkle Game
          </h1>
          <button
            onClick={() => { setIsVsComputer(false); setGameStarted(true); }}
            style={{
              padding: '0.5rem 1rem',
              margin: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Start 2 Player Game
          </button>
          <button
            onClick={() => { setIsVsComputer(true); setGameStarted(true); }}
            style={{
              padding: '0.5rem 1rem',
              margin: '0.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
            }}
          >
            Start vs Computer Game
          </button>
        </div>
      ) : (
        <>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            🎲 Farkle Game
          </h1>
          {gameOver && (
            <div>
              <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
                Game Over! Player {winner} Wins!
              </p>
              <button
                onClick={resetGame}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  marginBottom: '1rem'
                }}
              >
                New Game
              </button>
            </div>
          )}
          <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
            Current Player: Player {currentPlayer} {isVsComputer && currentPlayer === 2 ? '(Computer)' : ''}
          </p>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            {dice.map((value, idx) => (
              <span key={idx}>
                <Dice value={value} locked={locked[idx]} onClick={() => toggleLock(idx)} />
              </span>
            ))}
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginTop: '1rem' }}>
            Locked Dice
          </h2>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              flexWrap: 'wrap',
              marginBottom: '1rem',
            }}
          >
            {lockedDiceValues.map((value, idx) => (
              <Dice key={`locked-${idx}`} value={value} locked={true} />
            ))}
          </div>
          <p style={{ fontSize: '1.125rem' }}>Rolls this turn: {rolls} / {MAX_ROLLS}</p>
          <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>Turn Score: {turnScore}</p>
          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#15803d' }}>
            Player 1 Score: {playerScores.player1}
          </p>
          <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#15803d' }}>
            Player 2 Score: {playerScores.player2}
          </p>
          <div style={{ marginTop: '1.5rem' }}>
            <button
              onClick={rollDice}
              disabled={rolls >= MAX_ROLLS || !canRoll()}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                backgroundColor: rolls >= MAX_ROLLS || !canRoll() ? '#94a3b8' : '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: rolls >= MAX_ROLLS || !canRoll() ? 'not-allowed' : 'pointer',
              }}
            >
              Roll Dice
            </button>
            <button
              onClick={endTurn}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                backgroundColor: '#22c55e',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: gameOver ? 'not-allowed' : 'pointer',
              }}
              disabled={gameOver}
            >
              End Turn
            </button>
            <button
              onClick={resetTurn}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#ef4444',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: gameOver ? 'not-allowed' : 'pointer',
              }}
              disabled={gameOver}
            >
              Reset Turn
            </button>
            <button
              onClick={confirmLock}
              disabled={!canLock()}
              style={{
                padding: '0.5rem 1rem',
                marginRight: '0.5rem',
                backgroundColor: canLock() ? '#f59e0b' : '#d1d5db',
                color: canLock() ? 'white' : '#6b7280',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: canLock() ? 'pointer' : 'not-allowed',
              }}
              title={!canLock() ? "You must select at least one scoring die to lock" : ""}
            >
              Lock Selected Dice
            </button>
          </div>
        </>
      )}
    </div>
  );
}
