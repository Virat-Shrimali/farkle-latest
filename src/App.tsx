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

function calculateScore(dice: number[]): number {
  if (dice.length === 0) return 0;

  let counts = Array(7).fill(0);
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

const Dice = ({ value, locked, onClick }: { value: number; locked: boolean; onClick: () => void }) => (
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
      cursor: 'pointer'
    }}
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

  const rollDice = () => {
    const newDice = dice.map((val, idx) => locked[idx] ? val : Math.ceil(Math.random() * 6));
    setDice(newDice);
    setRolls(prev => prev + 1);

    const lockedDice = newDice.filter((_, i) => locked[i]);
    const unlockedIndices = newDice.map((_, i) => i).filter(i => !locked[i]);

    const subsets = getSubsets(unlockedIndices);

    const farkle = !subsets.some(subset => {
      const testDice = [...lockedDice, ...subset.map(i => newDice[i])];
      return calculateScore(testDice) > calculateScore(lockedDice);
    });

    if (farkle) {
      alert('Farkle! No score this turn.');
      resetTurn();
      return;
    }

    setTurnScore(calculateScore(lockedDice));
  };

  const toggleLock = (idx: number) => {
    const newLocked = [...locked];
    newLocked[idx] = !newLocked[idx];
    setLocked(newLocked);

    const scoringDice = dice.filter((_, i) => newLocked[i]);
    setTurnScore(calculateScore(scoringDice));
  };

  const resetTurn = () => {
    setDice(Array(6).fill(1));
    setLocked(Array(6).fill(false));
    setRolls(0);
    setTurnScore(0);
  };

  const endTurn = () => {
    setTotalScore(prev => prev + turnScore);
    resetTurn();
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #f1f5f9, #dbeafe)',
      textAlign: 'center',
      padding: '1.5rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>🎲 Farkle Game</h1>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        flexWrap: 'wrap',
        marginBottom: '1rem'
      }}>
        {dice.map((value, idx) => (
          <span key={idx}>
            <Dice value={value} locked={locked[idx]} onClick={() => toggleLock(idx)} />
          </span>
        ))}
      </div>
      <p style={{ fontSize: '1.125rem' }}>Rolls this turn: {rolls} / {MAX_ROLLS}</p>
      <p style={{ fontSize: '1.125rem', fontWeight: '600' }}>Turn Score: {turnScore}</p>
      <p style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#15803d' }}>Total Score: {totalScore}</p>
      <div style={{ marginTop: '1.5rem' }}>
        <button
          onClick={rollDice}
          disabled={rolls >= MAX_ROLLS}
          style={{
            padding: '0.5rem 1rem',
            marginRight: '0.5rem',
            backgroundColor: rolls >= MAX_ROLLS ? '#94a3b8' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '0.375rem',
            cursor: rolls >= MAX_ROLLS ? 'not-allowed' : 'pointer'
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
            cursor: 'pointer'
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
            cursor: 'pointer'
          }}
        >
          Reset Turn
        </button>
      </div>
    </div>
  );
}
