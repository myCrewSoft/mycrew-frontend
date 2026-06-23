import {
  CalendarDays,
  CheckSquare,
  FolderKanban,
  Mail,
  Search,
  Video,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { useNavigate } from 'react-router-dom'
import { searchApi } from '../../../api/searchApi'
import { useApi } from '../../../hooks/useApi'
import type {
  SearchResponseDto,
  SearchType,
} from '../../../types/search.dto'
import IconButton from '../../common/button/IconButton'

interface GlobalSearchPaletteProps {
  open: boolean
  onClose: () => void
}

interface GlobalSearchPaletteContentProps {
  onClose: () => void
}

type DisplayedSearchType = Exclude<SearchType, 'EDUCATION'>
type DisplayedSearchResponseDto = Extract<
  SearchResponseDto,
  { type: DisplayedSearchType }
>

const isDisplayedSearchResult = (
  item: SearchResponseDto,
): item is DisplayedSearchResponseDto => item.type !== 'EDUCATION'

const SEARCH_TYPE_ORDER: DisplayedSearchType[] = [
  'PROJECT',
  'TASK',
  'SCHEDULE',
  'MEETING',
  'MAIL',
]

const SEARCH_TYPE_LABEL: Record<DisplayedSearchType, string> = {
  PROJECT: '프로젝트',
  TASK: '업무',
  SCHEDULE: '일정',
  MEETING: '회의',
  MAIL: '메일',
}

const SEARCH_BADGE_STYLE: Record<DisplayedSearchType, string> = {
  PROJECT: 'border-blue-200 bg-blue-50 text-blue-700',
  TASK: 'border-amber-200 bg-amber-50 text-amber-700',
  SCHEDULE: 'border-violet-200 bg-violet-50 text-violet-700',
  MEETING: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  MAIL: 'border-sky-200 bg-sky-50 text-sky-700',
}

const SEARCH_TYPE_HEADER_STYLE: Record<DisplayedSearchType, string> = {
  PROJECT: 'text-blue-600',
  TASK: 'text-amber-600',
  SCHEDULE: 'text-violet-600',
  MEETING: 'text-cyan-600',
  MAIL: 'text-indigo-600',
}

const SEARCH_TYPE_ICON_STYLE: Record<DisplayedSearchType, string> = {
  PROJECT: 'bg-blue-50 text-blue-600',
  TASK: 'bg-amber-50 text-amber-600',
  SCHEDULE: 'bg-violet-50 text-violet-600',
  MEETING: 'bg-cyan-50 text-cyan-600',
  MAIL: 'bg-indigo-50 text-indigo-600',
}

const formatDate = (value?: string | null) => {
  if (!value) return ''

  const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (dateOnlyMatch) {
    return `${dateOnlyMatch[1]}.${dateOnlyMatch[2]}.${dateOnlyMatch[3]}`
  }

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\s/g, '')
}

