import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, SlidersHorizontal } from 'lucide-react'
import ReactGridLayout, {
  useContainerWidth,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout'
import 'react-grid-layout/css/styles.css'
import 'react-resizable/css/styles.css'
import Button from '../../components/common/button/Button'
import { dashboardApi } from '../../api/dashboardApi'
import { useApi } from '../../hooks/useApi'
import type {
  DashboardBoardType,
  DashboardLayoutItem,
  DashboardLayoutJson,
  DashboardServerLayoutItem,
  DashboardVariant,
  DashboardWidgetKey,
} from '../../types/dashboard'
import type {
  DashboardWidgetData,
  DashboardWidgetStateMap,
} from '../../types/dashboard-widget'
import {
  DASHBOARD_WIDGET_CONFIG_MAP,
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from './dashboard.config'
import DashboardWidgetCard from './DashboardWidgetCard'
import './dashboard.css'

const DEFAULT_STORAGE_KEY = 'mycrew.dashboard.layout'
const DASHBOARD_GRID_MARGIN = [16, 16] as const
const DASHBOARD_GRID_CONTAINER_PADDING = [0, 0] as const
const DASHBOARD_GRID_RESIZE_HANDLES = ['se'] as const
const DASHBOARD_GRID_DRAG_CANCEL =
  '.dashboard-widget-action, a, button, input, textarea, select'
const EMPTY_WIDGET_MIN_HEIGHT = 1

interface DashboardPageProps {
  defaultLayout?: DashboardLayoutItem[]
  storageKey?: string
  title?: string
  description?: string
  /** 'admin'이면 관리자 전용 위젯 엔드포인트/렌더러를 사용한다. (기본 'user') */
  variant?: DashboardVariant
}

const isDashboardWidgetKey = (value: string): value is DashboardWidgetKey =>
  DASHBOARD_WIDGETS.some((widget) => widget.key === value)

const withWidgetConstraints = (
  item: Omit<DashboardLayoutItem, 'minW' | 'minH' | 'maxW' | 'maxH'>,
): DashboardLayoutItem => {
  const config = DASHBOARD_WIDGET_CONFIG_MAP[item.i]
  const { minW, minH, maxW, maxH } = config.defaultSize
  return {
    ...item,
    w: Math.max(item.w, minW),
    h: Math.max(item.h, minH),
    minW,
    minH,
    maxW,
    maxH,
  }
}

const normalizeLayout = (layout: readonly LayoutItem[]): DashboardLayoutItem[] =>
  layout.flatMap((item) => {
    if (!isDashboardWidgetKey(item.i)) return []

    return [
      withWidgetConstraints({
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
      }),
    ]
  })

const normalizeServerLayout = (
  widgets: readonly DashboardServerLayoutItem[],
): DashboardLayoutItem[] =>
  widgets.flatMap((widget) => {
    if (!isDashboardWidgetKey(widget.key)) return []

    return [
      withWidgetConstraints({
        i: widget.key,
        x: widget.x,
        y: widget.y,
        w: widget.w,
        h: widget.h,
      }),
    ]
  })

const toServerLayoutJson = (layout: DashboardLayoutItem[]): DashboardLayoutJson => ({
  widgets: layout.map(({ i, x, y, w, h }) => ({
    key: i,
    x,
    y,
    w,
    h,
  })),
})

const parseLayoutJson = (
  value: string | null | undefined,
  fallbackLayout: DashboardLayoutItem[],
): DashboardLayoutItem[] => {
  if (!value) return fallbackLayout

  try {
    const parsed = JSON.parse(value) as Partial<DashboardLayoutJson> | LayoutItem[]

    if (Array.isArray(parsed)) {
      const normalized = normalizeLayout(parsed)
      return normalized.length ? normalized : fallbackLayout
    }

    if (Array.isArray(parsed.widgets)) {
      const normalized = normalizeServerLayout(parsed.widgets)
      return normalized.length ? normalized : fallbackLayout
    }

    return fallbackLayout
  } catch {
    return fallbackLayout
  }
}

const getInitialLayout = (
  storageKey: string,
  fallbackLayout: DashboardLayoutItem[],
): DashboardLayoutItem[] => {
  const savedLayout = localStorage.getItem(storageKey)
  return parseLayoutJson(savedLayout, fallbackLayout)
}

const getNextPosition = (layout: DashboardLayoutItem[]) => {
  const maxY = layout.reduce((nextY, item) => Math.max(nextY, item.y + item.h), 0)
  return { x: 0, y: maxY }
}

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : '위젯 데이터를 불러오지 못했습니다.'

const isAdminDashboard = (variant: DashboardVariant): boolean => variant === 'admin'

const hasItems = (data: DashboardWidgetData, key: string) => {
  const value = (data as unknown as Record<string, unknown>)[key]
  return Array.isArray(value) && value.length > 0
}

const isWidgetDataEmpty = (
  widgetKey: DashboardWidgetKey,
  data: DashboardWidgetData | null | undefined,
  variant: DashboardVariant,
) => {
  if (isAdminDashboard(variant)) return false
  if (!data) return true

  if (variant === 'admin') {
    switch (widgetKey) {
      case 'attendance':
        return !hasItems(data, 'employees')
      case 'todaySchedule':
        return !hasItems(data, 'schedules')
      case 'projectProgress':
        return !hasItems(data, 'statusCounts')
      case 'board':
        return !hasItems(data, 'notices')
      default:
        break
    }
  }

  switch (widgetKey) {
    case 'approval':
      return !hasItems(data, 'documents')
    case 'todaySchedule':
      return !hasItems(data, 'schedules')
    case 'meeting':
      return !hasItems(data, 'meetings')
    case 'reservation':
      return !hasItems(data, 'reservations')
    case 'task':
      return !hasItems(data, 'tasks')
    case 'projectProgress':
      return !hasItems(data, 'projects')
    case 'board':
      return !hasItems(data, 'posts')
    case 'mail':
      return !hasItems(data, 'mails')
    case 'messenger':
      return !hasItems(data, 'rooms')
    case 'notification': {
      const notificationData = data as DashboardWidgetData & { count?: number }
      return !hasItems(data, 'notifications') || (notificationData.count ?? 0) <= 0
    }
    default:
      return false
  }
}

const getResolvedLayoutItem = (
  item: DashboardLayoutItem,
  widgetStates: DashboardWidgetStateMap,
  variant: DashboardVariant,
  collapseEmpty: boolean,
): DashboardLayoutItem => {
  const config = DASHBOARD_WIDGET_CONFIG_MAP[item.i]
  const widgetState = widgetStates[item.i]

  if (!widgetState || widgetState.error) {
    return withWidgetConstraints(item)
  }

  if (widgetState.data && isWidgetDataEmpty(item.i, widgetState.data, variant)) {
    return {
      ...item,
      h: collapseEmpty ? EMPTY_WIDGET_MIN_HEIGHT : Math.max(item.h, EMPTY_WIDGET_MIN_HEIGHT),
      minH: EMPTY_WIDGET_MIN_HEIGHT,
      minW: config.defaultSize.minW,
      maxW: config.defaultSize.maxW,
      maxH: config.defaultSize.maxH,
    }
  }

  if (widgetState.loading) {
    return withWidgetConstraints(item)
  }

  if (!widgetState.data) {
    return {
      ...item,
      h: collapseEmpty ? EMPTY_WIDGET_MIN_HEIGHT : Math.max(item.h, EMPTY_WIDGET_MIN_HEIGHT),
      minH: EMPTY_WIDGET_MIN_HEIGHT,
      minW: config.defaultSize.minW,
      maxW: config.defaultSize.maxW,
      maxH: config.defaultSize.maxH,
    }
  }

  return withWidgetConstraints(item)
}

const useDashboardWidgetData = (
  activeWidgetKeys: DashboardWidgetKey[],
  boardType: DashboardBoardType,
  variant: DashboardVariant,
) => {
  const [widgetStates, setWidgetStates] = useState<DashboardWidgetStateMap>({})
  const activeSignature = useMemo(
    () => [...activeWidgetKeys].sort().join('|'),
    [activeWidgetKeys],
  )

  const fetchWidget = useCallback(
    async (widgetKey: DashboardWidgetKey) => {
      setWidgetStates((current) => ({
        ...current,
        [widgetKey]: {
          data: current[widgetKey]?.data ?? null,
          loading: true,
          error: null,
        },
      }))

      try {
        const response =
          variant === 'admin'
            ? await dashboardApi.getAdminWidget(widgetKey, boardType)
            : await dashboardApi.getWidget(widgetKey, boardType)
        // 관리자 위젯 데이터는 렌더 시점에 관리자 타입으로 다시 캐스팅한다.
        const nextData = (response.data.data ?? null) as DashboardWidgetData | null
        setWidgetStates((current) => ({
          ...current,
          [widgetKey]: {
            data: nextData,
            loading: false,
            error: null,
          },
        }))
      } catch (error) {
        setWidgetStates((current) => ({
          ...current,
          [widgetKey]: {
            data: current[widgetKey]?.data ?? null,
            loading: false,
            error: getErrorMessage(error),
          },
        }))
      }
    },
    [boardType, variant],
  )

  useEffect(() => {
    if (!activeWidgetKeys.length) return

    void Promise.all(activeWidgetKeys.map((widgetKey) => fetchWidget(widgetKey)))
  }, [activeSignature, activeWidgetKeys, fetchWidget])

  return { widgetStates, refetchWidget: fetchWidget }
}

const DashboardPage = ({
  defaultLayout = DEFAULT_DASHBOARD_LAYOUT,
  storageKey = DEFAULT_STORAGE_KEY,
  title = '대시보드',
  description = '오늘 필요한 업무 정보를 한 화면에서 확인합니다.',
  variant = 'user',
}: DashboardPageProps = {}) => {
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(() =>
    getInitialLayout(storageKey, defaultLayout),
  )
  const [boardType, setBoardType] = useState<DashboardBoardType>('NOTICE')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'local'>('idle')
  const {
    width: gridWidth,
    containerRef: gridContainerRef,
    mounted: gridMounted,
  } = useContainerWidth({ initialWidth: 1280 })

  const { execute: fetchLayout, loading: loadingLayout } = useApi(dashboardApi.getLayout, {
    immediate: false,
  })
  const { execute: saveLayout, loading: saving } = useApi(dashboardApi.saveLayout, {
    immediate: false,
  })

  const activeWidgetKeys = useMemo(
    () => layout.map((item) => item.i),
    [layout],
  )
  const activeWidgetKeySet = useMemo(
    () => new Set(activeWidgetKeys),
    [activeWidgetKeys],
  )
  const { widgetStates } = useDashboardWidgetData(
    activeWidgetKeys,
    boardType,
    variant,
  )
  const displayLayout = useMemo(
    () =>
      layout.map((item) =>
        getResolvedLayoutItem(item, widgetStates, variant, !editMode),
      ),
    [editMode, layout, widgetStates, variant],
  )

  const availableWidgets = useMemo(
    () => DASHBOARD_WIDGETS.filter((widget) => !activeWidgetKeySet.has(widget.key)),
    [activeWidgetKeySet],
  )

  useEffect(() => {
    let ignore = false

    const loadLayout = async () => {
      try {
        const response = await fetchLayout()
        if (ignore) return

        const nextLayout = parseLayoutJson(
          response.data?.lytJsonCn,
          defaultLayout,
        )
        setLayout(nextLayout)
        localStorage.setItem(
          storageKey,
          JSON.stringify(toServerLayoutJson(nextLayout)),
        )
      } catch {
        if (!ignore) {
          setLayout(getInitialLayout(storageKey, defaultLayout))
        }
      }
    }

    void loadLayout()

    return () => {
      ignore = true
    }
  }, [defaultLayout, fetchLayout, storageKey])

  const handleLayoutChange = (currentLayout: Layout) => {
    if (!editMode) return

    setLayout(
      currentLayout.flatMap((item) => {
        if (!isDashboardWidgetKey(item.i)) return []

        const config = DASHBOARD_WIDGET_CONFIG_MAP[item.i]
        const widgetState = widgetStates[item.i]
        const emptyWidget =
          widgetState &&
          !widgetState.loading &&
          !widgetState.error &&
          isWidgetDataEmpty(item.i, widgetState.data, variant)
        const minH = emptyWidget ? EMPTY_WIDGET_MIN_HEIGHT : config.defaultSize.minH

        return [
          {
            i: item.i,
            x: item.x,
            y: item.y,
            w: Math.max(item.w, config.defaultSize.minW),
            h: Math.max(item.h, minH),
            minW: config.defaultSize.minW,
            minH,
            maxW: config.defaultSize.maxW,
            maxH: config.defaultSize.maxH,
          },
        ]
      }),
    )
    setSaveStatus('idle')
  }

  const handleAddWidget = (widgetKey: DashboardWidgetKey) => {
    const config = DASHBOARD_WIDGET_CONFIG_MAP[widgetKey]
    const nextPosition = getNextPosition(layout)
    setLayout((current) => [
      ...current,
      {
        i: widgetKey,
        x: nextPosition.x,
        y: nextPosition.y,
        ...config.defaultSize,
      },
    ])
    setSaveStatus('idle')
  }

  const handleRemoveWidget = (widgetKey: DashboardWidgetKey) => {
    setLayout((current) => current.filter((item) => item.i !== widgetKey))
    setSaveStatus('idle')
  }

  const persistLayout = async (nextLayout: DashboardLayoutItem[]) => {
    const layoutJson = toServerLayoutJson(nextLayout)
    localStorage.setItem(storageKey, JSON.stringify(layoutJson))
    await saveLayout({ lytJsonCn: JSON.stringify(layoutJson) })
  }

  const handleSave = async () => {
    try {
      await persistLayout(layout)
      setSaveStatus('saved')
    } catch {
      localStorage.setItem(storageKey, JSON.stringify(toServerLayoutJson(layout)))
      setSaveStatus('local')
    }
  }

  const handleReset = async () => {
    setLayout(defaultLayout)
    setSaveStatus('idle')

    try {
      await persistLayout(defaultLayout)
      setSaveStatus('saved')
    } catch {
      localStorage.setItem(storageKey, JSON.stringify(toServerLayoutJson(defaultLayout)))
      setSaveStatus('local')
    }
  }
  
  return (
    <div
      className={`dashboard-page flex w-full max-w-none flex-col gap-5 ${
        editMode ? 'dashboard-editing' : ''
      }`}
    >
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-950">{title}</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {saveStatus !== 'idle' && (
            <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700">
              {saveStatus === 'saved' ? '저장 완료' : '임시 저장 완료'}
            </span>
          )}
          {loadingLayout && (
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-bold text-slate-600">
              레이아웃 불러오는 중
            </span>
          )}
          <Button
            variant={editMode ? 'primary' : 'outline'}
            size="sm"
            leftIcon={<SlidersHorizontal size={16} />}
            onClick={() => setEditMode((current) => !current)}
          >
            {editMode ? '보기 모드' : '편집 모드'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RotateCcw size={16} />}
            onClick={handleReset}
          >
            초기화
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={saving}
            leftIcon={<Save size={16} />}
            onClick={handleSave}
          >
            저장
          </Button>
        </div>
      </section>

      {editMode && (
        <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-900">위젯 추가</h2>
            <span className="text-xs font-semibold text-slate-500">
              {availableWidgets.length}개 추가 가능
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {availableWidgets.map((widget) => {
              const Icon = widget.icon
              return (
                <button
                  key={widget.key}
                  type="button"
                  onClick={() => handleAddWidget(widget.key)}
                  className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition-colors hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
                >
                  <Icon size={15} />
                  {widget.title}
                  <Plus size={14} />
                </button>
              )
            })}
          </div>
        </section>
      )}

      <div ref={gridContainerRef}>
        {gridMounted && (
          <ReactGridLayout
            className="layout"
            width={gridWidth}
            layout={displayLayout}
            gridConfig={{
              cols: 12,
              rowHeight: 76,
              margin: DASHBOARD_GRID_MARGIN,
              containerPadding: DASHBOARD_GRID_CONTAINER_PADDING,
            }}
            dragConfig={{
              enabled: editMode,
              handle: '.dashboard-widget-drag-handle',
              cancel: DASHBOARD_GRID_DRAG_CANCEL,
              threshold: 0,
            }}
            resizeConfig={{
              enabled: editMode,
              handles: DASHBOARD_GRID_RESIZE_HANDLES,
            }}
            onLayoutChange={handleLayoutChange}
          >
            {displayLayout.map((item) => (
              <div key={item.i} data-grid={item}>
                <DashboardWidgetCard
                  widgetKey={item.i}
                  widgetState={widgetStates[item.i]}
                  boardType={boardType}
                  editMode={editMode}
                  variant={variant}
                  onRemove={handleRemoveWidget}
                  onBoardTypeChange={setBoardType}
                />
              </div>
            ))}
          </ReactGridLayout>
        )}
      </div>
    </div>
  )
}

export default DashboardPage
