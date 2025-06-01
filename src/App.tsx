import { useState } from 'react';
import './index.css';

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


function calculateScoreAndCheckAllDiceScore(dice: number[]) {
  // Count frequencies of each die value
  const counts: Record<number, number> = {};
  for (const die of dice) {
    counts[die] = (counts[die] || 0) + 1;
  }

  let totalScore = 0;
  let scoringDiceCount = 0;

  // Check triplets or more
  for (const [dieStr, count] of Object.entries(counts)) {
    const die = Number(dieStr);

    if (count >= 3) {
      // Score for triples and beyond:
      // Typically: triple 1s = 1000, triple others = die*100
      if (die === 1) {
        totalScore += 300 * Math.pow(2, count - 3); // doubles for more than triple (optional rule)
      } else {
        totalScore += die * 100 * Math.pow(2, count - 3);
      }
      scoringDiceCount += count; // all these dice count as scoring
    }
  }

  // After scoring sets, count leftover singles that score
  for (const [dieStr, count] of Object.entries(counts)) {
    const die = Number(dieStr);
    const leftover = count % 3;

    // Singles scoring for 1 and 5
    if (die === 1) {
      totalScore += 100 * leftover;
      scoringDiceCount += leftover;
    } else if (die === 5) {
      totalScore += 50 * leftover;
      scoringDiceCount += leftover;
    }
    // leftover 2,3,4,6 do not score
  }

  // Now check if scoringDiceCount === total dice length → all dice contribute to scoring
  const allDiceScoring = (scoringDiceCount === dice.length);

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

// Count how many dice in this array contribute to any scoring:
// triples (or more) count all dice in that set, plus single 1s and 5s.
// }

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

// export default function App() {
//   const [dice, setDice] = useState<number[]>(Array(6).fill(1));
//   const [lockedDiceValues, setLockedDiceValues] = useState<number[]>([]);

//   const [locked, setLocked] = useState<boolean[]>(Array(6).fill(false));
//   const [rolls, setRolls] = useState(0);
//   const [turnScore, setTurnScore] = useState(0);
//   const [totalScore, setTotalScore] = useState(0);
//   const [hasLockedThisTurn, setHasLockedThisTurn] = useState(false);

  

//   const toggleLock = (idx: number) => {
//     const newLocked = [...locked];
//     newLocked[idx] = !newLocked[idx];
//     setLocked(newLocked);
//   };

//   const resetTurn = () => {
//     setDice(Array(6).fill(1));
//     setLocked(Array(6).fill(false));
//     setLockedDiceValues([]);
//     setRolls(0);
//     setTurnScore(0);
//     setHasLockedThisTurn(false);
//   };

//   const endTurn = () => {
//     setTotalScore(prev => prev + turnScore);
//     resetTurn();
//     setLockedDiceValues([]);

//   };

//   // const canLock = (): boolean => {
//   //   const selectedScore = calculateScore(dice.filter((_, i) => locked[i]));
//   //   const currentScore = turnScore;
//   //   return selectedScore > currentScore;
//   // };

//   const canLock = (): boolean => {
//   const lockedVals = dice.filter((_, i) => locked[i]);

//   // Total score from all locked dice (not just newly selected ones)
//   const selectedScore = calculateScore(lockedVals);

//   // Determine which dice contribute to the score
//   const { contributing } = countScoringDice(dice);

//   // Check if at least one locked die is a contributing scorer
//   const lockedAreScoring = dice.some((_, i) => locked[i] && contributing[i]);

//   return selectedScore > 0 && lockedAreScoring;
// };


//   const confirmLock = () => {
//     if (!canLock()) {
//   alert("⚠️ You cannot lock these dice. None of them contribute to a score (Farkle).");
//   return;
// }


//     const { allDiceScoring } = calculateScoreAndCheckAllDiceScore(dice);
//     const lockedVals = dice.filter((_, i) => locked[i]);
//     const newScore = calculateScore(lockedVals);
//     const isHotDiceRoll = allDiceScoring;

//     // Hot Dice
//     if (isHotDiceRoll) {
//       alert(`🔥 Hot dice! You locked all 6 dice for a score of ${newScore}.\nRolling 6 fresh dice...`);
//       const freshDice = Array.from({ length: 6 }, () => Math.ceil(Math.random() * 6));
//       setDice(freshDice);
//       setLocked(Array(6).fill(false));
//       setLockedDiceValues([]);
//       setHasLockedThisTurn(false);
//       setTurnScore(calculateScore(freshDice));
//       setRolls(0);
//       return;
//     }

//     // Normal case: update state
//     const newDice: number[] = [];
//     const newLocked: boolean[] = [];

//     dice.forEach((value, i) => {
//       if (!locked[i]) {
//         newDice.push(value);
//         newLocked.push(false);
//       }
//     });

//     setLockedDiceValues(prev => [...prev, ...lockedVals]);
//     setDice(newDice);
//     setLocked(newLocked);
//     setTurnScore(newScore);
//     setHasLockedThisTurn(true);
//   };







//   const canRoll = (): boolean => {
//     return rolls === 0 || hasLockedThisTurn;
//   };
// ... existing imports and functions ...

export default function App() {
  const [dice, setDice] = useState<number[]>(Array(6).fill(1));
  const [lockedDiceValues, setLockedDiceValues] = useState<number[]>([]);
  const [locked, setLocked] = useState<boolean[]>(Array(6).fill(false));
  const [rolls, setRolls] = useState(0);
  const [turnScore, setTurnScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [hasLockedThisTurn, setHasLockedThisTurn] = useState(false);

  // const rollDice = () => {
  //   // Roll only unlocked dice
  //   const newDice = dice.map((val, idx) =>
  //     locked[idx] ? val : Math.ceil(Math.random() * 6)
  //   );

  //   setDice(newDice);
  //   setRolls(prev => prev + 1);

  //   // Farkle check - consider both locked and unlocked dice
  //   const lockedDiceVals = newDice.filter((_, i) => locked[i]);
  //   const unlockedIndices = newDice.map((_, i) => i).filter(i => !locked[i]);
  //   const subsets = getSubsets(unlockedIndices);

  //   const farkle = !subsets.some(subset => {
  //     const testDice = [...lockedDiceVals, ...subset.map(i => newDice[i])];
  //     return calculateScore(testDice) > calculateScore(lockedDiceVals);
  //   });

  //   if (farkle) {
  //     const farkleDice = newDice
  //       .map((val, idx) => (locked[idx] ? `[${val}]` : `${val}`))
  //       .join(', ');
  //     alert(`❌ Farkle! Dice: ${farkleDice}\n(No scoring combination found.)`);
  //     resetTurn();
  //     return;
  //   }
  // };

  const rollDice = () => {
  const newDice = dice.map((val, idx) =>
    locked[idx] ? val : Math.ceil(Math.random() * 6)
  );

  setDice(newDice);
  setRolls(prev => prev + 1);

  // Create a combined array of all dice in play (locked values + current dice)
  const allDiceInPlay = [...lockedDiceValues, ...newDice];
  const allDiceLockedStatus = [
    ...lockedDiceValues.map(() => true), 
    ...locked
  ];

  // Farkle check - consider all dice in play
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
    // Create a display string showing all dice with locked status
    const diceDisplay = allDiceInPlay.map((val, idx) => 
      allDiceLockedStatus[idx] ? `[${val}]` : `${val}`
    ).join(', ');

    alert(`❌ Farkle! Dice: ${diceDisplay}\n(No scoring combination found.)`);
    resetTurn();
    return;
  }
};
  const toggleLock = (idx: number) => {
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
  };

  const endTurn = () => {
    setTotalScore(prev => prev + turnScore);
    resetTurn();
  };

  // const canLock = (): boolean => {
  //   const lockedVals = dice.filter((_, i) => locked[i]);
  //   const { contributing } = countScoringDice(dice);
  //   const lockedAreScoring = dice.some((_, i) => locked[i] && contributing[i]);
  //   return lockedVals.length > 0 && lockedAreScoring;
  // };

  const canLock = (): boolean => {
    const selectedScore = calculateScore(dice.filter((_, i) => locked[i]));
    const currentScore = turnScore;
    return selectedScore > 0 || (dice.some((_, i) => locked[i] && countScoringDice(dice).contributing[i])>currentScore && (selectedScore > 0));
  };
  const confirmLock = () => {
    if (!canLock()) {
      alert("⚠️ You cannot lock these dice. None of them contribute to a score (Farkle).");
      return;
    }

    const lockedVals = dice.filter((_, i) => locked[i]);
    const newScore = calculateScore(lockedVals);
    const { allDiceScoring } = calculateScoreAndCheckAllDiceScore(dice);
    const isHotDiceRoll = allDiceScoring;

    // Hot Dice
    if (isHotDiceRoll) {
      // Add hot dice score to current turn score
      const totalTurnScore = turnScore + newScore;
      alert(`🔥 Hot dice! You locked all 6 dice for a score of ${newScore}.\nRolling 6 fresh dice...`);

      // Force all dice to show 1 in the next roll
      const freshDice = Array(6).fill(1);

      setDice(freshDice);
      setLocked(Array(6).fill(false));
      setLockedDiceValues([]);
      setHasLockedThisTurn(false);
      setTurnScore(totalTurnScore);
      setRolls(0);
      return;
    }

    // Normal lock case
    const newDice: number[] = [];
    const newLocked: boolean[] = [];

    dice.forEach((value, i) => {
      if (!locked[i]) {
        newDice.push(value);
        newLocked.push(false);
      }
    });

    // Update locked dice values and calculate new total turn score
    const updatedLockedDice = [...lockedDiceValues, ...lockedVals];
    const updatedScore = calculateScore(updatedLockedDice);

    setLockedDiceValues(updatedLockedDice);
    setDice(newDice);
    setLocked(newLocked);
    setTurnScore(updatedScore);
    setHasLockedThisTurn(true);
  };

  const canRoll = (): boolean => {
    return rolls === 0 || hasLockedThisTurn;
  };

  // ... rest of the component remains the same ...


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
        {lockedDiceValues.map((value, idx) => (
          <Dice key={`locked-${idx}`} value={value} locked={true} />
        ))}

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
