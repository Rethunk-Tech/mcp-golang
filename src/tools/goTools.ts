import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { z } from 'zod'

// Promisify exec for async/await usage
const execAsync = promisify(exec)

/**
 * Execute a Go command and handle its output consistently
 *
 * @param command The Go command to execute
 * @param successMessage Default message when command succeeds but has no output
 * @returns Object with content and optional error flag
 */
async function executeGoCommand(command: string, successMessage: string): Promise<{
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}> {
  try {
    const { stdout, stderr } = await execAsync(command)
    return {
      content: [{
        type: 'text' as const,
        text: stdout || stderr || successMessage
      }]
    }
  } catch (error) {
    // Extract stdout/stderr from error object if available
    const errorOutput = error instanceof Error && 'stdout' in error
      ? (error as unknown as { stdout: string }).stdout || (error as unknown as { stderr: string }).stderr
      : String(error)

    return {
      content: [{
        type: 'text' as const,
        text: errorOutput || `Error running command: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    }
  }
}

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
      return executeGoCommand(
        `go run github.com/remyoudompheng/go-misc/deadcode ${path}`,
        'No dead code found'
      )
    }
  )

  // Tool: Run go vet for static analysis
  server.tool(
    'go_vet',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      return executeGoCommand(
        `go vet ${path}`,
        'No issues found by go vet'
      )
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
      const writeFlag = write ? '-w' : ''
      return executeGoCommand(
        `go fmt ${writeFlag} ${path}`,
        'No formatting changes needed'
      )
    }
  )

  // Tool: Run Go linting
  server.tool(
    'go_lint',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      return executeGoCommand(
        `golint ${path}`,
        'No lint issues found'
      )
    }
  )

  // Tool: Run Go tests
  server.tool(
    'go_test',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      return executeGoCommand(
        `go test -v ${path}`,
        'Tests passed with no output'
      )
    }
  )

  // Tool: Run go mod tidy
  server.tool(
    'go_mod_tidy',
    {
      path: z.string().default('./...'),
    },
    async ({ path }: { path: string }) => {
      // Note: go mod tidy is typically run in the directory containing go.mod
      // The path parameter is used to cd to the directory first if needed
      const cdCommand = path.startsWith('./...') ? '' : `cd ${path} &&`
      return executeGoCommand(
        `${cdCommand} go mod tidy`,
        'Dependencies cleaned up successfully'
      )
    }
  )
}
