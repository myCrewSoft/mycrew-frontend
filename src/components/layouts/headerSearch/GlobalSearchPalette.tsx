import {
  BookOpen,
  CalendarDays,
  CheckSquare,
  Clock3,
  FolderKanban,
  Mail,
  Search,
  Video,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchApi } from '../../../api/searchApi'
import { useApi } from '../../../hooks/useApi'
import type {
  SearchResponseDto,
  SearchType,
} from '../../../types/search.dto'
import IconButton from '../../common/button/IconButton'
import Badge from '../../common/dataDisplay/badge/Badge'

interface GlobalSearchPaletteProps {
  open: boolean
  onClose: () => void
}

interface GlobalSearchPaletteContentProps {
  onClose: () => void
}

const SEARCH_TYPE_ORDER: SearchType[] = [
  'PROJECT',
  'TASK',
  'SCHEDULE',
  'MEETING',
  'EDUCATION',
  'MAIL',
]

const SEARCH_TYPE_LABEL: Record<SearchType, string> = {
  PROJECT: '프로젝트',
  TASK: '업무',
  SCHEDULE: '일정',
  MEETING: '회의',
  EDUCATION: '교육',
  MAIL: '메일',
}

const getTypeIcon = (type?: SearchType) => {
  if (type === 'PROJECT') return FolderKanban
  if (type === 'TASK') return CheckSquare
  if (type === 'SCHEDULE') return CalendarDays
  if (type === 'MEETING') return Video
  if (type === 'EDUCATION') return BookOpen
  return Mail
}

const getFallbackPath = (item: SearchResponseDto) => {
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
  if (item.type === 'EDUCATION') return `/education/${id}`
  if (item.type === 'MAIL') return '/mail'

  return '/dashboard'
}

const getResultKey = (item: SearchResponseDto, index: number) =>
  `${item.type ?? 'UNKNOWN'}-${item.parentId ?? 'root'}-${item.id ?? index}`

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
  const [results, setResults] = useState<SearchResponseDto[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { loading, execute: search } = useApi(searchApi.search, {
    immediate: false,
  })

  const trimmedKeyword = keyword.trim()
  const activeItem = results[activeIndex]

  const handleOpenItem = useCallback(
    (item: SearchResponseDto) => {
      navigate(getFallbackPath(item))
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
      {} as Record<SearchType, SearchResponseDto[]>,
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
          setResults(response.data ?? [])
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
                  프로젝트, 업무, 일정, 회의, 교육, 메일을 한 번에 찾을 수 있습니다.
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
                      <p className="px-5 pb-2 text-xs font-bold text-blue-600">
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
                              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-blue-600">
                                <Icon size={17} />
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-bold text-slate-950">
                                  {item.title ?? '제목 없음'}
                                </span>
                                {item.description && (
                                  <span className="mt-0.5 block truncate text-xs text-slate-500">
                                    {item.description}
                                  </span>
                                )}
                              </span>

                              {item.badgeText && (
                                <Badge variant="neutral">
                                  {item.badgeText}
                                </Badge>
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
            <aside className="hidden w-60 shrink-0 p-5 md:block">
              {activeItem.type && (
                <Badge variant="neutral">
                  {SEARCH_TYPE_LABEL[activeItem.type]}
                </Badge>
              )}

              <h3 className="mt-4 text-base font-bold text-slate-950">
                {activeItem.title ?? '제목 없음'}
              </h3>

              {activeItem.description && (
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {activeItem.description}
                </p>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Clock3 size={14} />
                <span>Enter를 누르면 상세 화면으로 이동합니다.</span>
              </div>

              <button
                type="button"
                onClick={() => handleOpenItem(activeItem)}
                className="mt-5 h-10 w-full rounded-xl border border-blue-500 bg-blue-50 text-sm font-bold text-blue-700 transition-colors hover:bg-blue-100"
              >
                상세 보기
              </button>
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
