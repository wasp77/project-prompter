#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const minimist = require("minimist");
const ignore = require("ignore");
const { globSync } = require("glob");
const minimatch = require("minimatch");

const BINARY_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".bmp",
  ".tiff",
  ".ico",
  ".svg",
  ".pdf",
  ".doc",
  ".docx",
  ".ppt",
  ".pptx",
  ".xls",
  ".xlsx",
  ".zip",
  ".tar",
  ".gz",
  ".7z",
  ".rar",
  ".mp3",
  ".mp4",
  ".avi",
  ".mov",
  ".wmv",
  ".ttf",
  ".woff",
  ".woff2",
  ".eot",
  ".exe",
  ".dll",
  ".so",
  ".dylib",
  ".pyc",
  ".class",
  ".o",
  ".obj",
  ".db",
  ".sqlite",
  ".mdb",
]);

const argv = minimist(process.argv.slice(2), {
  boolean: ["help", "no-gitignore"],
  string: ["include", "exclude", "output", "max-size"],
  alias: {
    h: "help",
    i: "include",
    e: "exclude",
    o: "output",
    n: "no-gitignore",
    m: "max-size",
  },
  default: {
    "no-gitignore": false,
    "max-size": "1mb",
  },
});

// Display help if requested
if (argv.help) {
  console.log(`
  llm-project-prompt - Generate an LLM prompt for your project's code
  
  Usage:
    llm-project-prompt [options]
  
  Options:
    -h, --help           Show this help message
    -i, --include        Files or directories to include (glob pattern, can be used multiple times)
    -e, --exclude        Files or directories to exclude (glob pattern, can be used multiple times)
    -o, --output         Output file (defaults to stdout)
    -n, --no-gitignore   Ignore the .gitignore file
    -m, --max-size       Maximum size of the output (e.g., "1mb", "500kb", defaults to "1mb")
  
  Examples:
    llm-project-prompt
    llm-project-prompt --include "src/**/*.js" --exclude "**/*.test.js"
    llm-project-prompt --output prompt.txt
    llm-project-prompt --max-size "2mb"
  `);
  process.exit(0);
}

function parseSize(sizeStr) {
  const units = {
    b: 1,
    kb: 1024,
    mb: 1024 * 1024,
    gb: 1024 * 1024 * 1024,
  };

  const match = sizeStr.toLowerCase().match(/^(\d+(?:\.\d+)?)\s*([kmg]?b)$/);
  if (!match) {
    throw new Error(
      `Invalid size format: ${sizeStr}. Use format like "1mb" or "500kb".`
    );
  }

  const [, size, unit] = match;
  return parseFloat(size) * (units[unit] || 1);
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

async function main() {
  try {
    const rootDir = process.cwd();

    const maxSizeBytes = parseSize(argv["max-size"]);

    let ignoreRules = ignore();
    if (!argv["no-gitignore"]) {
      const gitignorePath = path.join(rootDir, ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ignoreRules = ignore().add(gitignoreContent);
      }
    }

    const includePatterns = argv.include
      ? Array.isArray(argv.include)
        ? argv.include
        : [argv.include]
      : ["**/*"];
    const excludePatterns = argv.exclude
      ? Array.isArray(argv.exclude)
        ? argv.exclude
        : [argv.exclude]
      : [];

    let allFiles = [];
    for (const pattern of includePatterns) {
      const files = globSync(pattern, { cwd: rootDir, nodir: true });
      allFiles = [...allFiles, ...files];
    }

    allFiles = [...new Set(allFiles)];

    let filteredFiles = allFiles.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      if (BINARY_EXTENSIONS.has(ext)) {
        return false;
      }

      for (const pattern of excludePatterns) {
        if (minimatch(file, pattern)) {
          return false;
        }
      }

      if (!argv["no-gitignore"] && ignoreRules.ignores(file)) {
        return false;
      }

      return true;
    });

    // Collect file info including size
    const fileInfos = filteredFiles.map((file) => {
      const filePath = path.join(rootDir, file);
      const stats = fs.statSync(filePath);
      return {
        path: file,
        size: stats.size,
      };
    });

    let prompt = `# My Project code\n\n`;
    prompt += `This prompt contains code files from the project.\n\n`;

    let currentSize = prompt.length;
    const skippedFiles = [];
    const includedFiles = [];

    prompt += `## File Contents\n\n`;
    currentSize += 19; // Size of the header

    for (const fileInfo of fileInfos) {
      const filePath = path.join(rootDir, fileInfo.path);

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const extension = path.extname(fileInfo.path).substring(1); // Remove the dot

        const fileHeader = `### File: ${fileInfo.path}\n\`\`\`${extension}\n`;
        const fileFooter = `\n\`\`\`\n\n`;
        const fileEntrySize =
          fileHeader.length + content.length + fileFooter.length;

        if (currentSize + fileEntrySize > maxSizeBytes) {
          skippedFiles.push(fileInfo.path);
          continue;
        }

        prompt += fileHeader + content + fileFooter;
        currentSize += fileEntrySize;
        includedFiles.push(fileInfo.path);
      } catch (err) {
        console.error(`Error reading file ${fileInfo.path}: ${err.message}`);
        skippedFiles.push(fileInfo.path);
      }
    }

    const promptLines = prompt.split("\n");
    promptLines[2] = `This prompt contains ${includedFiles.length} files from the project.`;

    if (skippedFiles.length > 0) {
      promptLines.splice(
        3,
        0,
        `Note: ${skippedFiles.length} files were skipped due to size constraints.`
      );
    }

    const structureHeader = `## Project Structure\n\n`;
    let structureContent = "";

    const dirs = new Set();
    for (const file of includedFiles) {
      const dir = path.dirname(file);
      if (dir !== ".") {
        const parts = dir.split("/");
        let currentPath = "";
        for (const part of parts) {
          currentPath = currentPath ? `${currentPath}/${part}` : part;
          dirs.add(currentPath);
        }
      }
    }

    for (const dir of dirs) {
      const depth = dir.split("/").length - 1;
      const indent = "  ".repeat(depth);
      structureContent += `${indent}📁 ${dir}\n`;
    }

    for (const file of includedFiles) {
      const dir = path.dirname(file);
      const depth = dir === "." ? 0 : dir.split("/").length;
      const indent = "  ".repeat(depth);
      structureContent += `${indent}📄 ${file}\n`;
    }

    promptLines.splice(4, 0, structureHeader + structureContent);

    prompt = promptLines.join("\n");

    const estimatedTokens = estimateTokens(prompt);
    console.error(
      `Prompt size: ${(prompt.length / 1024).toFixed(
        2
      )} KB, Est. tokens: ${estimatedTokens}`
    );

    if (argv.output) {
      fs.writeFileSync(argv.output, prompt);
      console.error(`Prompt written to ${argv.output}`);
    } else {
      console.log(prompt);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
}

main();
