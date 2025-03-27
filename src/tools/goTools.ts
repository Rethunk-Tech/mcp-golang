import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { exec } from 'child_process'
import { promisify } from 'util'
import { z } from 'zod'

// Promisify exec for async/await usage
const execAsync = promisify(exec)

/**
 * Checks if a path is absolute, defined as containing more than two slashes (/ or \)
 *
 * @param path The path to check
 * @returns True if the path is absolute, false otherwise
 */
function isAbsolutePath(path: string): boolean {
  // Count both forward and backward slashes
  const slashCount = (path.match(/[/\\]/g) || []).length
  return slashCount > 2
}

/**
 * Creates an error response for invalid working directory paths
 *
 * @param wd The invalid working directory path
 * @returns Error response object
 */
function createWdError(wd: string): {
  content: { type: 'text'; text: string }[];
  isError: boolean;
} {
  return {
    content: [{
      type: 'text' as const,
      text: `Error: Working directory "${wd}" is not an absolute path. Please provide a path with more than 2 slashes.`
    }],
    isError: true
  }
}

/**
 * Execute a Go command and handle its output consistently
 *
 * @param command The Go command to execute
 * @param workingDir The directory to execute the command in
 * @param successMessage Default message when command succeeds but has no output
 * @returns Object with content and optional error flag
 */
async function executeGoCommand(command: string, workingDir: string, successMessage: string): Promise<{
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}> {
  try {
    const { stdout, stderr } = await execAsync(command, { cwd: workingDir })
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
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern to analyze (e.g., "./...", "./pkg/...", specific file)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      return executeGoCommand(
        `deadcode ${path}`,
        wd,
        'No dead code found'
      )
    }
  )

  // Tool: Run go vet for static analysis
  server.tool(
    'go_vet',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern to analyze (e.g., "./...", "./pkg/...", specific file)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      return executeGoCommand(
        `go vet ${path}`,
        wd,
        'No issues found by go vet'
      )
    }
  )

  // Tool: Format Go code
  server.tool(
    'go_format',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern of files to format (e.g., "./...", "./pkg/...", specific file)'),
      write: z.boolean().default(false).describe('Whether to write changes directly to the source files (true) or just output the diff (false)')
    },
    async ({ wd, path, write }: { wd: string, path: string, write: boolean }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      const writeFlag = write ? '-w' : ''
      return executeGoCommand(
        `go fmt ${writeFlag} ${path}`,
        wd,
        'No formatting changes needed'
      )
    }
  )

  // Tool: Run Go linting
  server.tool(
    'go_lint',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern to lint (e.g., "./...", "./pkg/...", specific file)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      return executeGoCommand(
        `golint ${path}`,
        wd,
        'No lint issues found'
      )
    }
  )

  // Tool: Run Go tests
  server.tool(
    'go_test',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern for tests to run (e.g., "./...", "./pkg/...", specific package)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      return executeGoCommand(
        `go test -v ${path}`,
        wd,
        'Tests passed with no output'
      )
    }
  )

  // Tool: Run go mod tidy
  server.tool(
    'go_mod_tidy',
    {
      wd: z.string().describe('Working directory where the command will be executed (should contain go.mod file)')
    },
    async ({ wd }: { wd: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      return executeGoCommand(
        'go mod tidy',
        wd,
        'Dependencies cleaned up successfully'
      )
    }
  )
}
