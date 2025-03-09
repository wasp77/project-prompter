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
# Clone or create a directory for the tool
mkdir llm-project-prompt
cd llm-project-prompt

# Save index.js and package.json files there
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
llm-project-prompt
```

### Using in Your Projects

```bash
# Add as a local dev dependency (from your project root)
npm install --save-dev ../path/to/llm-project-prompt

# Then use via npx or package.json scripts
npx llm-project-prompt
```

## Usage

```bash
# Basic usage (uses current directory, respects .gitignore)
llm-project-prompt

# Output to a file
llm-project-prompt --output prompt.txt

# Include only specific files or directories
llm-project-prompt --include "src/**/*.js"

# Multiple include patterns
llm-project-prompt --include "src/**/*.js" --include "lib/**/*.js"

# Exclude specific files or patterns
llm-project-prompt --exclude "**/*.test.js" --exclude "node_modules/**"

# Ignore .gitignore rules
llm-project-prompt --no-gitignore

# Limit output size
llm-project-prompt --max-size "2mb"
```

## Options

- `-h, --help`: Show help information
- `-i, --include`: Files or directories to include (glob pattern, can be used multiple times)
- `-e, --exclude`: Files or directories to exclude (glob pattern, can be used multiple times)
- `-o, --output`: Output file (defaults to stdout)
- `-n, --no-gitignore`: Ignore the .gitignore file
- `-m, --max-size`: Maximum size of the output (e.g., "1mb", "500kb", defaults to "1mb")