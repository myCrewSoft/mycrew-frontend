import type { components } from './generated'

/**
 * OpenAPI-generated integrated search response.
 *
 * Backend SearchResponse:
 * - id: result ID
 * - parentId: parent result ID. Currently used only for TASK as project ID.
 * - type: PROJECT | SCHEDULE | MEETING | TASK | EDUCATION | MAIL
 */
export type SearchResponseDto = components['schemas']['SearchResponse']

export type SearchType = NonNullable<SearchResponseDto['type']>
