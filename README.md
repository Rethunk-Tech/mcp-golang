# MCP Golang

A Model Context Protocol (MCP) server that provides Go language tools for LLMs to analyze, test, and format Go code.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for applications to provide context to Large Language Models (LLMs). Learn more at the [Model Context Protocol Website](https://modelcontextprotocol.github.io/).

## Features

- TypeScript implementation with strict type checking
- Full set of Go code analysis tools:
  - `go_find_dead_code`: Find unused code in Go projects
  - `go_vet`: Run Go's static analyzer
  - `go_format`: Format Go code
  - `go_lint`: Run Go linting
  - `go_test`: Run Go tests
  - `go_mod_tidy`: Clean up Go module dependencies
- Comprehensive error handling and validation
- Passes tool output directly to the LLM

## Prerequisites

- Node.js 18 or later
- npm or yarn
- Go 1.18 or later
- The following Go tools installed:
  - `golint`: `go install golang.org/x/lint/golint@latest`
  - `deadcode`: `go install github.com/remyoudompheng/go-misc/deadcode@latest`

## Project Structure

```shell
mcp-golang/
├── build/                # Compiled JavaScript files
├── cmd/                  # Example Go code for testing
│   └── example/          # Simple Go application
├── src/
│   ├── __tests__/        # Integration tests and test utilities
│   ├── errors/           # Custom error classes
│   ├── tools/            # MCP tool implementations
│   │   ├── goTools.ts    # Go tools for LLM
│   │   └── noteTools.ts  # Example note tools
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # Main server entry point
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Project documentation
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Rethunk-Tech/mcp-golang.git
   cd mcp-golang
   ```

2. Install dependencies:

   ```bash
   yarn install
   ```

3. Build and run the server:

   ```bash
   yarn build
   yarn start
   ```

## Development

- Start TypeScript compiler in watch mode: `yarn dev`
- Lint your code: `yarn lint`
- Fix linting issues: `yarn lint:fix`
- Run tests: `yarn test`

## Testing with MCP Inspector

For standalone testing, use the MCP Inspector tool:

```bash
yarn inspector
```

This will open an interactive session where you can test your MCP tools.

## Available Go Tools

### Find Dead Code

```
go_find_dead_code({ path: "./..." })
```

Finds unused code in Go projects.

### Go Vet

```
go_vet({ path: "./..." })
```

Runs Go's built-in static analyzer to find potential issues.

### Format Go Code

```
go_format({ path: "./...", write: true })
```

Formats Go code. Set `write` to true to modify files directly.

### Lint Go Code

```
go_lint({ path: "./..." })
```

Runs the Go linter to check for style and potential issues.

### Run Go Tests

```
go_test({ path: "./..." })
```

Runs Go tests with verbose output.

### Tidy Go Module Dependencies

```
go_mod_tidy({ path: "./..." })
```

Cleans up Go module dependencies.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT
