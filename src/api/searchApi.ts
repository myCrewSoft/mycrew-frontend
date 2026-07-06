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
 * - type: PROJECT | TASK | SCHEDULE | MEETING | MAIL
 */
export const searchApi = {
  /**
   * Search every domain the current user is allowed to access.
   *
   * Pass only keyword for all results.
   * Pass type when the UI needs one specific category.
   */
  search: (
    keyword: string,
    type?: SearchType,
  ): Promise<AxiosResponse<ApiResponse<SearchResponseDto[]>>> => {
    return axiosInstance.get('api/search', {
      params: {
        keyword,
        type,
      },
    })
  },
}
