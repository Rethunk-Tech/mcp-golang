import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { beforeEach, describe, expect, it } from 'vitest'
import { MockMcpServer, extractIdFromResponse } from '../../__tests__/test-utils.js'
import { registerNoteTools, resetNotes } from '../noteTools.js'

describe('Note Tools', () => {
  let server: MockMcpServer

  beforeEach(() => {
    server = new MockMcpServer()
    resetNotes()
    registerNoteTools(server as unknown as McpServer)
  })

  describe('create_note', () => {
    it('should create a note with valid input', async () => {
      const result = await server.callTool('create_note', {
        title: 'Test Note',
        content: 'This is a test note'
      })

      expect(result.content[0].type).toBe('text')
      expect(result.content[0].text).toContain('Note created with ID:')
    })

    it('should create a note with tags', async () => {
      const result = await server.callTool('create_note', {
        title: 'Tagged Note',
        content: 'This is a tagged note',
        tags: ['test', 'example']
      })

      // Get the ID from the response
      const id = extractIdFromResponse(result)
      expect(id).not.toBe('')

      // Retrieve the note to verify tags were saved
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Tags: test, example')
    })
  })

  describe('list_notes', () => {
    it('should return "No notes found" when no notes exist', async () => {
      const result = await server.callTool('list_notes', {})
      expect(result.content[0].text).toBe('No notes found.')
    })

    it('should list created notes', async () => {
      // Create a couple of notes
      await server.callTool('create_note', {
        title: 'First Note',
        content: 'First note content'
      })

      await server.callTool('create_note', {
        title: 'Second Note',
        content: 'Second note content'
      })

      const result = await server.callTool('list_notes', {})
      expect(result.content[0].text).toContain('Available Notes:')
      expect(result.content[0].text).toContain('First Note')
      expect(result.content[0].text).toContain('Second Note')
    })
  })

  describe('get_note', () => {
    it('should retrieve a note by ID', async () => {
      // Create a note
      const createResult = await server.callTool('create_note', {
        title: 'Note to Retrieve',
        content: 'This note will be retrieved'
      })

      // Extract the ID from the response
      const id = extractIdFromResponse(createResult)
      expect(id).not.toBe('')

      // Retrieve the note
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Note to Retrieve')
      expect(getResult.content[0].text).toContain('This note will be retrieved')
    })

    it('should return an error for non-existent ID', async () => {
      const result = await server.callTool('get_note', { id: 'nonexistent' })
      expect(result.content[0].text).toContain('Error')
      expect(result.isError).toBe(true)
    })
  })

  describe('update_note', () => {
    it('should update a note\'s title', async () => {
      // Create a note
      const createResult = await server.callTool('create_note', {
        title: 'Original Title',
        content: 'Original content'
      })

      // Extract the ID
      const id = extractIdFromResponse(createResult)

      // Update the note
      const updateResult = await server.callTool('update_note', {
        id,
        title: 'Updated Title'
      })
      expect(updateResult.content[0].text).toContain('updated successfully')

      // Verify the update
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Updated Title')
      expect(getResult.content[0].text).toContain('Original content')
    })

    it('should update a note\'s content', async () => {
      // Create a note
      const createResult = await server.callTool('create_note', {
        title: 'Test Note',
        content: 'Original content'
      })

      // Extract the ID
      const id = extractIdFromResponse(createResult)

      // Update the note
      await server.callTool('update_note', {
        id,
        content: 'Updated content'
      })

      // Verify the update
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Test Note')
      expect(getResult.content[0].text).toContain('Updated content')
    })

    it('should update a note\'s tags', async () => {
      // Create a note
      const createResult = await server.callTool('create_note', {
        title: 'Test Note',
        content: 'Content',
        tags: ['original']
      })

      // Extract the ID
      const id = extractIdFromResponse(createResult)

      // Update the note
      await server.callTool('update_note', {
        id,
        tags: ['updated', 'tag']
      })

      // Verify the update
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Tags: updated, tag')
    })
  })

  describe('delete_note', () => {
    it('should delete a note', async () => {
      // Create a note
      const createResult = await server.callTool('create_note', {
        title: 'Note to Delete',
        content: 'This note will be deleted'
      })

      // Extract the ID
      const id = extractIdFromResponse(createResult)

      // Delete the note
      const deleteResult = await server.callTool('delete_note', { id })
      expect(deleteResult.content[0].text).toContain('deleted successfully')

      // Verify the deletion
      const getResult = await server.callTool('get_note', { id })
      expect(getResult.content[0].text).toContain('Error')
      expect(getResult.isError).toBe(true)
    })

    it('should return an error for non-existent ID', async () => {
      const result = await server.callTool('delete_note', { id: 'nonexistent' })
      expect(result.content[0].text).toContain('Error')
      expect(result.isError).toBe(true)
    })
  })
})
