import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerNoteTools } from './tools/noteTools.js'

// Constants for server metadata
const SERVER_NAME = 'mcp-template-node'
const SERVER_VERSION = '1.0.0'

/**
 * Main entry point for the MCP server
 *
 * The Model Context Protocol (MCP) allows LLMs to interact with your server through:
 * - Resources: Data sources that work like read-only GET endpoints
 * - Tools: Functions that can perform actions and have side effects
 * - Prompts: Templates to guide LLM interactions
 *
 * This example server demonstrates:
 * 1. Server initialization and configuration
 * 2. Resource registration (static and parameterized)
 * 3. Tool registration for note management
 * 4. Prompt registration for user guidance
 * 5. Transport connection using stdio
 */
export async function main(): Promise<void> {
  try {
    console.error(`Starting ${SERVER_NAME} v${SERVER_VERSION}...`)

    // Initialize the MCP server
    const server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION
    })

    // Register all note tools
    registerNoteTools(server)

    // Static resource example: Server configuration
    server.resource(
      'config',
      'config://app',
      async (uri) => ({
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

    // Parameterized resource example: Note information
    server.resource(
      'note-info',
      new ResourceTemplate('notes://{noteId}/info', { list: undefined }),
      async (uri, params) => ({
        contents: [{
          uri: uri.href,
          text: `Information about note ${params.noteId}`
        }]
      })
    )

    // Register a simple help prompt
    server.prompt(
      'help',
      {},
      () => ({
        messages: [{
          role: 'user',
          content: {
            type: 'text',
            text: `This is the ${SERVER_NAME} server. You can use tools like create_note, list_notes, get_note, update_note, and delete_note to manage notes.`
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
