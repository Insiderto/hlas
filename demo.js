/**
 * Simplified demo launcher for hlas library PoC
 */

const { execSync } = require("child_process");

// Use a simpler approach to run the demo directly
console.log("Starting hlas library demo application...");
console.log("\nTry these commands in the LLM simulator:");
console.log('1. "What todos do I have?"');
console.log('2. "Add a todo: Buy groceries"');
console.log("3. \"Mark 'Learn about hlas' as completed\"");
console.log('4. "Clear all completed todos"\n');

// Start the demo using Vite directly on the demo directory
try {
  execSync("npx vite demo --open", {
    stdio: "inherit",
    env: { ...process.env, FORCE_COLOR: "true" },
  });
} catch (error) {
  console.error("Failed to start the demo application.");
  process.exit(1);
}
