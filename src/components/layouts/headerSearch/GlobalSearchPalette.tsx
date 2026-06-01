import {
  CalendarDays,
  Clock3,
  FileText,
  Folder,
  Search,
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

// Backend search API is not ready yet, so the first UI pass uses mock data.
// When /search is ready, change this to false and remove the mock branch later.
const USE_MOCK_DATA = true

const MOCK_SEARCH_RESULTS: SearchResponseDto[] = [
  {
    id: 1,
    type: 'schedule',
    title: '3분기 전략 회의',
    description: '2025.05.22 14:00 · 한라 회의실',
    badgeText: 'D-2',
    path: '/calendar',
  },
  {
    id: 2,
    type: 'schedule',
    title: '연간 전략 기획 보고',
    description: '2025.06.01 10:00',
    path: '/calendar',
  },
  {
    id: 3,
    type: 'board',
    title: '2025 전략 방향 공유 (개발팀)',
    description: '게시판 · 김민준 · 3일 전',
    path: '/boards/3',
  },
  {
    id: 4,
    type: 'board',
    title: '마케팅 전략 초안 공유',
    description: '게시판 · 이서연 · 5일 전',
    path: '/boards/4',
  },
  {
    id: 5,
    type: 'document',
    title: '사업 전략_v2.pptx',
    description: '드라이브 · 5.2MB · 1주 전',
    path: '/drive/5',
  },
]

const SEARCH_TYPE_LABEL: Record<SearchType, string> = {
  schedule: '일정',
  board: '게시글',
  document: '문서',
}

const getTypeIcon = (type: SearchType) => {
  if (type === 'schedule') return CalendarDays
  if (type === 'board') return FileText
  return Folder
}

// Backend may return a path later. Until then, the frontend can derive a route.
const getFallbackPath = (item: SearchResponseDto) => {
  if (item.type === 'schedule') return `/calendar?scheduleId=${item.id}`
  if (item.type === 'board') return `/boards/${item.id}`
  return `/drive/${item.id}`
}

const GlobalSearchPalette = ({ open, onClose }: GlobalSearchPaletteProps) => {
  if (!open) {
    return null
  }

  // Mount content only while open so local state resets naturally on next open.
  return <GlobalSearchPaletteContent onClose={onClose} />
}

const GlobalSearchPaletteContent = ({
  onClose,
}: GlobalSearchPaletteContentProps) => {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [apiResults, setApiResults] = useState<SearchResponseDto[]>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [previewOpen, setPreviewOpen] = useState(false)

  const { loading, execute: search } = useApi(searchApi.search, {
    immediate: false,
  })

  const trimmedKeyword = keyword.trim()

  // Mock search keeps the UI usable before backend integration.
  const mockResults = useMemo(() => {
    if (!trimmedKeyword) {
      return MOCK_SEARCH_RESULTS.slice(0, 3)
    }

    return MOCK_SEARCH_RESULTS.filter((item) => {
      const target = `${item.title} ${item.description ?? ''}`.toLowerCase()
      return target.includes(trimmedKeyword.toLowerCase())
    })
  }, [trimmedKeyword])

  const results = USE_MOCK_DATA ? mockResults : apiResults
  const activeItem = results[activeIndex]

  const handleOpenItem = useCallback(
    (item: SearchResponseDto) => {
      navigate(item.path ?? getFallbackPath(item))
      onClose()
    },
    [navigate, onClose],
  )

  const groupedResults = useMemo(() => {
    return {
      schedule: results.filter((item) => item.type === 'schedule'),
      board: results.filter((item) => item.type === 'board'),
      document: results.filter((item) => item.type === 'document'),
    }
  }, [results])

  // This effect is only for the real backend branch. setState happens inside
  // the timer callback, not synchronously in the effect body.
  useEffect(() => {
    if (USE_MOCK_DATA) return

    const timer = window.setTimeout(() => {
      if (!trimmedKeyword) {
        setApiResults([])
        setActiveIndex(0)
        return
      }

      void search(trimmedKeyword)
        .then((response) => {
          setApiResults(response.data ?? [])
          setActiveIndex(0)
        })
        .catch(() => {
          setApiResults([])
          setActiveIndex(0)
        })
    }, 250)

    return () => window.clearTimeout(timer)
  }, [search, trimmedKeyword])

  // Keyboard events are an external subscription, so updating state in the
  // event callback is safe and keeps arrow/enter/tab controls responsive.
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
            {loading && !USE_MOCK_DATA && (
              <div className="px-5 py-4 text-sm text-slate-500">
                검색 중입니다...
              </div>
            )}

            {(!loading || USE_MOCK_DATA) && results.length === 0 && (
              <div className="px-5 py-10 text-center">
                <p className="text-sm font-bold text-slate-800">
                  검색 결과가 없습니다.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  다른 검색어로 다시 시도해 주세요.
                </p>
              </div>
            )}

            {(!loading || USE_MOCK_DATA) && results.length > 0 && (
              <div className="py-3">
                {!trimmedKeyword && (
                  <p className="px-5 pb-2 text-xs font-bold text-slate-500">
                    최근 항목
                  </p>
                )}

                {(['schedule', 'board', 'document'] as SearchType[]).map(
                  (type) => {
                    const sectionItems = groupedResults[type]

                    if (sectionItems.length === 0) {
                      return null
                    }

                    return (
                      <div key={type} className="mb-3 last:mb-0">
                        {trimmedKeyword && (
                          <p className="px-5 pb-2 text-xs font-bold text-blue-600">
                            {SEARCH_TYPE_LABEL[type]} {sectionItems.length}
                          </p>
                        )}

                        <div className="space-y-1 px-3">
                          {sectionItems.map((item) => {
                            const flatIndex = results.findIndex(
                              (result) =>
                                result.type === item.type &&
                                result.id === item.id,
                            )
                            const Icon = getTypeIcon(item.type)
                            const active = flatIndex === activeIndex

                            return (
                              <button
                                key={`${item.type}-${item.id}`}
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
                                    {item.title}
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
                  },
                )}
              </div>
            )}
          </div>

          {previewOpen && activeItem && (
            <aside className="hidden w-60 shrink-0 p-5 md:block">
              <Badge variant="neutral">
                {SEARCH_TYPE_LABEL[activeItem.type]}
              </Badge>

              <h3 className="mt-4 text-base font-bold text-slate-950">
                {activeItem.title}
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
