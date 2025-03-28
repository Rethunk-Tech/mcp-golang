import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'
import { Note } from '../types/note.js'

// Store notes in memory
const notes: Record<string, Note> = {}

/**
 * Generate a unique ID for a note
 */
function generateId(): string {
  return uuidv4().replace(/-/g, '').substring(0, 8)
}

/**
 * Resets the notes for testing purposes
 */
export function resetNotes(): void {
  Object.keys(notes).forEach((key) => delete notes[key])
}

/**
 * Registers note-related tools with the MCP server
 * Implements CRUD operations for notes management
 */
export function registerNoteTools(server: McpServer): void {
  // Tool: Create a new note
  server.tool(
    'create_note',
    {
      title: z.string().min(1).max(100),
      content: z.string().min(1).max(10000),
      tags: z.array(z.string()).optional(),
    },
    async ({ title, content, tags }: { title: string; content: string; tags?: string[] }) => {
      try {
        const id = generateId()
        const now = new Date()

        notes[id] = {
          id,
          title,
          content,
          tags,
          createdAt: now,
          updatedAt: now,
        }

        return {
          content: [{
            type: 'text',
            text: `Note created with ID: ${id}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: List all notes
  server.tool(
    'list_notes',
    {},
    async () => {
      try {
        const allNotes = Object.values(notes)

        if (allNotes.length === 0) {
          return {
            content: [{
              type: 'text',
              text: 'No notes found.'
            }]
          }
        }

        const formattedNotes = allNotes
          .map(note => {
            const tagsStr = note.tags && note.tags.length > 0
              ? `\nTags: ${note.tags.join(', ')}`
              : ''

            return `ID: ${note.id}\nTitle: ${note.title}${tagsStr}\nCreated: ${note.createdAt.toISOString()}\n---\n`
          }).join('\n')

        return {
          content: [{
            type: 'text',
            text: `Available Notes:\n\n${formattedNotes}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Get a note by ID
  server.tool(
    'get_note',
    {
      id: z.string().min(1).max(8).regex(/^[a-z0-9]+$/),
    },
    async ({ id }: { id: string }) => {
      try {
        const note = notes[id]

        if (!note) {
          return {
            content: [{
              type: 'text',
              text: `Error: No note found with ID: ${id}`
            }],
            isError: true
          }
        }

        const tagsStr = note.tags && note.tags.length > 0
          ? `\nTags: ${note.tags.join(', ')}`
          : ''

        return {
          content: [{
            type: 'text',
            text: `Title: ${note.title}${tagsStr}\nCreated: ${note.createdAt.toISOString()}\nUpdated: ${note.updatedAt?.toISOString() || note.createdAt.toISOString()}\n\n${note.content}`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Update a note
  server.tool(
    'update_note',
    {
      id: z.string().min(1).max(8).regex(/^[a-z0-9]+$/),
      title: z.string().min(1).max(100).optional(),
      content: z.string().min(1).max(10000).optional(),
      tags: z.array(z.string()).optional(),
    },
    async ({ id, title, content, tags }: { id: string; title?: string; content?: string; tags?: string[] }) => {
      try {
        const note = notes[id]

        if (!note) {
          return {
            content: [{
              type: 'text',
              text: `Error: No note found with ID: ${id}`
            }],
            isError: true
          }
        }

        const updatedNote = {
          ...note,
          title: title !== undefined ? title : note.title,
          content: content !== undefined ? content : note.content,
          tags: tags !== undefined ? tags : note.tags,
          updatedAt: new Date(),
        }

        notes[id] = updatedNote

        return {
          content: [{
            type: 'text',
            text: `Note with ID ${id} updated successfully.`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )

  // Tool: Delete a note
  server.tool(
    'delete_note',
    {
      id: z.string().min(1).max(8).regex(/^[a-z0-9]+$/),
    },
    async ({ id }: { id: string }) => {
      try {
        const note = notes[id]

        if (!note) {
          return {
            content: [{
              type: 'text',
              text: `Error: No note found with ID: ${id}`
            }],
            isError: true
          }
        }

        delete notes[id]

        return {
          content: [{
            type: 'text',
            text: `Note with ID ${id} deleted successfully.`
          }]
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error instanceof Error ? error.message : String(error)}`
          }],
          isError: true
        }
      }
    }
  )
}
