import React, { useState, useEffect } from 'react';

const WINNING_SCORE = 10000;
const MAX_ROLLS = 3;
const MONTE_CARLO_SIMULATIONS = 1000; // Number of simulations for Monte Carlo

function calculateScore(dice: number[]): number {
  if (dice.length === 0) return 0;

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
        case 2: score += 200; break;
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
    disabled={!onClick}
  >
    {value}
  </button>
);

// Simulate a single roll of n dice
function simulateRoll(n: number): number[] {
  return Array(n).fill(0).map(() => Math.ceil(Math.random() * 6));
}

// Estimate the expected value of continuing with remaining dice
function simulateFutureRolls(remainingDiceCount: number, currentScore: number): { expectedScore: number; farkleProbability: number } {
  let totalScore = 0;
  let farkleCount = 0;

  for (let i = 0; i < MONTE_CARLO_SIMULATIONS; i++) {
    const newRoll = simulateRoll(remainingDiceCount);
    const allSubsets = getAllSubsets(remainingDiceCount);
    let bestSubsetScore = 0;

    for (const subset of allSubsets) {
      const subsetDice = subset.map(idx => newRoll[idx]);
      const score = calculateScore(subsetDice);
      if (score > bestSubsetScore) {
        bestSubsetScore = score;
      }
    }

    if (bestSubsetScore === 0) {
      farkleCount++;
    } else {
      totalScore += bestSubsetScore;
    }
  }

  const expectedScore = totalScore / MONTE_CARLO_SIMULATIONS;
  const farkleProbability = farkleCount / MONTE_CARLO_SIMULATIONS;
  return { expectedScore, farkleProbability };
}

export default function App() {
  const [dice, setDice] = useState<number[]>(Array(6).fill(1));
  const [lockedDiceValues, setLockedDiceValues] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean[]>(Array(6).fill(false));
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

    const allDiceInPlay = [...lockedDiceValues, ...newDice];
    const allDiceLockedStatus = [
      ...lockedDiceValues.map(() => true),
      ...locked
    ];

    const lockedInCurrentRoll = newDice.filter((_, i) => locked[i]);
    const base = [...lockedDiceValues, ...lockedInCurrentRoll];
    const baseScore = calculateScore(base);

    const unlockedIndices = newDice
      .map((_, i) => i)
      .filter(i => !locked[i]);
    const subsets = getAllSubsets(unlockedIndices.length);

    const farkle = !subsets.some(subset => {
      if (subset.length === 0) return false;
      const testDice = [...base, ...subset.map(i => newDice[i])];
      return calculateScore(testDice) > baseScore;
    });

    if (farkle) {
      const diceDisplay = allDiceInPlay.map((val, idx) =>
        allDiceLockedStatus[idx] ? `[${val}]` : `${val}`
      ).join(', ');
      alert(`❌ Farkle! Dice: ${diceDisplay}\n(No scoring combination found.) Player ${currentPlayer}'s turn ends.`);
      resetTurn();
      return;
    }
  };

  const toggleLock = (idx: number) => {
    if (gameOver) return;
    const newLocked = [...locked];
    newLocked[idx] = !newLocked[idx];
    setLocked(newLocked);
  };

  const resetTurn = () => {
    setDice(Array(6).fill(1));
    setLocked(Array(6).fill(false));
    setLockedDiceValues([]);
    setRolls(0);
    setTurnScore(0);
    setHasLockedThisTurn(false);
    setCurrentPlayer(prev => (prev === 1 ? 2 : 1));
  };

  const endTurn = () => {
    if (gameOver) return;

    setPlayerScores({
      ...playerScores,
      [`player${currentPlayer}`]: playerScores[`player${currentPlayer}` as keyof typeof playerScores] + turnScore
    });

    if (playerScores[`player${currentPlayer}` as keyof typeof playerScores] + turnScore >= WINNING_SCORE) {
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

    return newTotal > turnScore;
  };

  const confirmLock = () => {
    if (!canLock()) {
      alert("⚠️ You cannot lock these dice. None of them contribute to a score (Farkle).");
      return;
    }

    const lockedVals = dice.filter((_, i) => locked[i]);
    const updatedScore = calculateScore([...lockedDiceValues, ...lockedVals]);
    const { allDiceScoring } = calculateScoreAndCheckAllDiceScore(dice);
    const isHotDiceRoll = allDiceScoring;

    if (isHotDiceRoll) {
      const totalTurnScore = updatedScore;
      alert(`🔥 Hot dice! You locked all 6 dice for a score of ${updatedScore}.\nRolling 6 fresh dice...`);

      const freshDice = Array(6).fill(1);
      setDice(freshDice);
      setLocked(Array(6).fill(false));
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
      setPlayerScores(prev => {
        const newScores = { ...prev };
        newScores[`player${currentPlayer}` as keyof typeof playerScores] += updatedScore;

        if (newScores[`player${currentPlayer}` as keyof typeof playerScores] >= WINNING_SCORE) {
          setGameOver(true);
          setWinner(currentPlayer);
        }

        return newScores;
      });

      alert(`🎉 All dice locked! Score of ${updatedScore} added to Player ${currentPlayer}. Switching to Player ${currentPlayer === 1 ? 2 : 1}.`);
      resetTurn();
    }
  };

  const canRoll = (): boolean => {
    return !gameOver && (rolls === 0 || hasLockedThisTurn);
  };

  const findBestSubsetToLock = (): { subset: number[] | null; score: number; expectedValue: number } => {
    const allSubsets = getAllSubsets(dice.length);
    let maxExpectedValue = turnScore; // Baseline: end turn now
    let bestSubset: number[] | null = null;
    let bestScore = turnScore;

    for (const subset of allSubsets) {
      const subsetDice = subset.map(i => dice[i]);
      const candidateLocked = [...lockedDiceValues, ...subsetDice];
      const candidateScore = calculateScore(candidateLocked);
      if (candidateScore <= turnScore) continue; // Skip non-scoring subsets

      const remainingDiceCount = dice.length - subset.length;
      const { expectedScore, farkleProbability } = simulateFutureRolls(remainingDiceCount, candidateScore);
      const expectedValue = (1 - farkleProbability) * (candidateScore + expectedScore);

      if (expectedValue > maxExpectedValue) {
        maxExpectedValue = expectedValue;
        bestSubset = subset;
        bestScore = candidateScore;
      }
    }

    return { subset: bestSubset, score: bestScore, expectedValue: maxExpectedValue };
  };

  const aiPlayTurn = () => {
    if (gameOver || currentPlayer !== 2) return;

    if (canRoll()) {
      setTimeout(() => {
        rollDice();
        setTimeout(() => {
          const { subset, score, expectedValue } = findBestSubsetToLock();
          if (subset && expectedValue > turnScore + 300) { // Threshold to avoid overly conservative play
            setLocked(Array(dice.length).fill(false).map((_, i) => subset.includes(i)));
            confirmLock();
            setTimeout(aiPlayTurn, 1000);
          } else {
            endTurn();
          }
        }, 1000);
      }, 1000);
    } else {
      const { subset, score, expectedValue } = findBestSubsetToLock();
      if (subset && expectedValue > turnScore + 300) {
        setLocked(Array(dice.length).fill(false).map((_, i) => subset.includes(i)));
        confirmLock();
        setTimeout(aiPlayTurn, 1000);
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
            <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
              Game Over! Player {winner} Wins!
            </p>
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
            >
              Lock Selected Dice
            </button>
          </div>
        </>
      )}
    </div>
  );
}
