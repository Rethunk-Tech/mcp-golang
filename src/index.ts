import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { URL } from 'url'
import { registerGoTools } from './tools/goTools.js'

// Constants for server metadata
const SERVER_NAME = 'mcp-golang'
const SERVER_VERSION = '1.0.0'

/**
 * Main entry point for the MCP server
 *
 * The Model Context Protocol (MCP) allows LLMs to interact with your server through:
 * - Resources: Data sources that work like read-only GET endpoints
 * - Tools: Functions that can perform actions and have side effects
 * - Prompts: Templates to guide LLM interactions
 *
 * This server provides tools for Go code analysis and testing
 */
export async function main(): Promise<void> {
  try {
    console.error(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`)

    // Initialize the MCP server
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION
    })

    // Register all Go tools
    registerGoTools(server)

    // Static resource example: Server configuration
    server.resource(
      'config',
      'config://app',
      async (uri: URL) => ({
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            name: SERVER_NAME,
            version: SERVER_VERSION,
            environment: 'development'
          }, null, 2)
        }]
      })
    )

    // Register a help prompt
    server.prompt(
      'help',
      {},
      () => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `This is the ${SERVER_NAME} server. You can use Go tools like go_find_dead_code, go_vet, go_format, go_lint (using golangci-lint), go_test, and go_mod_tidy to analyze and test Go code.`
          }
        }]
      })
    )

    // Connect to transport
    const transport = new StdioServerTransport()
    await server.connect(transport)

    console.error(`${SERVER_NAME} server started successfully and ready to handle requests.`)
  } catch (error) {
    console.error('Failed to start server:', error)
    process.exit(1)
  }
}

// Only run the server directly if this file is the main module
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('index.js')) {
  main().catch(console.error)
}
