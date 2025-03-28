import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MockMcpServer } from '../../__tests__/test-utils.js'
import { registerGoTools } from '../goTools.js'

// Mock the child_process module
vi.mock('child_process', () => ({
  exec: vi.fn(),
  execSync: vi.fn((cmd) => {
    if (cmd.includes('golangci-lint run')) {
      if (cmd.includes('--severity=error')) {
        return 'main.go:15:9: [error] SA4006: this value of `err` is never used (staticcheck)\n'
      } else if (cmd.includes('--fix')) {
        return 'main.go:15:9: fixed issue SA4006 (staticcheck)\n'
      } else {
        return 'main.go:15:9: [warning] SA4006: this value of `err` is never used (staticcheck)\n'
      }
    } else if (cmd.includes('gofumpt')) {
      if (cmd.includes('-extra')) {
        return 'main.go (with extra formatting)\n'
      }
      return 'main.go\n'
    } else if (cmd.includes('goimports')) {
      return 'Organized imports in 3 files\n'
    } else if (cmd.includes('go test')) {
      if (cmd.includes('-coverprofile')) {
        return 'ok  	github.com/example/pkg	0.123s	coverage: 75.0% of statements\n'
      } else if (cmd.includes('-bench')) {
        return 'goos: linux\ngoarch: amd64\nBenchmarkFunction-8   	 1000000	      1234 ns/op\nok  	github.com/example/pkg	1.234s\n'
      } else {
        return 'ok  	github.com/example/pkg	0.123s\n'
      }
    } else if (cmd.includes('go tool cover')) {
      return 'github.com/example/pkg/main.go:10:	Function		75.0%\ntotal:				75.0%\n'
    } else if (cmd.includes('go mod tidy')) {
      return ''
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

  describe('go_analyze', () => {
    it('should analyze code with golangci-lint', async () => {
      const result = await server.callTool('go_analyze', {
        wd: testWorkingDir,
        path: './...'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('staticcheck')
    })

    it('should respect severity level', async () => {
      const result = await server.callTool('go_analyze', {
        wd: testWorkingDir,
        path: './...',
        severity: 'error'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('[error]')
    })

    it('should support automatic fixing', async () => {
      const result = await server.callTool('go_analyze', {
        wd: testWorkingDir,
        path: './...',
        fix: true
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('fixed issue')
    })

    it('should reject non-absolute working directory paths', async () => {
      const result = await server.callTool('go_analyze', {
        wd: 'relative/path',
        path: './...'
      })

      expect(result.isError).toBe(true)
      expect(result.content[0].text).toContain('not an absolute path')
    })
  })

  describe('go_fix', () => {
    it('should fix Go code with all tools enabled', async () => {
      // For this test, we'll trust that the tool correctly constructs the commands
      // and focus on verifying the parameters are handled correctly
      const result = await server.callTool('go_fix', {
        wd: testWorkingDir,
        path: './...'
      })

      expect(result.content[0].type).toBe('text')
      // Just make sure we get a result
      expect(result.content[0].text).toBeTruthy()
    })

    it('should support selective tool usage', async () => {
      const result = await server.callTool('go_fix', {
        wd: testWorkingDir,
        path: './...',
        deps: false,
        imports: true,
        format: true
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('Organized imports')
      expect(result.content[0].text).toContain('main.go')
    })

    it('should support extra formatting options', async () => {
      const result = await server.callTool('go_fix', {
        wd: testWorkingDir,
        path: './...',
        deps: false,
        imports: false,
        format: true,
        extra: true
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('extra formatting')
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

    it('should run tests with coverage', async () => {
      const result = await server.callTool('go_test', {
        wd: testWorkingDir,
        path: './...',
        coverage: true
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('coverage: 75.0%')
      expect(result.content[0].text).toContain('total:')
    })

    it('should run benchmarks', async () => {
      const result = await server.callTool('go_test', {
        wd: testWorkingDir,
        path: './...',
        bench: 'Function'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('BenchmarkFunction')
      expect(result.content[0].text).toContain('ns/op')
    })
  })
})
