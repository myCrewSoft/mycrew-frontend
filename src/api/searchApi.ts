import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { SearchResponseDto, SearchType } from '../types/search.dto'

/**
 * Integrated search API collection.
 *
 * AGENTS.local.md:
 * GET /search
 * query parameters:
 * - keyword: search keyword
 * - type: board | document | schedule | project | task
 */
export const searchApi = {
  /**
   * Search boards, documents, and schedules.
   *
   * Pass only keyword for all results.
   * Pass type when the UI needs one specific category.
   */
  search: (
    keyword: string,
    type?: SearchType,
  ): Promise<AxiosResponse<ApiResponse<SearchResponseDto[]>>> => {
    return axiosInstance.get('/search', {
      params: {
        keyword,
        type,
      },
    })
  },
}
