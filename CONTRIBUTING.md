# Contributing to MCP Template Node

Thank you for your interest in contributing to the MCP Template Node project! This document provides guidelines and instructions for contributing.

## Development Setup

1. **Prerequisites**
   - Node.js 18 or later
   - npm or yarn (we use yarn as the default)
   - Git

2. **Clone and Install**

   ```bash
   git clone https://github.com/yourusername/mcp-template-node.git
   cd mcp-template-node
   yarn install
   ```

3. **Development Scripts**
   - `yarn build` - Build the project
   - `yarn dev` - Watch mode for development
   - `yarn lint` - Run ESLint
   - `yarn lint:fix` - Fix ESLint issues
   - `yarn test` - Run tests
   - `yarn test:watch` - Run tests in watch mode
   - `yarn inspector` - Run MCP Inspector for testing
   - `yarn clean` - Clean build artifacts
   - `yarn start` - Run the built server

## Project Structure

```
src/
├── errors/        # Custom error classes
├── tools/         # MCP tool implementations
│   └── __tests__/ # Tool tests
├── types/         # TypeScript type definitions
└── index.ts       # Main server entry point with MCP examples
```

## Coding Guidelines

1. **TypeScript**
   - Use strict mode
   - Add explicit function return types
   - Use interfaces for object types
   - Document public APIs with JSDoc comments

2. **Code Style**
   - Use single quotes for strings
   - No semicolons (except where required)
   - 2-space indentation
   - Follow ESLint rules defined in `eslint.config.mjs`
   - We use ESLint but not Prettier

3. **Error Handling**
   - Use custom error classes for domain-specific errors
   - Include error codes for better error identification
   - Handle all possible error cases
   - Provide clear error messages

4. **MCP Components Implementation**

   **Tools:**
   - Keep tools focused and single-purpose
   - Use Zod for input validation and type safety
   - Follow the MCP response format
   - Include comprehensive error handling
   - Return appropriate content types
   - Example:

     ```typescript
     server.tool(
       'tool_name',
       {
         parameter1: z.string().min(1),
         parameter2: z.number().min(0)
       },
       async ({ parameter1, parameter2 }) => {
         // Implementation
         return {
           content: [{ type: 'text', text: 'Result' }]
         }
       }
     )
     ```

   **Resources:**
   - Treat resources as read-only data providers
   - Use ResourceTemplate for parameterized resources
   - Return consistent formats
   - Example:

     ```typescript
     server.resource(
       'resource_name',
       new ResourceTemplate('protocol://{param}', { list: undefined }),
       async (uri, { param }) => ({
         contents: [{
           uri: uri.href,
           text: `Data for ${param}`
         }]
       })
     )
     ```

   **Prompts:**
   - Keep prompts simple and focused
   - Use message role 'user' for most cases
   - Example:

     ```typescript
     server.prompt(
       'prompt_name',
       { parameter: z.string() },
       ({ parameter }) => ({
         messages: [{
           role: 'user',
           content: {
             type: 'text',
             text: `Process this: ${parameter}`
           }
         }]
       })
     )
     ```

5. **Testing**
   - Write unit tests for all tools
   - Mock the MCP server for testing
   - Test both success and error cases
   - Test input validation
   - Use Vitest for testing

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run linting and tests (`yarn lint && yarn test`)
5. Commit using conventional commits format
6. Push to your fork
7. Create a Pull Request

## Conventional Commits

We use the Conventional Commits specification for commit messages:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Formatting
- `refactor`: Code restructuring
- `test`: Adding tests
- `chore`: Maintenance

Example:

```
feat(tools): add new note search tool

Implements fuzzy search for notes using title and content.
```

## MCP Best Practices

1. **Tool Design**
   - Tools should perform one action or a closely related set of actions
   - Validate inputs before processing
   - Return clear success or error responses
   - Provide descriptive names that indicate the action

2. **Resource Design**
   - Keep resources focused on providing data
   - Avoid complex computations in resources
   - Use appropriate URI patterns
   - Establish consistent content formats

3. **Error Handling**
   - Use custom error classes
   - Return user-friendly error messages
   - Include error codes for programmatic handling
   - Catch and handle expected exceptions

4. **Security Considerations**
   - Validate all inputs
   - Avoid using `eval()` in production code
   - Implement rate limiting for tools in production
   - Consider authentication for production deployments

## Questions or Problems?

Feel free to open an issue for:

- Bug reports
- Feature requests
- Questions about the codebase
- Suggestions for improvements

## License

By contributing to MCP Template Node, you agree that your contributions will be licensed under the project's MIT License.
