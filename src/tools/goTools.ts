import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { z } from 'zod'

// Promisify exec for async/await usage
const execAsync = promisify(exec)

/**
 * Registers Go-related tools with the MCP server
 * Implements commands for Go code analysis and testing
 */
export function registerGoTools(server: McpServer): void {
  // Tool: Find dead code in Go projects
  server.tool(
    'go_find_dead_code',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      try {
        const { stdout, stderr } = await execAsync(`go run github.com/remyoudompheng/go-misc/deadcode ${path}`)
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'No dead code found'
          }]
        }
      } catch (error) {
        // If the command fails, it might be because dead code was found
        const errorOutput = error instanceof Error && 'stdout' in error
          ? (error as unknown as { stdout: string }).stdout
          : String(error)

        return {
          content: [{
            type: 'text',
            text: errorOutput || `Error running deadcode: ${error instanceof Error ? error.message : String(error)}`
          }]
        }
      }
    }
  )

  // Tool: Run go vet for static analysis
  server.tool(
    'go_vet',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      try {
        const { stdout, stderr } = await execAsync(`go vet ${path}`)
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'No issues found by go vet'
          }]
        }
      } catch (error) {
        // If the command fails, it might be because issues were found
        const errorOutput = error instanceof Error && 'stderr' in error
          ? (error as unknown as { stderr: string }).stderr
          : String(error)

        return {
          content: [{
            type: 'text',
            text: errorOutput || `Error running go vet: ${error instanceof Error ? error.message : String(error)}`
          }]
        }
      }
    }
  )

  // Tool: Format Go code
  server.tool(
    'go_format',
    {
      path: z.string().default('./...'),
      write: z.boolean().default(false),
    },
    async ({ path, write }: { path: string, write: boolean }) => {
      try {
        const writeFlag = write ? '-w' : ''
        const { stdout, stderr } = await execAsync(`go fmt ${writeFlag} ${path}`)
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'No formatting changes needed'
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error running go fmt: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Run Go linting
  server.tool(
    'go_lint',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      try {
        const { stdout, stderr } = await execAsync(`golint ${path}`)
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'No lint issues found'
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error running golint: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Run Go tests
  server.tool(
    'go_test',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      try {
        const { stdout, stderr } = await execAsync(`go test -v ${path}`)
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'Tests passed with no output'
          }]
        }
      } catch (error) {
        // If the command fails, it might be because tests failed
        const errorOutput = error instanceof Error && 'stdout' in error
          ? (error as unknown as { stdout: string }).stdout
          : String(error)

        return {
          content: [{
            type: 'text',
            text: errorOutput || `Error running tests: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Run go mod tidy
  server.tool(
    'go_mod_tidy',
    {
      path: z.string().default('./...'),
    },
    async ({ }: { path: string }) => {
      try {
        const { stdout, stderr } = await execAsync('go mod tidy')
        return {
          content: [{
            type: 'text',
            text: stdout || stderr || 'Dependencies cleaned up successfully'
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error running go mod tidy: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )
}
