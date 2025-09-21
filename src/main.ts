import { Game } from './core/Game.js';

// Main entry point for the Tower Defense game
// Initializes the game engine and starts the main loop
// This will be the starting point for game implementation

console.log('Tower Defense Game - Loading...');

async function main(): Promise<void> {
  const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Game canvas not found');
  }

  // Initialize the game
  const game = new Game(canvas);
  await game.init();

  // Handle window resize
  function handleResize(): void {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    game.resize(canvas.width, canvas.height);
  }

  window.addEventListener('resize', handleResize);
  handleResize(); // Initial resize

  // Start the game loop
  game.start();

  console.log('Game started! Press ` (backtick) to toggle dev tools');
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}