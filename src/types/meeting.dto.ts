// 서버의 mtngSttus 값을 별도 코드 변환 없이 그대로 사용합니다.
import type { components } from './generated'

export type MeetingStatus = 'scheduled' | 'live' | 'ended'
export type MeetingTypeCode = '01' | '02' | '03'

type GeneratedMeetingListItem = components['schemas']['MtngListResponse']
type GeneratedMeetingDetail = components['schemas']['MtngDetailResponse']
type GeneratedMeetingParticipant = components['schemas']['MtngPtcptResponse']
type GeneratedMeetingCreateRequest = components['schemas']['MtngCreateRequest']
type GeneratedMeetingUpdateRequest = components['schemas']['MtngUpdateRequest']
type GeneratedMeetingMinutes = components['schemas']['MtngMomResponse']

// 서버 문자열 상태를 화면에서 허용하는 값으로 좁힙니다.
export type MeetingListItem = Omit<GeneratedMeetingListItem, 'mtngSttus'> & {
  mtngSttus: MeetingStatus
}

export type MeetingParticipant = GeneratedMeetingParticipant

export type MeetingDetail = Omit<
  GeneratedMeetingDetail,
  'mtngSttus' | 'ptcptList'
> & {
  mtngSttus: MeetingStatus
  ptcptList: MeetingParticipant[]
}

export type MeetingCreateRequest = Omit<
  GeneratedMeetingCreateRequest,
  'confRmId' | 'mtngTypeCd'
> & {
  confRmId: number | null
  mtngTypeCd: MeetingTypeCode
}

export type MeetingUpdateRequest = Omit<
  GeneratedMeetingUpdateRequest,
  'confRmId' | 'mtngTypeCd'
> & {
  confRmId: number | null
  mtngTypeCd: MeetingTypeCode
}

export type MeetingMinutesResponse = GeneratedMeetingMinutes

export type MeetingMinutesUpdateRequest =
  components['schemas']['MtngMomUpdateRequest']
