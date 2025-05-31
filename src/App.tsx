import { useState } from 'react';
import './index.css';

const MAX_ROLLS = 3;

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

// Count how many dice in this array contribute to any scoring:
// triples (or more) count all dice in that set, plus single 1s and 5s.
export function calculateScore(dice: number[]): number {
  const counts = Array(7).fill(0);
  dice.forEach(d => counts[d]++);

  let score = 0;

  // Check for straight 1-6
  if (counts.slice(1).every(c => c === 1)) return 1500;

  // Three pairs
  if (counts.filter(c => c === 2).length === 3) return 1500;

  // Two triplets
  if (counts.filter(c => c === 3).length === 2) return 2500;

  // 4 of a kind + a pair
  if (counts.includes(4) && counts.includes(2)) return 1500;

  // 6 of a kind
  if (counts.includes(6)) return 3000;

  for (let i = 1; i <= 6; i++) {
    if (counts[i] >= 3) {
      score += (i === 1 ? 1000 : i * 100) * Math.pow(2, counts[i] - 3);
      counts[i] = 0; // Already scored
    }
  }

  // Remaining 1s and 5s
  score += counts[1] * 100;
  score += counts[5] * 50;

  return score;
}

function countScoringDice(dice: number[]): { count: number; contributing: boolean[] } {
  const counts = Array(7).fill(0);
  const contributing = Array(dice.length).fill(false);
  dice.forEach(d => counts[d]++);

  if (counts.slice(1).every(c => c === 1)) {
    return { count: 6, contributing: Array(6).fill(true) };
  }
  if (counts.filter(c => c === 2).length === 3) {
    return { count: 6, contributing: Array(6).fill(true) };
  }
  if (counts.filter(c => c === 3).length === 2) {
    return { count: 6, contributing: Array(6).fill(true) };
  }
  if (counts.includes(4) && counts.includes(2)) {
    return { count: 6, contributing: Array(6).fill(true) };
  }
  if (counts.includes(6)) {
    return { count: 6, contributing: Array(6).fill(true) };
  }

  const used = Array(dice.length).fill(false);

  for (let num = 1; num <= 6; num++) {
    if (counts[num] >= 3) {
      let usedCount = 0;
      for (let i = 0; i < dice.length && usedCount < 3; i++) {
        if (dice[i] === num && !used[i]) {
          contributing[i] = true;
          used[i] = true;
          usedCount++;
        }
      }
      counts[num] -= 3;
    }
  }

  [1, 5].forEach(num => {
    let remaining = counts[num];
    for (let i = 0; i < dice.length && remaining > 0; i++) {
      if (dice[i] === num && !used[i]) {
        contributing[i] = true;
        used[i] = true;
        remaining--;
      }
    }
  });

  const count = contributing.filter(Boolean).length;
  return { count, contributing };
}

function checkHotDice(dice: number[], rollCount: number): boolean {
  const { count } = countScoringDice(dice);

  if (count === dice.length) {
    // All dice scoring → hot dice alert
    return true;
  }

  if (rollCount >= 3 && count < dice.length) {
    // Player rolled 3 times without farkle, but not all dice score → no hot dice
    return false;
  }

  return false;
}

// Example usage
const diceRoll = [6, 5, 5, 5, 5, 4];
const rollCount = 3; // Number of rolls done this turn without farkle

if (checkHotDice(diceRoll, rollCount)) {
  alert("🔥 Hot Dice!");
} else {
  console.log("No Hot Dice");
}



