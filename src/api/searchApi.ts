import type { AxiosResponse } from 'axios'
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { SearchResponse, SearchType } from '../types'

export const searchApi = {
  search: (
    keyword: string,
    type?: SearchType,
  ): Promise<AxiosResponse<ApiResponse<SearchResponse[]>>> => {
    return axiosInstance.get('/api/search', {
      params: { keyword, type },
    })
  },
}
