import { describe, expect, it } from 'vitest'
import { createMockNote } from '../../__tests__/test-utils.js'
import { Note } from '../note.js'

describe('Note Types', () => {
  describe('Note interface', () => {
    it('should have the required properties', () => {
      const note = createMockNote()

      expect(note).toHaveProperty('id')
      expect(note).toHaveProperty('title')
      expect(note).toHaveProperty('content')
      expect(note).toHaveProperty('createdAt')
      expect(note.createdAt).toBeInstanceOf(Date)
    })

    it('should allow optional properties', () => {
      const note = createMockNote({
        tags: ['test', 'note'],
        updatedAt: new Date(Date.now() + 3600000) // 1 hour later
      })

      expect(note.tags).toEqual(['test', 'note'])
      expect(note.updatedAt).toBeInstanceOf(Date)

      // UpdatedAt should be after createdAt
      expect(note.updatedAt!.getTime()).toBeGreaterThan(note.createdAt.getTime())
    })

    it('should create a valid note object', () => {
      const now = new Date()
      const note: Note = {
        id: 'abc123',
        title: 'Test Note',
        content: 'This is a test note',
        createdAt: now
      }

      expect(note.id).toBe('abc123')
      expect(note.title).toBe('Test Note')
      expect(note.content).toBe('This is a test note')
      expect(note.createdAt).toBe(now)
      expect(note.tags).toBeUndefined()
      expect(note.updatedAt).toBeUndefined()
    })
  })
})