const Dice = ({
  value,
  locked,
  onClick,
}: {
  value: number;
  locked: boolean;
  onClick?: () => void;
}) => (
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
  const [locked, setLocked] = useState<boolean[]>(Array(6).fill(false));
  const [rolls, setRolls] = useState(0);
  const [turnScore, setTurnScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [hasLockedThisTurn, setHasLockedThisTurn] = useState(false);

  const rollDice = () => {
    // 1) If all six dice are locked AND all locked dice score, trigger Hot Dice
    if (locked.every(l => l)) {
      const lockedVals = dice.filter((_, i) => locked[i]);
      const scoringCount = countScoringDice(lockedVals);
      if (scoringCount.count === 6) {
        alert(
          `🔥 Hot dice! You had all six locked and scoring: [${lockedVals.join(
            ', '
          )}]\nRolling 6 fresh dice...`
        );
        const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
        setLocked(Array(6).fill(false));   // unlock all for new roll
        setHasLockedThisTurn(false);
        setDice(freshDice);
        setTurnScore(calculateScore(freshDice));
        return;
      }
    } 

    // 2) Roll only the unlocked dice
    const newDice = dice.map((val, idx) =>
      locked[idx] ? val : Math.ceil(Math.random() * 6)
    );

    // 3) If all six of the newly rolled dice score, trigger Hot Dice
    const totalScoringDice = countScoringDice(newDice);
    if (totalScoringDice.count === 6) {
      alert(`🔥 Hot dice! You rolled: [${newDice.join(', ')}]\nRolling 6 fresh dice...`);
      const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
      setLocked(Array(6).fill(false));   // unlock all
      setHasLockedThisTurn(false);
      setDice(freshDice);
      setTurnScore(calculateScore(freshDice));
      return;
    }

    // 4) Normal roll: consume one roll
    setDice(newDice);
    setRolls(prev => prev + 1);

    // 5) Check for Farkle
    const lockedDiceVals = newDice.filter((_, i) => locked[i]);
    const unlockedIndices = newDice.map((_, i) => i).filter(i => !locked[i]);
    const subsets = getSubsets(unlockedIndices);

    const farkle = !subsets.some(subset => {
      const testDice = [...lockedDiceVals, ...subset.map(i => newDice[i])];
      return calculateScore(testDice) > calculateScore(lockedDiceVals);
    });

    if (farkle) {
      const farkleDice = newDice
        .map((val, idx) => (locked[idx] ? `[${val}]` : `${val}`))
        .join(', ');
      alert(`❌ Farkle! Dice: ${farkleDice}\n(No scoring combination found.)`);
      resetTurn();
      return;
    }

    // 6) After three rolls without a Farkle, trigger Hot Dice automatically
    // if (rolls + 1 === MAX_ROLLS) {
    //   alert(
    //     `🔥 Hot dice! You used all ${MAX_ROLLS} rolls without a Farkle: [${newDice.join(
    //       ', '
    //     )}]\nRolling 6 fresh dice...`
    //   );
    //   const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
    //   setLocked(Array(6).fill(false));
    //   setHasLockedThisTurn(false);
    //   setDice(freshDice);
    //   setTurnScore(calculateScore(freshDice));
    //   return;
    // }

    // 7) Otherwise, update turnScore based on locked dice
    setTurnScore(calculateScore(lockedDiceVals));
  };

  const toggleLock = (idx: number) => {
    const newLocked = [...locked];
    newLocked[idx] = !newLocked[idx];
    setLocked(newLocked);
  };

  const resetTurn = () => {
    setDice(Array(6).fill(1));
    setLocked(Array(6).fill(false));
    setRolls(0);
    setTurnScore(0);
    setHasLockedThisTurn(false);
  };

  const endTurn = () => {
    setTotalScore(prev => prev + turnScore);
    resetTurn();
  };

  const canLock = (): boolean => {
    const selectedScore = calculateScore(dice.filter((_, i) => locked[i]));
    const currentScore = turnScore;
    return selectedScore > currentScore;
  };

  const confirmLock = () => {
  if (!canLock()) return;

  const lockedVals = dice.filter((_, i) => locked[i]);
  const newScore = calculateScore(lockedVals);
  const totalLocked = locked.filter(Boolean).length;
  const isHotDice = totalLocked === 6 && newScore > 0;

  const isFinalRoll = rolls === MAX_ROLLS;
  const currentRollScore = calculateScore(dice);
  const lockingValidScore = newScore > currentRollScore;

  // Case 1: Classic Hot Dice (locked all 6 scoring dice mid-turn)
  if (isHotDice) {
    alert(`🔥 Hot dice! You locked all 6 dice for a score of ${newScore}.\nRolling 6 fresh dice...`);
    const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
    setLocked(Array(6).fill(false));
    setHasLockedThisTurn(false);
    setDice(freshDice);
    setTurnScore(calculateScore(freshDice));
    setRolls(0);
    return;
  }

  // ✅ Case 2: After 3rd roll, player locked scoring dice (non-Farkle)
  if (isFinalRoll && currentRollScore > 0 && lockingValidScore) {
    alert(`🔥 You survived all 3 rolls and locked scoring dice!\nRolling 6 fresh dice...`);
    const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
    setLocked(Array(6).fill(false));
    setHasLockedThisTurn(false);
    setDice(freshDice);
    setTurnScore(calculateScore(freshDice));
    setRolls(0);
    return;
  }

  // Normal case: locking some scoring dice
  setTurnScore(newScore);
  setHasLockedThisTurn(true);
};





  const canRoll = (): boolean => {
    return rolls === 0 || hasLockedThisTurn;
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

      {/* Main Dice */}
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

      {/* Locked Dice Display */}
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
        {dice.map(
          (value, idx) => locked[idx] && <Dice key={`locked-${idx}`} value={value} locked={true} />
        )}
      </div>

      <p style={{ fontSize: '1.125rem' }}>Rolls this turn: {rolls} / {MAX_ROLLS}</p>
      <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>Turn Score: {turnScore}</p>
      <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#15803d' }}>
        Total Score: {totalScore}
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
            cursor: 'pointer',
          }}
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
            cursor: 'pointer',
          }}
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
