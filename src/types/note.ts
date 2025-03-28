/**
 * Represents a note in the system
 */
export interface Note {
  /** Unique identifier for the note */
  id: string

  /** Title of the note */
  title: string

  /** Content of the note */
  content: string

  /** Timestamp when the note was created */
  createdAt: Date

  /** Timestamp when the note was last updated (if applicable) */
  updatedAt?: Date

  /** Tags associated with the note (if any) */
  tags?: string[]
}
