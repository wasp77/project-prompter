# Project-Prompter

A command-line tool that generates a prompt for an LLM from your code project. It formats the project structure and code to be used as an input for an LLM.

## Features

- Automatically respects `.gitignore` files (can be disabled)
- Specify files or directories to include or exclude
- Clear formatting of project structure and file contents
- Outputs in a format ideal for LLM code understanding
- Size management to stay within token limits

## Installation

### Local Usage

```bash
# Then install dependencies
npm install

# Make the script executable
chmod +x index.js

# Run directly
./index.js
```

### Local Global Installation

```bash
# After setting up locally as above:
npm install -g .
# Now you can run from anywhere
project-prompter
```

### Using in Your Projects

```bash
# Add as a local dev dependency (from your project root)
npm install --save-dev ../path/to/project-prompter

# Then use via npx or package.json scripts
npx project-prompter
```

## Usage

```bash
# Basic usage (uses current directory, respects .gitignore)
project-prompter

# Output to a file
project-prompter --output prompt.txt

# Include only specific files or directories
project-prompter --include "src/**/*.js"

# Multiple include patterns
project-prompter --include "src/**/*.js" --include "lib/**/*.js"

# Exclude specific files or patterns
project-prompter --exclude "**/*.test.js" --exclude "node_modules/**"

# Ignore .gitignore rules
project-prompter --no-gitignore

# Limit output size
project-prompter --max-size "2mb"
```

## Options

- `-h, --help`: Show help information
- `-i, --include`: Files or directories to include (glob pattern, can be used multiple times)
- `-e, --exclude`: Files or directories to exclude (glob pattern, can be used multiple times)
- `-o, --output`: Output file (defaults to stdout)
- `-n, --no-gitignore`: Ignore the .gitignore file
- `-m, --max-size`: Maximum size of the output (e.g., "1mb", "500kb", defaults to "1mb")
