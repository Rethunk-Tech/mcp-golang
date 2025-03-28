import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockMcpServer } from '../../__tests__/test-utils.js'
import { registerGoTools } from '../goTools.js'

// Mock the child_process module
vi.mock('child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn((cmd) => {
    if (cmd.includes('go vet')) {
      return '# mocked go vet output'
    } else if (cmd.includes('go fmt')) {
      return 'main.go\n'
    } else if (cmd.includes('go test')) {
      return 'ok  	github.com/example/pkg	0.123s\n'
    } else if (cmd.includes('go mod tidy')) {
      return ''
    } else if (cmd.includes('deadcode')) {
      return 'main.go:10:6: unreachable func: unusedFunction\n'
    } else {
      return 'mocked output for: ' + cmd
    }
  })
}))

describe('Go Tools', () => {
  let server: MockMcpServer
  const testWorkingDir = process.platform === 'win32'
    ? 'C:\\test\\project'
    : '/test/project'

  beforeEach(() => {
    server = new MockMcpServer()
    registerGoTools(server as unknown as McpServer)
    vi.clearAllMocks()
  })

  describe('go_find_dead_code', () => {
    it('should report dead code when found', async () => {
      const result = await server.callTool('go_find_dead_code', {
        wd: testWorkingDir,
        path: './...'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('unreachable func')
    })

    it('should reject non-absolute working directory paths', async () => {
      const result = await server.callTool('go_find_dead_code', {
        wd: 'relative/path',
        path: './...'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('not an absolute path')
    })
  })

  describe('go_vet', () => {
    it('should run go vet successfully', async () => {
      const result = await server.callTool('go_vet', {
        wd: testWorkingDir,
        path: './...'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('mocked go vet output')
    })
  })

  describe('go_format', () => {
    it('should format Go code', async () => {
      const result = await server.callTool('go_format', {
        wd: testWorkingDir,
        path: './...',
        write: true
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('main.go')
    })
  })

  describe('go_test', () => {
    it('should run Go tests', async () => {
      const result = await server.callTool('go_test', {
        wd: testWorkingDir,
        path: './...'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('ok')
    })
  })

  describe('go_mod_tidy', () => {
    it('should clean up dependencies', async () => {
      const result = await server.callTool('go_mod_tidy', {
        wd: testWorkingDir
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('Dependencies cleaned up successfully')
    })
  })
})
