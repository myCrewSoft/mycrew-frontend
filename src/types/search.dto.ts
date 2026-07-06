import type { components } from './generated'

type GeneratedSearchResponse = components['schemas']['SearchResponse']
type SearchResponseBase = Omit<GeneratedSearchResponse, 'type' | 'details'>

type SearchResponseByType<
  TType extends GeneratedSearchResponse['type'],
  TDetails extends GeneratedSearchResponse['details'],
> = SearchResponseBase & {
  type: TType
  details: TDetails
}

/**
 * `type`과 `details`를 연결한 통합 검색 응답 타입입니다.
 *
 * 예를 들어 type이 TASK로 좁혀지면 details도 자동으로
 * TaskSearchDetails 타입으로 좁혀집니다.
 */
export type SearchResponseDto =
  | SearchResponseByType<
      'PROJECT',
      components['schemas']['ProjectSearchDetails']
    >
  | SearchResponseByType<
      'TASK',
      components['schemas']['TaskSearchDetails']
    >
  | SearchResponseByType<
      'SCHEDULE',
      components['schemas']['ScheduleSearchDetails']
    >
  | SearchResponseByType<
      'MEETING',
      components['schemas']['MeetingSearchDetails']
    >
  | SearchResponseByType<
      'EDUCATION',
      components['schemas']['EducationSearchDetails']
    >
  | SearchResponseByType<'MAIL', components['schemas']['MailSearchDetails']>

export type SearchType = SearchResponseDto['type']
