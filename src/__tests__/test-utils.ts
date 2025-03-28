import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { vi } from 'vitest'
import { z } from 'zod'
import { Note } from '../types/note.js'

/**
 * Type for tool handler function
 */
type ToolHandler = (params: Record<string, unknown>) => Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}>

/**
 * Type for resource handler function
 */
type ResourceHandler = (uri: URL, params: Record<string, unknown>) => Promise<{
  contents: Array<{ uri: string; text: string }>;
}>

/**
 * Type for prompt handler function
 */
type PromptHandler = (params: Record<string, unknown>) => {
  messages: Array<{
    role: string;
    content: { type: string; text: string };
  }>;
}

/**
 * Type for tool definition
 */
interface ToolDefinition {
  schema: z.ZodRawShape;
  handler: ToolHandler;
}

/**
 * Mock McpServer implementation for testing tools
 */
export class MockMcpServer {
  tools: Record<string, ToolDefinition> = {}

  tool(name: string, schema: z.ZodRawShape, handler: ToolHandler): this {
    this.tools[name] = { schema, handler }
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resource(_name: string, _uri: URL | string, _handler: ResourceHandler): this {
    // Resource handling is not needed for most tool tests
    return this
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prompt(_name: string, _schema: z.ZodRawShape, _handler: PromptHandler): this {
    // Prompt handling is not needed for most tool tests
    return this
  }

  async callTool(name: string, params: Record<string, unknown>): Promise<{
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  }> {
    if (!this.tools[name]) {
      throw new Error(`Tool not found: ${name}`)
    }
    return this.tools[name].handler(params)
  }
}

/**
 * Create a mock note for testing
 */
export function createMockNote(overrides: Partial<Note> = {}): Note {
  const now = new Date()

  return {
    id: 'test123',
    title: 'Test Note',
    content: 'This is a test note',
    createdAt: now,
    updatedAt: now,
    ...overrides
  }
}

/**
 * Create a spy for console methods
 */
export function mockConsole(): { restore: () => void } {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const infoSpy = vi.spyOn(console, 'info').mockImplementation(() => {})
  const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  return {
    restore: (): void => {
      errorSpy.mockRestore()
      infoSpy.mockRestore()
      logSpy.mockRestore()
      warnSpy.mockRestore()
    }
  }
}

/**
 * Extract ID from a tool response
 */
export function extractIdFromResponse(response: {
  content: Array<{ type: string; text: string }>;
}): string {
  const text = response.content[0].text
  const match = text.match(/ID: ([a-z0-9]+)/)
  return match ? match[1] : ''
}

/**
 * Create a complete mock of McpServer for integration tests
 */
export function createMockMcpServer(): {
  server: McpServer;
  transport: {
    onMessage: ReturnType<typeof vi.fn>;
    sendMessage: ReturnType<typeof vi.fn>;
  };
  } {
  const server = {
    resource: vi.fn().mockReturnThis(),
    prompt: vi.fn().mockReturnThis(),
    connect: vi.fn().mockResolvedValue(undefined),
    tool: vi.fn().mockReturnThis()
  } as unknown as McpServer

  const transport = {
    onMessage: vi.fn(),
    sendMessage: vi.fn()
  }

  return { server, transport }
}
