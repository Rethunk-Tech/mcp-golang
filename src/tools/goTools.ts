import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { exec, ExecOptions, execSync, ExecSyncOptions } from 'child_process'
import { promisify } from 'util'
import { z } from 'zod'

// Promisify exec for async/await usage
// Using explicit type assertion to avoid TypeScript errors
const execAsync = promisify(exec) as (command: string, options?: ExecOptions) => Promise<{ stdout: string; stderr: string }>

/**
 * Checks if a path appears to be absolute
 *
 * @param path The path to check
 * @returns True if the path is absolute, false otherwise
 */
function isAbsolutePath(path: string): boolean {
  // Windows paths typically start with a drive letter followed by ":"
  // Unix paths typically start with "/"
  return /^[a-zA-Z]:/.test(path) || path.startsWith('/') || path.startsWith('\\')
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
      text: `Error: Working directory "${wd}" is not an absolute path. Please provide a valid absolute path.`
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
    let finalCommand = command

    // Handle Windows specially
    if (process.platform === 'win32') {
      // For Windows paths with forward slashes, convert to Windows format
      const windowsPath = workingDir.replace(/\//g, '\\')
      console.error(`Original path: ${workingDir}, Windows path: ${windowsPath}`)

      // Special handling for paths like /s/Projects/...
      if (windowsPath.startsWith('\\s\\')) {
        // Convert /s/Projects/... to s:\Projects\...
        const converted = windowsPath.replace(/^\\s\\/, 's:\\')
        console.error(`Converted path from ${windowsPath} to ${converted}`)

        // Get drive letter without colon
        const driveLetter = converted.charAt(0)

        // Construct a command that:
        // 1. Changes to the drive with /d parameter
        // 2. Then changes to the specific directory
        // 3. Then runs the command
        finalCommand = `cd /d ${driveLetter}: && cd "${converted}" && ${command}`
      } else {
        // For standard Windows paths
        finalCommand = `cd /d "${windowsPath}" && ${command}`
      }

      console.error(`Windows command: ${finalCommand}`)
    } else {
      // For non-Windows platforms, we'll use the cwd option
      finalCommand = command
    }

    try {
      console.error(`Running command: ${finalCommand}`)

      // Execution options
      const options: ExecSyncOptions = process.platform === 'win32'
        ? { encoding: 'utf8', shell: 'cmd.exe' }
        : { cwd: workingDir, encoding: 'utf8' }

      // Try using synchronous execution
      const output = execSync(finalCommand, options).toString()

      return {
        content: [{
          type: 'text' as const,
          text: output || successMessage
        }]
      }
    } catch (syncError) {
      console.error('Failed with execSync, attempting execAsync:', syncError)

      // Fall back to async execution
      const asyncOptions: ExecOptions = process.platform === 'win32'
        ? { shell: 'cmd.exe' }
        : { cwd: workingDir }

      const { stdout, stderr } = await execAsync(finalCommand, asyncOptions)

      return {
        content: [{
          type: 'text' as const,
          text: stdout || stderr || successMessage
        }]
      }
    }
  } catch (error) {
    console.error('Command execution error:', error)

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

      try {
        return executeGoCommand(
          `deadcode ${path}`,
          wd,
          'No dead code found'
        )
      } catch (error) {
        console.error('Error running deadcode:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running deadcode: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
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

      try {
        return executeGoCommand(
          `go vet ${path}`,
          wd,
          'No issues found by go vet'
        )
      } catch (error) {
        console.error('Error running go vet:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running go vet: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
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
      try {
        return executeGoCommand(
          `go fmt ${writeFlag} ${path}`,
          wd,
          'No formatting changes needed'
        )
      } catch (error) {
        console.error('Error running go fmt:', error)
        return {
          content: [{
            type: 'text' as const,
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
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern to lint (e.g., "./...", "./pkg/...", specific file)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      try {
        return executeGoCommand(
          `golint ${path}`,
          wd,
          'No lint issues found'
        )
      } catch (error) {
        console.error('Error running golint:', error)
        return {
          content: [{
            type: 'text' as const,
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
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern for tests to run (e.g., "./...", "./pkg/...", specific package)')
    },
    async ({ wd, path }: { wd: string, path: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      try {
        return executeGoCommand(
          `go test -v ${path}`,
          wd,
          'Tests passed with no output'
        )
      } catch (error) {
        console.error('Error running go test:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running go test: ${error instanceof Error ? error.message : String(error)}`
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
      wd: z.string().describe('Working directory where the command will be executed (should contain go.mod file)')
    },
    async ({ wd }: { wd: string }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      try {
        return executeGoCommand(
          'go mod tidy',
          wd,
          'Dependencies cleaned up successfully'
        )
      } catch (error) {
        console.error('Error running go mod tidy:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running go mod tidy: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )
}
