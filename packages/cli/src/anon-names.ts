// Generate memorable random names for anon skills
// Format: adjective + noun (e.g., fuzzycat, soundcountry, bluebird)

const ADJECTIVES = [
  'happy', 'quick', 'bright', 'warm', 'cool', 'soft', 'wild', 'calm',
  'bold', 'fine', 'fresh', 'gold', 'light', 'neat', 'rare', 'safe',
  'sweet', 'tidy', 'vivid', 'zany', 'blue', 'green', 'red', 'big',
  'fuzzy', 'crisp', 'dusty', 'eager', 'fair', 'gentle', 'hazy', 'icy',
  'jolly', 'keen', 'lively', 'merry', 'noble', 'proud', 'quiet', 'rude',
];

const NOUNS = [
  'cat', 'dog', 'bird', 'fish', 'bear', 'fox', 'wolf', 'deer',
  'lion', 'tiger', 'horse', 'mouse', 'rabbit', 'duck', 'goose', 'swan',
  'otter', 'panda', 'koala', 'sloth', 'whale', 'dolphin', 'shark', 'seal',
  'eagle', 'hawk', 'owl', 'crow', 'raven', 'dove', 'jay', ' Wren',
  'frog', 'toad', 'lizard', 'snake', 'turtle', 'crab', 'shrimp', 'clam',
  'berry', 'apple', 'pear', 'plum', 'grape', 'melon', 'lemon', 'mango',
  'cloud', 'rain', 'snow', 'wind', 'star', 'moon', 'sun', 'sky',
  'river', 'lake', 'sea', 'ocean', 'forest', 'field', 'garden', 'park',
  'mountain', 'valley', 'canyon', 'beach', 'island', 'desert', 'jungle',
  'country', 'planet', 'comet', 'asteroid', 'galaxy', 'nebula',
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateAnonName(): string {
  const adj = randomElement(ADJECTIVES);
  const noun = randomElement(NOUNS);
  return `${adj}${noun}`;
}

export function generateClaimToken(): string {
  // Generate a short, memorable token
  const words = [
    'apple', 'brave', 'cloud', 'dream', 'eagle', 'flame', 'grace', 'heart',
    'iris', 'joy', 'king', 'luna', 'magic', 'nova', 'ocean', 'peace', 'quest',
    'rose', 'star', 'tree', 'unity', 'vision', 'wish', 'xenon', 'youth', 'zen',
  ];
  const part1 = randomElement(words);
  const part2 = randomElement(words);
  const num = Math.floor(Math.random() * 1000);
  return `${part1}-${part2}-${num}`;
}

export function parseAnonNamespace(fullName: string): { isAnon: boolean; token: string } | null {
  // Check if it's an anon namespace: anon-tokenname
  const match = fullName.match(/^anon-([a-z]+)-([a-z]+)-(\d+)$/);
  if (match) {
    return {
      isAnon: true,
      token: `${match[1]}-${match[2]}-${match[3]}`,
    };
  }
  return null;
}