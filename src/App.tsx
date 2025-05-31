import React, { useState } from 'react';
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


// const calculateScore = (dice: number[]): number => {
//   const counts = Array(7).fill(0);
//   dice.forEach(d => counts[d]++);
//   let score = 0;
//   if (counts[1] >= 3) score += 1000 + (counts[1] - 3) * 100;
//   else score += counts[1] * 100;
//   if (counts[5] >= 3) score += 500 + (counts[5] - 3) * 50;
//   else score += counts[5] * 50;
//   for (let i = 2; i <= 6; i++) {
//     if (i !== 5 && counts[i] >= 3) score += i * 100;
//   }
//   return score;
// };

function calculateScore(dice) {
      if (dice.length === 0) return 0;

      let counts = Array(7).fill(0);
      dice.forEach(d => counts[d]++);

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


const isFarkle = (dice: number[]): boolean => calculateScore(dice) === 0;

const Dice = ({ value, locked, onClick }: { value: number; locked: boolean; onClick: () => void }) => (
  <button onClick={onClick} className={`m-2 w-14 h-14 rounded-lg text-2xl font-bold border-2 ${locked ? 'bg-green-400' : 'bg-white'}`}
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

  // Update turn score (from locked dice only)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 text-center p-6">
      <h1 className="text-3xl font-bold mb-4">🎲 Farkle Game</h1>
      <div className="flex justify-center flex-wrap mb-4">
        {dice.map((value, idx) => (
          <span key={idx}>
            <Dice value={value} locked={locked[idx]} onClick={() => toggleLock(idx)} />
          </span>
        ))}
      </div>
      <p className="text-lg">Rolls this turn: {rolls} / {MAX_ROLLS}</p>
      <p className="text-lg font-semibold">Turn Score: {turnScore}</p>
      <p className="text-lg font-bold text-green-700">Total Score: {totalScore}</p>
      <div className="mt-6 space-x-4">
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={rollDice} disabled={rolls >= MAX_ROLLS}>Roll Dice</button>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" onClick={endTurn}>End Turn</button>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" onClick={resetTurn}>Reset Turn</button>
      </div>
    </div>
  );
}
