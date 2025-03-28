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
 * Executes multiple Go commands in sequence and combines their output
 *
 * @param commands Array of command objects with command string and success message
 * @param workingDir The directory to execute the commands in
 * @param combinedSuccessMessage Default message when all commands succeed with no output
 * @returns Combined output from all commands
 */
async function executeSequentialGoCommands(
  commands: Array<{ command: string; successMessage: string }>,
  workingDir: string,
  combinedSuccessMessage: string
): Promise<{
  content: { type: 'text'; text: string }[];
  isError?: boolean;
}> {
  let combinedOutput = ''
  let hasError = false

  for (const { command, successMessage } of commands) {
    try {
      const result = await executeGoCommand(command, workingDir, successMessage)

      // Extract the text content from the result
      const outputText = result.content[0].text

      if (combinedOutput) {
        combinedOutput += '\n\n' + '---'.repeat(10) + '\n\n'
      }

      // Always include the command output or success message
      combinedOutput += `[${command}]:\n${outputText}`

      // If any command reports an error, mark the combined result as having an error
      if (result.isError) {
        hasError = true
      }
    } catch (error) {
      // If a command fails, include error information but continue with remaining commands
      const errorMessage = `Error running command "${command}": ${error instanceof Error ? error.message : String(error)}`
      if (combinedOutput) {
        combinedOutput += '\n\n' + '---'.repeat(10) + '\n\n'
      }
      combinedOutput += `[${command}] ERROR:\n${errorMessage}`
      hasError = true
    }
  }

  return {
    content: [{
      type: 'text' as const,
      text: combinedOutput || combinedSuccessMessage
    }],
    isError: hasError
  }
}

/**
 * Registers Go-related tools with the MCP server
 * Implements commands for Go code analysis and testing
 */
export function registerGoTools(server: McpServer): void {
  // Tool: Comprehensive code analysis using golangci-lint
  server.tool(
    'go_analyze',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern to analyze (e.g., "./...", "./pkg/...", specific file)'),
      config: z.string().optional().describe('Path to custom golangci-lint config file'),
      fast: z.boolean().default(false).describe('Run only fast linters'),
      fix: z.boolean().default(false).describe('Automatically fix issues when possible'),
      severity: z.enum(['error', 'warning', 'info']).default('warning').describe('Minimum severity of issues to report')
    },
    async ({ wd, path, config, fast, fix, severity }: {
      wd: string,
      path: string,
      config?: string,
      fast: boolean,
      fix: boolean,
      severity: string
    }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      try {
        // Build command with options
        let command = 'golangci-lint run'

        if (config) {
          command += ` --config=${config}`
        }

        if (fast) {
          command += ' --fast'
        }

        if (fix) {
          command += ' --fix'
        }

        command += ` --severity=${severity}`
        command += ' --out-format=colored-line-number' // For better readable output
        command += ` ${path}`

        return executeGoCommand(
          command,
          wd,
          'No issues found in the code'
        )
      } catch (error) {
        console.error('Error running code analysis:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running code analysis: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Fix Go code (dependencies, imports, formatting)
  server.tool(
    'go_fix',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern of files to fix (e.g., "./...", "./pkg/...", specific file)'),
      deps: z.boolean().default(true).describe('Run go mod tidy to fix dependencies'),
      imports: z.boolean().default(true).describe('Run goimports to fix imports'),
      format: z.boolean().default(true).describe('Run gofumpt to format code'),
      extra: z.boolean().default(false).describe('Use extra formatting rules with gofumpt')
    },
    async ({ wd, path, deps, imports, format, extra }: {
      wd: string,
      path: string,
      deps: boolean,
      imports: boolean,
      format: boolean,
      extra: boolean
    }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      const commands = []

      // Add commands in the correct sequence
      if (deps) {
        commands.push({
          command: 'go mod tidy',
          successMessage: 'Dependencies cleaned up successfully'
        })
      }

      if (imports) {
        commands.push({
          command: `goimports -w ${path}`,
          successMessage: 'Imports organized successfully'
        })
      }

      if (format) {
        const extraFlag = extra ? '-extra' : ''
        commands.push({
          command: `gofumpt -w ${extraFlag} ${path}`,
          successMessage: 'Code formatted successfully'
        })
      }

      try {
        return executeSequentialGoCommands(
          commands,
          wd,
          'Code fixed successfully'
        )
      } catch (error) {
        console.error('Error fixing code:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error fixing code: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Enhanced test runner with coverage and benchmarks
  server.tool(
    'go_test',
    {
      wd: z.string().describe('Working directory where the command will be executed'),
      path: z.string().default('./...').describe('Path pattern for tests to run (e.g., "./...", "./pkg/...", specific package)'),
      coverage: z.boolean().default(false).describe('Generate code coverage statistics'),
      verbose: z.boolean().default(true).describe('Enable verbose output'),
      race: z.boolean().default(false).describe('Enable data race detection'),
      bench: z.string().optional().describe('Run only benchmarks matching the regular expression')
    },
    async ({ wd, path, coverage, verbose, race, bench }: {
      wd: string,
      path: string,
      coverage: boolean,
      verbose: boolean,
      race: boolean,
      bench?: string
    }) => {
      // Validate that working directory is an absolute path
      if (!isAbsolutePath(wd)) {
        return createWdError(wd)
      }

      try {
        let command = 'go test'

        if (verbose) {
          command += ' -v'
        }

        if (race) {
          command += ' -race'
        }

        if (coverage) {
          command += ' -coverprofile=coverage.out'
        }

        if (bench) {
          command += ` -bench=${bench} -run=^$` // -run=^$ ensures no tests run with benchmarks
        }

        command += ` ${path}`

        // If coverage is enabled, also generate coverage report
        if (coverage) {
          return executeSequentialGoCommands(
            [
              {
                command,
                successMessage: 'Tests passed with no output'
              },
              {
                command: 'go tool cover -func=coverage.out',
                successMessage: 'No coverage information available'
              }
            ],
            wd,
            'Tests completed successfully'
          )
        } else {
          return executeGoCommand(
            command,
            wd,
            'Tests passed with no output'
          )
        }
      } catch (error) {
        console.error('Error running tests:', error)
        return {
          content: [{
            type: 'text' as const,
            text: `Error running tests: ${error instanceof Error ? error.message : String(error)}`
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
