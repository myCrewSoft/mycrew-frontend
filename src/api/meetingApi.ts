import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type { VideoTokenResponse } from '../types'
import type {
  MeetingDetail,
  MeetingCreateRequest,
  MeetingListItem,
  MeetingMinutesResponse,
  MeetingMinutesUpdateRequest,
  MeetingUpdateRequest,
} from '../types/meeting.dto'

const MEETING_API_PREFIX = '/api/meetings'
const VIDEO_CONFERENCE_API_PREFIX = '/api/video-conferences'

const getMeetingList = () =>
  axiosInstance.get<ApiResponse<MeetingListItem[]>>(MEETING_API_PREFIX)

const getMeeting = (mtngId: number) =>
  axiosInstance.get<ApiResponse<MeetingDetail>>(
    `${MEETING_API_PREFIX}/${mtngId}`,
  )

const createMeeting = (payload: MeetingCreateRequest) =>
  axiosInstance.post<ApiResponse<MeetingDetail>>(MEETING_API_PREFIX, payload)

const updateMeeting = (mtngId: number, payload: MeetingUpdateRequest) =>
  axiosInstance.put<ApiResponse<void>>(
    `${MEETING_API_PREFIX}/${mtngId}`,
    payload,
  )

const deleteMeeting = (mtngId: number) =>
  axiosInstance.delete<ApiResponse<void>>(`${MEETING_API_PREFIX}/${mtngId}`)

const getMom = (mtngId: number) =>
  axiosInstance.get<ApiResponse<MeetingMinutesResponse>>(
    `${MEETING_API_PREFIX}/${mtngId}/minutes`,
  )
  
const createEmptyMom = (mtngId: number) =>
  axiosInstance.post<ApiResponse<number>>(
    `${MEETING_API_PREFIX}/${mtngId}/minutes`,
  )

const updateMom = (mtngId: number, payload: MeetingMinutesUpdateRequest) =>
  axiosInstance.put<ApiResponse<MeetingMinutesResponse>>(
    `${MEETING_API_PREFIX}/${mtngId}/minutes`,
    payload,
  )

const requestMomApproval = (mtngId: number) =>
  axiosInstance.post<ApiResponse<void>>(
    `${MEETING_API_PREFIX}/${mtngId}/minutes/approval`,
  )

const regenerateAiDraft = (mtngId: number) =>
  axiosInstance.post<ApiResponse<string>>(
    `${MEETING_API_PREFIX}/${mtngId}/minutes/regenerate`,
  )

const issueToken = (vconfId: number) =>
  axiosInstance.post<ApiResponse<VideoTokenResponse>>(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/token`,
  )

const leaveConf = (vconfId: number) =>
  axiosInstance.patch<ApiResponse<void>>(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/leave`,
  )

const endConf = (vconfId: number) =>
  axiosInstance.patch<ApiResponse<void>>(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/end`,
    undefined,
    { timeout: 120_000 },
  )

const uploadRcrdg = (vconfId: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)

  return axiosInstance.post<ApiResponse<void>>(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/recordings/upload`,
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120_000,
    },
  )
}

const downloadRcrdg = (vconfId: number, atchFileId: number) =>
  axiosInstance.get(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/recordings/${atchFileId}/download`,
    { responseType: 'blob' },
  )

const streamRcrdg = (vconfId: number, atchFileId: number) =>
  axiosInstance.get(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/recordings/${atchFileId}/stream`,
    { responseType: 'blob' },
  )

const transcribe = (vconfId: number, audioChunk: Blob) => {
  const formData = new FormData()
  formData.append('audio', audioChunk, 'chunk.webm')

  return axiosInstance.post<ApiResponse<string>>(
    `${VIDEO_CONFERENCE_API_PREFIX}/${vconfId}/stt`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )
}

export const meetingApi = {
  getMeetingList,
  getMeeting,
  createMeeting,
  updateMeeting,
  deleteMeeting,
  getMom,
  createEmptyMom,
  updateMom,
  requestMomApproval,
  regenerateAiDraft,
  issueToken,
  leaveConf,
  endConf,
  uploadRcrdg,
  downloadRcrdg,
  streamRcrdg,
  transcribe,
}
