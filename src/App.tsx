import { useState } from 'react';

const MAX_ROLLS = 3;

// Input: dice is an array of 6 dice, e.g. [1,1,5,1,6,6]
function calculateScore(dice: number[]): number {
  if (dice.length === 0) return 0;

  let counts: number[] = Array(7).fill(0);
  dice.forEach((d: number) => counts[d]++);

  // 1. Straight 1-6
  if (counts.slice(1).every(c => c === 1)) return 1500;

  // 2. Six of a kind
  if (counts.some(c => c === 6)) return 3000;

  // 3. Five of a kind
  if (counts.some(c => c === 5)) return 2000;

  // 4. Two triplets
  if (counts.filter(c => c === 3).length === 2) return 2500;

  // 5. Three pairs
  if (counts.filter(c => c === 2).length === 3) return 1500;

  // 6. Four of a kind + a pair
  if (counts.some(c => c === 4) && counts.some(c => c === 2)) return 1500;

  let score = 0;

  // 7. Handle 6, 5, 4 of a kind
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

  // 8. Three of a kind (priority: 6 to 1) — must be >= 3
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

  // 9. Remaining single 1s and 5s
  score += counts[1] * 100;
  score += counts[5] * 50;

  return score;
}

// function calculateScoreAndCheckAllDiceScore(dice: number[]): { totalScore: number; allDiceScoring: boolean } {
//   const counts: Record<number, number> = {};
//   for (const die of dice) {
//     counts[die] = (counts[die] || 0) + 1;
//   }

//   let totalScore = 0;
//   let scoringDiceCount = 0;

//   for (const [dieStr, count] of Object.entries(counts)) {
//     const die = Number(dieStr);
//     if (count >= 3) {
//       if (die === 1) {
//         totalScore += 300 * Math.pow(2, count - 3);
//       } else {
//         totalScore += die * 100 * Math.pow(2, count - 3);
//       }
//       scoringDiceCount += count;
//     }
//   }

//   for (const [dieStr, count] of Object.entries(counts)) {
//     const die = Number(dieStr);
//     const leftover = count % 3;
//     if (die === 1) {
//       totalScore += 100 * leftover;
//       scoringDiceCount += leftover;
//     } else if (die === 5) {
//       totalScore += 50 * leftover;
//       scoringDiceCount += leftover;
//     }
//   }

//   const allDiceScoring = (scoringDiceCount === dice.length);

//   return {
//     totalScore,
//     allDiceScoring,
//   };
// }


function calculateScoreAndCheckAllDiceScore(dice: number[]): { totalScore: number; allDiceScoring: boolean } {
  const counts: Record<number, number> = {};
  for (const die of dice) {
    counts[die] = (counts[die] || 0) + 1;
  }

  let totalScore = 0;
  let scoringDiceCount = 0;

  // (Your scoring logic is currently commented out — include it when needed)

  let allDiceScoring = scoringDiceCount === dice.length;

  if (!allDiceScoring && dice.length === 6) {
    const values = Object.values(counts).sort((a, b) => b - a);
    const uniqueDice = Object.keys(counts).length;

    // Case 1: 6-dice straight (1–6)
    if (uniqueDice === 6) {
      return { totalScore, allDiceScoring: true };
    }

    // Case 2: 3 pairs
    if (values.length === 3 && values.every(v => v === 2)) {
      return { totalScore, allDiceScoring: true };
    }

    // Case 7: 5-of-a-kind + one 1 or 5
if (values.includes(5)) {
  const fiveOfKindDie = Number(Object.keys(counts).find(die => counts[+die] === 5)!);
  const remaining = dice.filter(d => d !== fiveOfKindDie);
  if (remaining.length === 1 && (remaining[0] === 1 || remaining[0] === 5)) {
    return { totalScore, allDiceScoring: true };
  }
}


    // Case 5: 4-of-a-kind + any pair (including 1s/5s or any matching values)
if (values.includes(4)) {
  const fourOfKindDie = Number(Object.keys(counts).find(die => counts[+die] === 4)!);
  const remaining = dice.filter(d => d !== fourOfKindDie);

  const remCounts: Record<number, number> = {};
  for (const d of remaining) {
    remCounts[d] = (remCounts[d] || 0) + 1;
  }

  const remValues = Object.values(remCounts);
  if (remValues.length === 1 && remValues[0] === 2) {
    return { totalScore, allDiceScoring: true }; // 4-of-a-kind + a pair of any die
  }
}


    // Case 4: Two 3-of-a-kinds
    if (values.filter(v => v === 3).length === 2) {
      return { totalScore, allDiceScoring: true };
    }

    // Case 5: 4-of-a-kind + two 1s/5s
    if (values.includes(4)) {
      const fourOfKindDie = Number(Object.keys(counts).find(die => counts[+die] === 4)!);
      const remaining = dice.filter(d => d !== fourOfKindDie);
      if (remaining.length === 2 && remaining.every(d => d === 1 || d === 5)) {
        return { totalScore, allDiceScoring: true };
      }
    }

    // Case 6: 3-of-a-kind + another 3-of-a-kind or 1s/5s
    if (values.includes(3)) {
      const tripletDie = Number(Object.keys(counts).find(die => counts[+die] === 3)!);
      const remaining = dice.filter(d => d !== tripletDie);

      const remCounts: Record<number, number> = {};
      for (const d of remaining) {
        remCounts[d] = (remCounts[d] || 0) + 1;
      }

      const remValues = Object.values(remCounts);
      if (remValues.includes(3)) {
        return { totalScore, allDiceScoring: true }; // two triplets
      } else {
        const scoringRem = remaining.filter(d => d === 1 || d === 5);
        if (scoringRem.length === remaining.length) {
          return { totalScore, allDiceScoring: true }; // remaining all scoring
        }
      }
    }
  }

  return {
    totalScore,
    allDiceScoring,
  };
}


