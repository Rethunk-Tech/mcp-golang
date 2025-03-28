/**
 * Error codes for note operations
 */
export enum NoteErrorCode {
  NOT_FOUND = 'NOTE_NOT_FOUND',
  DUPLICATE_TITLE = 'DUPLICATE_TITLE',
  INVALID_INPUT = 'INVALID_INPUT',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}

/**
 * Custom error class for note operations
 */
export class NoteError extends Error {
  constructor(
    message: string,
    public readonly code: NoteErrorCode
  ) {
    super(message)
    this.name = 'NoteError'
    Object.setPrototypeOf(this, NoteError.prototype)
  }

  /**
   * Creates a not found error
   */
  static notFound(id: string): NoteError {
    return new NoteError(`Note with ID ${id} not found`, NoteErrorCode.NOT_FOUND)
  }

  /**
   * Creates a duplicate title error
   */
  static duplicateTitle(title: string): NoteError {
    return new NoteError(`A note with title "${title}" already exists`, NoteErrorCode.DUPLICATE_TITLE)
  }
}
