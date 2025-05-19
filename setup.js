/**
 * Setup script for hlas library PoC
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m'
};

console.log(`${colors.blue}Setting up hlas library PoC...${colors.reset}\n`);

// Helper to execute commands and log output
function runCommand(command) {
  console.log(`${colors.yellow}> ${command}${colors.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${colors.red}Error executing command: ${command}${colors.reset}`);
    return false;
  }
}

// Install dependencies
console.log(`\n${colors.blue}Installing dependencies...${colors.reset}`);
if (!runCommand('npm install')) {
  process.exit(1);
}

// Build the library
console.log(`\n${colors.blue}Building hlas library...${colors.reset}`);
if (!runCommand('npm run build')) {
  process.exit(1);
}

// Start the demo
console.log(`\n${colors.green}Setup complete!${colors.reset}`);
console.log(`\n${colors.blue}Starting the demo application...${colors.reset}`);
console.log(`${colors.yellow}Try these commands in the LLM simulator:${colors.reset}`);
console.log(`${colors.yellow}1. "What todos do I have?"${colors.reset}`);
console.log(`${colors.yellow}2. "Add a todo: Buy groceries"${colors.reset}`);
console.log(`${colors.yellow}3. "Mark 'Learn about hlas' as completed"${colors.reset}`);
console.log(`${colors.yellow}4. "Clear all completed todos"${colors.reset}\n`);

runCommand('npm start');
