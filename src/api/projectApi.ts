//프로젝트 API 함수 모음

import type { ProjectListResponseDto, ProjectCreateRequestDto } from "../types/project";
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

export const projectApi = {

    //프로젝트 목록 조회
    getProjectList : () => axiosInstance.get<ApiResponse<ProjectListResponseDto[]>>("api/projects"),

    //프로젝트 등록
    createProject : (reqDto : ProjectCreateRequestDto) => 
        axiosInstance.post<ApiResponse<string>>("/api/projects", reqDto),
}