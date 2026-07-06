//프로젝트 API 함수 모음

import { type TaskDashboardResponse } from "../types";
import { type ProjectListResponseDto, type ProjectCreateRequestDto, type ProjectDetailResponseDto, type ProjectUpdateRequestDto,
     type ProjectMemberAddRequest, type AdminProjectListResponseDto } from "../types/project";
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
        axiosInstance.put<ApiResponse<string>>(`/api/projects/${projId}/ptcpts`, empId),

    //프로젝트 개요 탭 업무 api 연동
    getTaskDashboard : (projId: number) =>
        axiosInstance.get<ApiResponse<TaskDashboardResponse>>(`/api/projects/${projId}/tasks/dashboard`),

    //프로젝트 관리자 페이지 전체 목록 및 각 프로젝트 참여자 목록 조회
    getAdminProjectList: () =>
        axiosInstance.get<ApiResponse<AdminProjectListResponseDto[]>>('/api/admin/projects'),
}