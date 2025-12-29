type Game = {
  slug: string;
  title: string;
  genre: string;
  score: number; // 0-100
  description: string;
};

const games: Game[] = [
  { slug: "starfall-odyssey", title: "Starfall Odyssey", genre: "Action RPG", score: 91, description: "Explore a vast galaxy, forge alliances, and battle ancient threats." },
  { slug: "neon-racers", title: "Neon Racers", genre: "Racing", score: 84, description: "Arcade racing with synthwave vibes and tight controls." },
  { slug: "mystic-valley", title: "Mystic Valley", genre: "Adventure", score: 88, description: "Unravel mysteries in a hand-painted world full of secrets." },
  { slug: "blocksmith", title: "Blocksmith", genre: "Sandbox", score: 79, description: "Create, craft, and survive in an ever-changing voxel world." },
  { slug: "shadow-strike", title: "Shadow Strike", genre: "Stealth", score: 86, description: "Master stealth mechanics in intricate, open-ended levels." },
  { slug: "iron-front", title: "Iron Front", genre: "Strategy", score: 82, description: "Command your armies and outsmart your opponents in tactical battles." },
  { slug: "pixel-paradise", title: "Pixel Paradise", genre: "Casual", score: 75, description: "Relax with cozy mini-games and charming pixel art." },
  { slug: "chrono-shift", title: "Chrono Shift", genre: "Puzzle", score: 89, description: "Manipulate time to solve mind-bending puzzles." },
  { slug: "phantom-arena", title: "Phantom Arena", genre: "Fighting", score: 77, description: "Fast-paced duels with an eclectic roster of fighters." },
  { slug: "ember-quest", title: "Ember Quest", genre: "Metroidvania", score: 90, description: "Discover interconnected biomes and unlock powerful abilities." },
  { slug: "skyline-tycoon", title: "Skyline Tycoon", genre: "Simulation", score: 83, description: "Build towering cities and balance budgets to thrive." },
  { slug: "mythborn-online", title: "Mythborn Online", genre: "MMO", score: 80, description: "Join guilds, raid dungeons, and become a legend." }
];

export default games;
