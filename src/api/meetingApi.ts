import axiosInstance from './axiosInstance'
import type { ApiResponse } from './axiosInstance'
import type {
  CreateInstantMeetingRequest,
  CreateScheduledMeetingRequest,
  MeetingListParams,
  MeetingSummaryResponse,
} from '../types/meeting.dto'

// 화상회의 목록을 조회합니다.
// 백엔드가 준비되면 /api/v1/meetings?status=live 같은 형태로 바로 호출됩니다.
const getMeetings = (params?: MeetingListParams) => {
  return axiosInstance.get<ApiResponse<MeetingSummaryResponse[]>>('/meetings', {
    params,
  })
}

// 화상회의 상세 정보를 조회합니다.
// 지금 화면은 목록 DTO만으로 모달을 열지만, 백엔드 상세 API가 준비되면 이 함수를 연결하면 됩니다.
const getMeeting = (meetingId: number) => {
  return axiosInstance.get<ApiResponse<MeetingSummaryResponse>>(
    `/meetings/${meetingId}`,
  )
}

// "지금 바로 회의 시작" 버튼에서 사용할 즉시 회의 생성 API입니다.
// 백엔드 구현 전에는 화면에서 실패를 조용히 처리하고, 구현 후에는 inviteUrl로 입장시키면 됩니다.
const createInstantMeeting = (payload: CreateInstantMeetingRequest) => {
  return axiosInstance.post<ApiResponse<MeetingSummaryResponse>>(
    '/meetings',
    payload,
  )
}

// 예약 회의를 생성합니다.
// 즉시 회의와 같은 POST /meetings를 쓰되, 날짜/시간이 포함된 payload를 보냅니다.
const createScheduledMeeting = (payload: CreateScheduledMeetingRequest) => {
  return axiosInstance.post<ApiResponse<MeetingSummaryResponse>>(
    '/meetings',
    payload,
  )
}

export const meetingApi = {
  getMeetings,
  getMeeting,
  createInstantMeeting,
  createScheduledMeeting,
}
