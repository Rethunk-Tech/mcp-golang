# MCP Template Node

A template repository for creating Model Context Protocol (MCP) servers in Node.js/TypeScript. This template demonstrates a simple notes management system using the MCP protocol.

## What is MCP?

The Model Context Protocol (MCP) is a standardized way for applications to provide context to Large Language Models (LLMs). Learn more at the [Model Context Protocol Website](https://modelcontextprotocol.github.io/).

## Features

- TypeScript implementation with strict type checking
- Simple notes management system with basic CRUD operations
- Complete examples of MCP concepts (Tools, Resources, Prompts)
- In-memory storage for notes
- Comprehensive error handling and validation
- Unit tests with Vitest
- VS Code debugging configuration
- GitHub Actions CI workflow for testing and building

## Prerequisites

- Node.js 18 or later
- npm or yarn

## Project Structure

```shell
mcp-template-node/
├── build/                # Compiled JavaScript files
├── src/
│   ├── __tests__/        # Integration tests and test utilities
│   ├── errors/           # Custom error classes
│   ├── tools/            # MCP tool implementations
│   │   └── __tests__/    # Tool unit tests
│   ├── types/            # TypeScript type definitions
│   │   └── __tests__/    # Type tests
│   └── index.ts          # Main server entry point with MCP examples
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
├── eslint.config.mjs     # ESLint flat configuration
└── README.md             # Project documentation
```

## Getting Started

1. Clone the repository:

   ```bash
   git clone https://github.com/Rethunk-Tech/mcp-template-node.git
   cd mcp-template-node
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

## Testing

This project includes comprehensive tests to verify the functionality of the MCP server and its tools.

### Running Tests

Run all tests:

```bash
yarn test
```

Run tests in watch mode (rerun tests when files change):

```bash
yarn test:watch
```

Run tests with coverage:

```bash
yarn test:coverage
```

### Test Structure

- **Unit Tests**: Located in `__tests__` directories near the code they test
- **Integration Tests**: Located in `src/__tests__/`
- **Test Utilities**: Common test helpers in `src/__tests__/test-utils.ts`

### Writing Tests

The project includes a MockMcpServer for testing tools without real MCP dependencies:

```typescript
import { MockMcpServer } from '../__tests__/test-utils.js';

describe('My Tool Tests', () => {
  let server: MockMcpServer;

  beforeEach(() => {
    server = new MockMcpServer();
    // Register tools
    registerMyTools(server as any);
  });

  it('should perform some action', async () => {
    const result = await server.callTool('my_tool', { param: 'value' });
    expect(result.content[0].text).toContain('Expected text');
  });
});
```

## Testing with MCP Inspector

For standalone testing, use the MCP Inspector tool:

```bash
yarn inspector
```

This will open an interactive session where you can test your MCP tools.

## Available Tools

### Create Note

Creates a new note with title and content.

### List Notes

Lists all available notes with their IDs and titles.

### Get Note

Retrieves a specific note by ID.

### Update Note

Updates an existing note's title, content, or tags.

### Delete Note

Deletes a note by ID.

## Extending the Template

To extend this template:

1. Add new types in `src/types/`
2. Implement new tools in `src/tools/`
3. Add new resources in `src/index.ts`
4. Create new prompt templates as needed
5. Add tests for your new functionality

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to this project.

## License

MIT
