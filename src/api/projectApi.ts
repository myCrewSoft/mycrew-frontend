//프로젝트 API 함수 모음

import { type ProjectListResponseDto, type ProjectCreateRequestDto, type ProjectDetailResponseDto, type ProjectUpdateRequestDto, type ProjectMemberAddRequest } from "../types/project";
import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'

export const projectApi = {

    //프로젝트 목록 조회
    getProjectList : () => axiosInstance.get<ApiResponse<ProjectListResponseDto[]>>("api/projects"),

    //프로젝트 등록
    createProject : (reqDto : ProjectCreateRequestDto) => 
        axiosInstance.post<ApiResponse<string>>("/api/projects", reqDto),

    //프로젝트 상세 조회
    getProject : (projId : number) => 
        axiosInstance.get<ApiResponse<ProjectDetailResponseDto>>(`/api/projects/${projId}`),

    //프로젝트 수정
    updateProject : (projId : number, updateReqdto : ProjectUpdateRequestDto) =>
        axiosInstance.patch<ApiResponse<string>>(`/api/projects/${projId}`, updateReqdto),

    //프로젝트 참여자 추가
    addProjMembers : (projId : number, reqDto:ProjectMemberAddRequest) =>
        axiosInstance.post<ApiResponse<string>>(`/api/projects/${projId}/ptcpts`, reqDto),

    //프로젝트 참여자 단건 퇴출
    removeProjMember : (projId:number, empId:number) =>
        axiosInstance.put<ApiResponse<string>>(`/api/projects/${projId}/ptcpts`, empId)
}