const formatDateTime = (value?: string | null) => {
  if (!value) return ''

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const formatRange = (
  start?: string | null,
  end?: string | null,
  formatter: (value?: string | null) => string = formatDate,
) => {
  const formattedStart = formatter(start)
  const formattedEnd = formatter(end)

  if (formattedStart && formattedEnd) {
    return `${formattedStart} ~ ${formattedEnd}`
  }

  return formattedStart || formattedEnd
}

const getResultMeta = (item: DisplayedSearchResponseDto) => {
  if (item.type === 'PROJECT') return item.details?.statusName ?? ''
  if (item.type === 'TASK') return formatDate(item.details?.dueDate)
  if (item.type === 'SCHEDULE') {
    return formatDateTime(item.details?.startDateTime)
  }
  if (item.type === 'MEETING') {
    return item.details?.statusName ?? formatDateTime(item.details?.startDateTime)
  }
  return formatDateTime(item.details?.receivedAt)
}

const getTypeIcon = (type?: DisplayedSearchType) => {
  if (type === 'PROJECT') return FolderKanban
  if (type === 'TASK') return CheckSquare
  if (type === 'SCHEDULE') return CalendarDays
  if (type === 'MEETING') return Video
  return Mail
}

const getFallbackPath = (item: DisplayedSearchResponseDto) => {
  const id = item.id

  if (item.type === 'PROJECT') return `/project/${id}`

  if (item.type === 'TASK') {
    const projectId = item.parentId
    const taskId = id

    if (!projectId) {
      return '/project'
    }

    return `/project/${projectId}?tab=tasks&taskId=${taskId}`
  }

  if (item.type === 'SCHEDULE') return `/calendar?scheduleId=${id}`
  if (item.type === 'MEETING') return '/meeting/scheduled'
  if (item.type === 'MAIL') return '/mail'

  return '/dashboard'
}

const getResultKey = (item: DisplayedSearchResponseDto, index: number) =>
  `${item.type ?? 'UNKNOWN'}-${item.parentId ?? 'root'}-${item.id ?? index}`

interface PreviewFieldProps {
  label: string
  value?: ReactNode
}

const PreviewField = ({ label, value }: PreviewFieldProps) => {
  if (value === null || value === undefined || value === '') {
    return null
  }

  return (
    <div className="grid grid-cols-[72px_minmax(0,1fr)] gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <dt className="text-xs font-semibold text-slate-500">{label}</dt>
      <dd className="min-w-0 break-words text-right text-xs font-bold text-slate-800">
        {value}
      </dd>
    </div>
  )
}

const SearchPreviewDetails = ({ item }: { item: DisplayedSearchResponseDto }) => {
  if (!item.details) return null

  if (item.type === 'PROJECT') {
    const details = item.details

    return (
      <>
        <PreviewField label="상태" value={details.statusName} />
        <PreviewField label="담당자" value={details.managerName} />
        <PreviewField
          label="기간"
          value={formatRange(details.startDate, details.endDate)}
        />
        <PreviewField
          label="진행률"
          value={
            details.progress !== null && details.progress !== undefined
              ? `${details.progress}%`
              : undefined
          }
        />
      </>
    )
  }

  if (item.type === 'TASK') {
    const details = item.details

    return (
      <>
        <PreviewField label="프로젝트" value={details.projectName} />
        <PreviewField label="담당자" value={details.managerName} />
        <PreviewField label="상태" value={details.statusName} />
        <PreviewField label="우선순위" value={details.priorityName} />
        <PreviewField label="마감일" value={formatDate(details.dueDate)} />
      </>
    )
  }

  if (item.type === 'SCHEDULE') {
    const details = item.details

    return (
      <>
        <PreviewField
          label="일시"
          value={formatRange(
            details.startDateTime,
            details.endDateTime,
            formatDateTime,
          )}
        />
        <PreviewField
          label="종일"
          value={
            typeof details.allDay === 'boolean'
              ? details.allDay
                ? '예'
                : '아니오'
              : undefined
          }
        />
        <PreviewField label="작성자" value={details.writerName} />
        <PreviewField label="분류" value={details.classificationName} />
      </>
    )
  }

  if (item.type === 'MEETING') {
    const details = item.details

    return (
      <>
        <PreviewField
          label="일시"
          value={formatRange(
            details.startDateTime,
            details.endDateTime,
            formatDateTime,
          )}
        />
        <PreviewField label="주최자" value={details.hostName} />
        <PreviewField label="상태" value={details.statusName} />
        <PreviewField
          label="참여 인원"
          value={
            details.participantCount !== null &&
            details.participantCount !== undefined
              ? `${details.participantCount}명`
              : undefined
          }
        />
        <PreviewField
          label="진행 방식"
          value={
            typeof details.online === 'boolean'
              ? details.online
                ? '온라인'
                : '오프라인'
              : undefined
          }
        />
        <PreviewField label="회의 유형" value={details.meetingTypeName} />
      </>
    )
  }

  const details = item.details
  const sender = [details.senderName, details.senderAddress]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <PreviewField label="발신자" value={sender} />
      <PreviewField label="수신 일시" value={formatDateTime(details.receivedAt)} />
      <PreviewField
        label="읽음 상태"
        value={
          typeof details.read === 'boolean'
            ? details.read
              ? '읽음'
              : '읽지 않음'
            : undefined
        }
      />
      <PreviewField
        label="첨부파일"
        value={
          typeof details.hasAttachment === 'boolean'
            ? details.hasAttachment
              ? '있음'
              : '없음'
            : undefined
        }
      />
      <PreviewField label="본문 미리보기" value={details.bodyPreview} />
    </>
  )
}

