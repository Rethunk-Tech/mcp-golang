import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { main } from '../index.js'

// Constants matching those in index.ts
const SERVER_NAME = 'mcp-template-node'
const SERVER_VERSION = '1.0.0'

// Mock server connect function
const mockConnect = vi.fn().mockResolvedValue(undefined)

// Create mock functions for dependencies
vi.mock('@modelcontextprotocol/sdk/server/mcp.js', () => ({
  McpServer: vi.fn(() => ({
    tool: vi.fn(),
    resource: vi.fn(),
    prompt: vi.fn(),
    connect: mockConnect
  })),
  ResourceTemplate: vi.fn(() => ({}))
}))

vi.mock('@modelcontextprotocol/sdk/server/stdio.js', () => ({
  StdioServerTransport: vi.fn()
}))

vi.mock('../tools/noteTools.js', () => ({
  registerNoteTools: vi.fn()
}))

describe('MCP Server', () => {
  // Original console.error
  const originalConsoleError = console.error

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks()

    // Mock console.error for all tests
    console.error = vi.fn()
  })

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError
  })

  it('should initialize the server with correct metadata', async () => {
    await main()

    // Verify McpServer was initialized with correct name and version
    expect(McpServer).toHaveBeenCalledWith({
      name: SERVER_NAME,
      version: SERVER_VERSION
    })
  })

  it('should register note tools', async () => {
    const { registerNoteTools } = await import('../tools/noteTools.js')

    await main()

    // Verify registerNoteTools was called with the server instance
    expect(registerNoteTools).toHaveBeenCalledTimes(1)
    expect(registerNoteTools).toHaveBeenCalledWith(expect.any(Object))
  })

  it('should connect to the stdio transport', async () => {
    await main()

    // Verify StdioServerTransport was initialized
    expect(StdioServerTransport).toHaveBeenCalledTimes(1)

    // Verify connect was called on the server
    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('should log success message when server starts successfully', async () => {
    // Mock console.error for this test only
    const mockedConsoleError = console.error as ReturnType<typeof vi.fn>

    await main()

    // Verify success message was logged
    expect(mockedConsoleError).toHaveBeenCalledWith(
      expect.stringContaining(`${SERVER_NAME} server started successfully`)
    )
  })

  it('should handle initialization errors', async () => {
    // Mock console.error for this test only
    const mockedConsoleError = console.error as ReturnType<typeof vi.fn>

    // Mock McpServer to throw an error
    vi.mocked(McpServer).mockImplementationOnce(() => {
      throw new Error('Test initialization error')
    })

    // Mock process.exit
    const processExitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never)

    await main()

    // Verify error message was logged
    expect(mockedConsoleError).toHaveBeenCalledWith(
      'Failed to start server:',
      expect.objectContaining({ message: 'Test initialization error' })
    )

    // Verify process.exit was called
    expect(processExitSpy).toHaveBeenCalledWith(1)
  })
})
