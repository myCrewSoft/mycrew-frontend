import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  VideoConfCreateRequest,
  VideoConfResponse,
  VideoTokenResponse,
  VideoMomUpdateRequest,
  VideoMomResponse,
  VideoMomAprvlRequest,
} from '../types'

const MEETING_API_PREFIX = '/api/video-conferences'

// 내가 참여 중인 화상회의 목록 조회
const getConfList = () => {
  return axiosInstance.get<ApiResponse<VideoConfResponse[]>>(`${MEETING_API_PREFIX}`)
}

// 화상회의 단건 조회
const getConf = (vconfId: number) => {
  return axiosInstance.get<ApiResponse<VideoConfResponse>>(`${MEETING_API_PREFIX}/${vconfId}`)
}

// 화상회의 생성
const createConf = (payload: VideoConfCreateRequest) => {
  return axiosInstance.post<ApiResponse<VideoConfResponse>>(`${MEETING_API_PREFIX}`, payload)
}

// LiveKit 입장 토큰 발급
const issueToken = (vconfId: number) => {
  return axiosInstance.post<ApiResponse<VideoTokenResponse>>(`${MEETING_API_PREFIX}/${vconfId}/token`)
}

// 화상회의 종료
const endConf = (vconfId: number) => {
  return axiosInstance.patch<ApiResponse<void>>(`${MEETING_API_PREFIX}/${vconfId}/end`)
}

// 회의록 조회
const getMom = (vconfId: number) => {
  return axiosInstance.get<ApiResponse<VideoMomResponse>>(`${MEETING_API_PREFIX}/${vconfId}/minutes`)
}

// 회의록 수정
const updateMom = (vconfId: number, payload: VideoMomUpdateRequest) => {
  return axiosInstance.put<ApiResponse<VideoMomResponse>>(`${MEETING_API_PREFIX}/${vconfId}/minutes`, payload)
}

// 회의록 검토 요청
const requestMomReview = (vconfId: number) => {
  return axiosInstance.post<ApiResponse<void>>(`${MEETING_API_PREFIX}/${vconfId}/minutes/review`)
}

// 회의록 결재
const approveMom = (vconfId: number, payload: VideoMomAprvlRequest) => {
  return axiosInstance.post<ApiResponse<void>>(`${MEETING_API_PREFIX}/${vconfId}/minutes/approve`, payload)
}

// 녹취록 업로드
const uploadRcrdg = (vconfId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosInstance.post<ApiResponse<void>>(
    `${MEETING_API_PREFIX}/${vconfId}/recordings/upload`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

// 녹취록 다운로드 URL 반환
const getRcrdgDownloadUrl = (atchFileId: number) => {
  return `${MEETING_API_PREFIX}/recordings/${atchFileId}/download`
}

// STT 변환 (5초 오디오 청크 전송)
const transcribe = (vconfId: number, audioChunk: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioChunk, 'chunk.webm')
  return axiosInstance.post<ApiResponse<string>>(
    `${MEETING_API_PREFIX}/${vconfId}/stt`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } }
  )
}

export const meetingApi = {
  getConfList,
  getConf,
  createConf,
  issueToken,
  endConf,
  getMom,
  updateMom,
  requestMomReview,
  approveMom,
  uploadRcrdg,
  getRcrdgDownloadUrl,
  transcribe,
}