const GlobalSearchPalette = ({ open, onClose }: GlobalSearchPaletteProps) => {
  if (!open) {
    return null
  }

  return <GlobalSearchPaletteContent onClose={onClose} />
}

const GlobalSearchPaletteContent = ({
  onClose,
}: GlobalSearchPaletteContentProps) => {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<DisplayedSearchResponseDto[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { loading, execute: search } = useApi(searchApi.search, {
    immediate: false,
  })

  const trimmedKeyword = keyword.trim()
  const activeItem = results[activeIndex]
  const hasActiveDetails = activeItem
    ? Object.values(activeItem.details ?? {}).some(
        (value) => value !== null && value !== undefined && value !== '',
      )
    : false

  const handleOpenItem = useCallback(
    (item: DisplayedSearchResponseDto) => {
      const backendUrl = item.url?.trim()
      navigate(backendUrl || getFallbackPath(item))
      onClose()
    },
    [navigate, onClose],
  )

  const groupedResults = useMemo(() => {
    return SEARCH_TYPE_ORDER.reduce(
      (groups, type) => {
        groups[type] = results.filter((item) => item.type === type)
        return groups
      },
      {} as Record<DisplayedSearchType, DisplayedSearchResponseDto[]>,
    )
  }, [results])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!trimmedKeyword) {
        setResults([])
        setActiveIndex(0)
        return
      }

      void search(trimmedKeyword)
        .then((response) => {
          setResults((response.data ?? []).filter(isDisplayedSearchResult))
          setActiveIndex(0)
        })
        .catch(() => {
          setResults([])
          setActiveIndex(0)
        })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search, trimmedKeyword])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveIndex((current) =>
          Math.min(current + 1, Math.max(results.length - 1, 0)),
        )
        return
      }

      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveIndex((current) => Math.max(current - 1, 0))
        return
      }

      if (event.key === 'Tab') {
        event.preventDefault()
        setPreviewOpen((current) => !current)
        return
      }

      if (event.key === 'Enter' && activeItem) {
        event.preventDefault()
        handleOpenItem(activeItem)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeItem, handleOpenItem, onClose, results.length])

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/30 px-4 py-16">
      <section
        className="mx-auto flex max-h-[78vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
        aria-label="통합 검색"
      >
        <div className="flex h-16 items-center gap-3 border-b border-slate-200 px-5">
          <Search size={20} className="text-slate-500" />

          <input
            autoFocus
            value={keyword}
            onChange={(event) => {
              setKeyword(event.target.value)
              setActiveIndex(0)
            }}
            placeholder="검색어를 입력하세요..."
            className="h-full min-w-0 flex-1 bg-transparent text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400"
          />

          <kbd className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-500">
            ESC
          </kbd>

          <IconButton size="xs" aria-label="검색 닫기" onClick={onClose}>
            <X size={15} />
          </IconButton>
        </div>

        <div className="flex min-h-0 flex-1">
          <div
            className={`min-h-0 flex-1 overflow-y-auto ${
              previewOpen ? 'border-r border-slate-200' : ''
            }`}
          >
            {loading && (
              <div className="px-5 py-4 text-sm text-slate-500">
                검색 중입니다...
              </div>
            )}

            {!loading && trimmedKeyword && results.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-800">
                  검색 결과가 없습니다.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  다른 검색어로 다시 시도해 주세요.
                </p>
              </div>
            )}

            {!loading && !trimmedKeyword && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-800">
                  검색어를 입력해 주세요.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  프로젝트, 업무, 일정, 회의, 메일을 한 번에 찾을 수 있습니다.
                </p>
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="py-3">
                {SEARCH_TYPE_ORDER.map((type) => {
                  const sectionItems = groupedResults[type]

                  if (sectionItems.length === 0) {
                    return null
                  }

                  return (
                    <div key={type} className="mb-3 last:mb-0">
                      <p
                        className={`px-5 pb-2 text-xs font-bold ${SEARCH_TYPE_HEADER_STYLE[type]}`}
                      >
                        {SEARCH_TYPE_LABEL[type]} {sectionItems.length}
                      </p>

                      <div className="space-y-1 px-3">
                        {sectionItems.map((item, index) => {
                          const flatIndex = results.findIndex(
                            (result) =>
                              result.type === item.type &&
                              result.id === item.id &&
                              result.parentId === item.parentId,
                          )
                          const Icon = getTypeIcon(item.type)
                          const active = flatIndex === activeIndex
                          const resultMeta = getResultMeta(item)

                          return (
                            <button
                              key={getResultKey(item, index)}
                              type="button"
                              onMouseEnter={() => setActiveIndex(flatIndex)}
                              onClick={() => handleOpenItem(item)}
                              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
                                active
                                  ? 'border border-blue-500 bg-blue-50'
                                  : 'border border-transparent hover:bg-slate-50'
                              }`}
                            >
                              <span
                                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${SEARCH_TYPE_ICON_STYLE[item.type]}`}
                              >
                                <Icon size={17} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-slate-950">
                                  {item.title ?? '제목 없음'}
                                </span>
                                {item.summary?.trim() && (
                                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                                    {item.summary}
                                  </span>
                                )}
                              </span>

                              {resultMeta && (
                                <span
                                  className={`inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-xs font-bold ${SEARCH_BADGE_STYLE[item.type]}`}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full bg-current"
                                    aria-hidden="true"
                                  />
                                  {resultMeta}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {previewOpen && activeItem && (
            <aside className="hidden w-64 shrink-0 overflow-y-auto bg-slate-50/80 p-5 md:flex md:flex-col">
              <h3 className="break-words text-lg font-bold leading-7 text-slate-950">
                {activeItem.title ?? '제목 없음'}
              </h3>

              {activeItem.summary?.trim() && (
                <p className="mt-3 break-words text-sm leading-6 text-slate-600">
                  {activeItem.summary}
                </p>
              )}

              {hasActiveDetails && (
                <dl className="mt-5 rounded-xl border border-slate-200 bg-white px-3 shadow-sm">
                  <SearchPreviewDetails item={activeItem} />
                </dl>
              )}

              <div className="mt-auto pt-6">
                <button
                  type="button"
                  onClick={() => handleOpenItem(activeItem)}
                  className="h-10 w-full rounded-xl bg-blue-600 text-sm font-bold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  상세 보기
                </button>
              </div>
            </aside>
          )}
        </div>

        <div className="flex h-9 items-center gap-4 border-t border-slate-200 bg-slate-50 px-5 text-xs text-slate-500">
          <span>
            <kbd className="rounded border border-slate-300 bg-white px-1.5">
              ↑ ↓
            </kbd>{' '}
            이동
          </span>
          <span>
            <kbd className="rounded border border-slate-300 bg-white px-1.5">
              Enter
            </kbd>{' '}
            열기
          </span>
          <span>
            <kbd className="rounded border border-slate-300 bg-white px-1.5">
              Tab
            </kbd>{' '}
            미리보기
          </span>
        </div>
      </section>
    </div>
  )
}

export default GlobalSearchPalette
