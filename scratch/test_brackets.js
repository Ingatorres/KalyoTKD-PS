
const generatePositionSequence = (n) => {
    if (n === 2) return [1, 2];
    const prev = generatePositionSequence(n / 2);
    const result = [];
    for (const x of prev) {
        result.push(x);
        result.push(n + 1 - x);
    }
    return result;
};

const bracketSize = 8;
const matchOrder = generatePositionSequence(bracketSize);
console.log("Match Order for 8:", matchOrder);

const testRound = (numMatches) => {
    const seedsPerMatch = bracketSize / numMatches;
    for (let i = 0; i < numMatches; i++) {
        const start = i * seedsPerMatch;
        const seeds = matchOrder.slice(start, start + seedsPerMatch);
        console.log(`Round with ${numMatches} matches, Match ${i} covers seeds:`, seeds);
    }
}

testRound(4);
testRound(2);
testRound(1);
