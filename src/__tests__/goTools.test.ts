import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { registerGoTools } from '../tools/goTools.js'

// Mock the exec function
vi.mock('child_process', () => ({
  exec: vi.fn((_cmd, _options, callback) => {
    if (callback) {
      callback(null, { stdout: 'mocked stdout', stderr: '' })
    } else {
      return {
        stdout: 'mocked stdout',
        stderr: ''
      }
    }
  })
}))

interface ToolDefinition {
  schema: unknown;
  handler: (params: Record<string, unknown>) => Promise<{
    content: { type: string; text: string }[];
    isError?: boolean;
  }>;
}

describe('Go Tools', () => {
  let server: McpServer
  let registeredTools: Record<string, ToolDefinition> = {}

  // Mock MCP server
  beforeEach(() => {
    registeredTools = {}
    server = {
      tool: vi.fn((name, schema, handler) => {
        registeredTools[name] = { schema, handler }
      })
    } as unknown as McpServer

    registerGoTools(server)
  })

  describe('Working directory validation', () => {
    it('should return an error for non-absolute paths', async () => {
      // Test with a non-absolute path (less than 3 slashes)
      const nonAbsolutePath = 'some/path'

      // Test each tool
      for (const toolName of Object.keys(registeredTools)) {
        const { handler } = registeredTools[toolName]

        // Call handler with the non-absolute path
        const params = toolName === 'go_mod_tidy'
          ? { wd: nonAbsolutePath }
          : { wd: nonAbsolutePath, path: './...' }

        const result = await handler(params)

        // Verify the result has an error about the working directory
        expect(result.isError).toBe(true)
        expect(result.content[0].text).toContain('is not an absolute path')
      }
    })

    it('should accept paths with more than 2 slashes', async () => {
      // Test with an absolute path (more than 2 slashes)
      const absolutePath = '/some/absolute/path'

      // Test each tool
      for (const toolName of Object.keys(registeredTools)) {
        const { handler } = registeredTools[toolName]

        // Call handler with the absolute path
        const params = toolName === 'go_mod_tidy'
          ? { wd: absolutePath }
          : { wd: absolutePath, path: './...' }

        const result = await handler(params)

        // Verify the result does not have an error about the working directory
        expect(result.content[0].text).not.toContain('is not an absolute path')
      }
    })
  })
})