const getSubsets = (arr: number[]): number[][] => {
  const result: number[][] = [];
  const n = arr.length;

  for (let i = 1; i < (1 << n); i++) {
    const subset: number[] = [];
    for (let j = 0; j < n; j++) {
      if (i & (1 << j)) subset.push(arr[j]);
    }
    result.push(subset);
  }

  return result;
};

// function countScoringDice(dice: number[]): { count: number; contributing: boolean[] } {
//   const counts = Array(7).fill(0);
//   const contributing = Array(dice.length).fill(false);
//   dice.forEach(d => counts[d]++);

//   if (counts.slice(1).every(c => c === 1)) {
//     return { count: 6, contributing: Array(6).fill(true) };
//   }
//   if (counts.filter(c => c === 2).length === 3) {
//     return { count: 6, contributing: Array(6).fill(true) };
//   }
//   if (counts.filter(c => c === 3).length === 2) {
//     return { count: 6, contributing: Array(6).fill(true) };
//   }
//   if (counts.includes(4) && counts.includes(2)) {
//     return { count: 6, contributing: Array(6).fill(true) };
//   }
//   if (counts.includes(6)) {
//     return { count: 6, contributing: Array(6).fill(true) };
//   }

//   const used = Array(dice.length).fill(false);

//   for (let num = 1; num <= 6; num++) {
//     if (counts[num] >= 3) {
//       let usedCount = 0;
//       for (let i = 0; i < dice.length && usedCount < 3; i++) {
//         if (dice[i] === num && !used[i]) {
//           contributing[i] = true;
//           used[i] = true;
//           usedCount++;
//         }
//       }
//       counts[num] -= 3;
//     }
//   }

//   [1, 5].forEach(num => {
//     let remaining = counts[num];
//     for (let i = 0; i < dice.length && remaining > 0; i++) {
//       if (dice[i] === num && !used[i]) {
//         contributing[i] = true;
//         used[i] = true;
//         remaining--;
//       }
//     }
//   });

//   const count = contributing.filter(Boolean).length;
//   return { count, contributing };
// }

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

  const WINNING_SCORE = 10000;

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
    const subsets = getSubsets(unlockedIndices);

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

    setPlayerScores(prev => {
      const newScores = { ...prev };
      newScores[`player${currentPlayer}` as keyof typeof playerScores] += turnScore;

      if (newScores[`player${currentPlayer}` as keyof typeof playerScores] >= WINNING_SCORE) {
        setGameOver(true);
        setWinner(currentPlayer);
      }

      return newScores;
    });

    resetTurn();
  };

  const canLock = (): boolean => {
    if (gameOver) return false;

    // Get dice selected for locking in the current roll
    const lockedVals = dice.filter((_, i) => locked[i]);
    if (lockedVals.length === 0) return false;

    // Check if the selected dice contribute to the score for the current player's turn
    // const { contributing } = countScoringDice(dice);
    // const lockedAreScoring = dice.some((_, i) => locked[i] && contributing[i]);

    // Calculate potential new score including previously locked dice for this turn
    const newLockedSet = [...lockedDiceValues, ...lockedVals];
    const newTotal = calculateScore(newLockedSet);

    // Allow locking only if the combined score is greater than the current turn score
    // and at least one selected die contributes to the score
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
  };

  const canRoll = (): boolean => {
    return !gameOver && (rolls === 0 || hasLockedThisTurn);
  };

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
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        🎲 Farkle Game
      </h1>

      {gameOver && (
        <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '1rem' }}>
          Game Over! Player {winner} Wins!
        </p>
      )}

      <p style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Current Player: Player {currentPlayer}
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
    </div>
  );
}
