import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerGoTools } from '../goTools.js'

// Mock the necessary modules
vi.mock('util', () => ({
  promisify: () => async () => ({ stdout: 'mocked output', stderr: '' })
}))

vi.mock('child_process', () => ({
  exec: vi.fn()
}))

describe('Go Tools', () => {
  // Create a mock server
  const server = {
    tool: vi.fn()
  } as unknown as McpServer

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should register all go tools with the server', () => {
    registerGoTools(server)

    // Should register 6 tools
    expect(server.tool).toHaveBeenCalledTimes(6)

    // Verify each tool is registered
    expect(server.tool).toHaveBeenCalledWith(
      'go_find_dead_code',
      expect.any(Object),
      expect.any(Function)
    )

    expect(server.tool).toHaveBeenCalledWith(
      'go_vet',
      expect.any(Object),
      expect.any(Function)
    )

    expect(server.tool).toHaveBeenCalledWith(
      'go_format',
      expect.any(Object),
      expect.any(Function)
    )

    expect(server.tool).toHaveBeenCalledWith(
      'go_lint',
      expect.any(Object),
      expect.any(Function)
    )

    expect(server.tool).toHaveBeenCalledWith(
      'go_test',
      expect.any(Object),
      expect.any(Function)
    )

    expect(server.tool).toHaveBeenCalledWith(
      'go_mod_tidy',
      expect.any(Object),
      expect.any(Function)
    )
  })
})
