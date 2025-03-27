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
go_find_dead_code({
  wd: "/path/to/go/project",
  path: "./..."
})
```

Finds unused code in Go projects.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed | (required) |
| `path` | string | Path pattern to analyze (e.g., "./...", "./pkg/...", specific file) | "./..." |

### Go Vet

```
go_vet({
  wd: "/path/to/go/project",
  path: "./..."
})
```

Runs Go's built-in static analyzer to find potential issues.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed | (required) |
| `path` | string | Path pattern to analyze (e.g., "./...", "./pkg/...", specific file) | "./..." |

### Format Go Code

```
go_format({
  wd: "/path/to/go/project",
  path: "./...",
  write: true
})
```

Formats Go code. Set `write` to true to modify files directly.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed | (required) |
| `path` | string | Path pattern of files to format (e.g., "./...", "./pkg/...", specific file) | "./..." |
| `write` | boolean | Whether to write changes directly to the source files (true) or just output the diff (false) | false |

### Lint Go Code

```
go_lint({
  wd: "/path/to/go/project",
  path: "./..."
})
```

Runs the Go linter to check for style and potential issues.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed | (required) |
| `path` | string | Path pattern to lint (e.g., "./...", "./pkg/...", specific file) | "./..." |

### Run Go Tests

```
go_test({
  wd: "/path/to/go/project",
  path: "./..."
})
```

Runs Go tests with verbose output.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed | (required) |
| `path` | string | Path pattern for tests to run (e.g., "./...", "./pkg/...", specific package) | "./..." |

### Tidy Go Module Dependencies

```
go_mod_tidy({
  wd: "/path/to/go/project"
})
```

Cleans up Go module dependencies.

| Parameter | Type | Description | Default |
|-----------|------|-------------|---------|
| `wd` | string | Working directory where the command will be executed (should contain go.mod file) | (required) |

## Using with Cursor or Claude Desktop

To integrate this MCP server with Cursor or Claude Desktop, add the following configuration to your `mcp.json` file:

```json
{
  "servers": [
    {
      "name": "mcp-golang",
      "command": "node /path/to/mcp-golang/build/index.js",
      "tools": [
        {
          "name": "mcp_go_go_find_dead_code",
          "backend_name": "go_find_dead_code",
          "backend_server": "mcp-golang",
          "description": "Find unused code in Go projects"
        },
        {
          "name": "mcp_go_go_vet",
          "backend_name": "go_vet",
          "backend_server": "mcp-golang",
          "description": "Run Go's static analyzer to find potential issues"
        },
        {
          "name": "mcp_go_go_format",
          "backend_name": "go_format",
          "backend_server": "mcp-golang",
          "description": "Format Go code with the option to write changes directly to files"
        },
        {
          "name": "mcp_go_go_lint",
          "backend_name": "go_lint",
          "backend_server": "mcp-golang",
          "description": "Run the Go linter to check for style and potential issues"
        },
        {
          "name": "mcp_go_go_test",
          "backend_name": "go_test",
          "backend_server": "mcp-golang",
          "description": "Run Go tests with verbose output"
        },
        {
          "name": "mcp_go_go_mod_tidy",
          "backend_name": "go_mod_tidy",
          "backend_server": "mcp-golang",
          "description": "Clean up Go module dependencies"
        }
      ]
    }
  ]
}
```

Make sure to replace `/path/to/mcp-golang` with the actual path to your installation.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT
