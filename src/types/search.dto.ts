/**
 * Integrated search target type.
 *
 * AGENTS.local.md defines GET /search with:
 * type: board | document | schedule
 */
export type SearchType = 'board' | 'document' | 'schedule'

/**
 * Temporary integrated search response DTO.
 *
 * TODO:
 * Replace this manual type with the OpenAPI-generated backend DTO when the
 * backend SearchResponseDto schema is ready.
 *
 * Example:
 * import type { components } from './generated'
 * export type SearchResponseDto = components['schemas']['SearchResponseDto']
 */
export interface SearchResponseDto {
  /**
   * Search result ID.
   *
   * The meaning depends on type:
   * - board: BOARD_ID
   * - schedule: SCHD_ID
   * - document: DRFT_DOC_SN or file ID
   */
  id: number

  /**
   * Search result category.
   */
  type: SearchType

  /**
   * Main title shown in the result list.
   */
  title: string

  /**
   * Secondary text under the title.
   *
   * Examples:
   * - Board · Kim Minjun · 3 days ago
   * - 2025.05.22 14:00 · Halla meeting room
   * - Drive · 5.2MB · 1 week ago
   */
  description?: string

  /**
   * Frontend route to open when the user selects this result.
   *
   * If the backend does not provide a path, the frontend can derive one from
   * type and id.
   */
  path?: string

  /**
   * Short status text shown as a badge.
   *
   * Examples:
   * - D-2
   * - Notice
   * - In progress
   */
  badgeText?: string
}
