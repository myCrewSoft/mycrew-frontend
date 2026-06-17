import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, RotateCcw, Save, SlidersHorizontal } from 'lucide-react'
import {
  ReactGridLayout,
  WidthProvider,
  type Layout,
  type LayoutItem,
} from 'react-grid-layout/legacy'
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
  DashboardWidgetKey,
  DashboardWidgetStateMap,
} from '../../types/dashboard'
import {
  DASHBOARD_WIDGET_CONFIG_MAP,
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from './dashboard.config'
import DashboardWidgetCard from './DashboardWidgetCard'
import './dashboard.css'

const DEFAULT_STORAGE_KEY = 'mycrew.dashboard.layout'
const GridLayout = WidthProvider(ReactGridLayout)

interface DashboardPageProps {
  defaultLayout?: DashboardLayoutItem[]
  storageKey?: string
  title?: string
  description?: string
}

const isDashboardWidgetKey = (value: string): value is DashboardWidgetKey =>
  DASHBOARD_WIDGETS.some((widget) => widget.key === value)

const withWidgetConstraints = (
  item: Omit<DashboardLayoutItem, 'minW' | 'minH' | 'maxW' | 'maxH'>,
): DashboardLayoutItem => {
  const config = DASHBOARD_WIDGET_CONFIG_MAP[item.i]
  return {
    ...item,
    minW: config.defaultSize.minW,
    minH: config.defaultSize.minH,
    maxW: config.defaultSize.maxW,
    maxH: config.defaultSize.maxH,
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

const useDashboardWidgetData = (
  activeWidgetKeys: DashboardWidgetKey[],
  boardType: DashboardBoardType,
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
        const response = await dashboardApi.getWidget(widgetKey, boardType)
        setWidgetStates((current) => ({
          ...current,
          [widgetKey]: {
            data: response.data.data ?? null,
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
    [boardType],
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
}: DashboardPageProps = {}) => {
  const [editMode, setEditMode] = useState(false)
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(() =>
    getInitialLayout(storageKey, defaultLayout),
  )
  const [boardType, setBoardType] = useState<DashboardBoardType>('NOTICE')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'local'>('idle')

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
    setLayout(normalizeLayout(currentLayout))
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
      className={`dashboard-page mx-auto flex max-w-[1440px] flex-col gap-5 ${
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

      <GridLayout
        className="layout"
        layout={layout}
        cols={12}
        rowHeight={76}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        isDraggable={editMode}
        isResizable={editMode}
        draggableCancel=".dashboard-widget-action, a, button, input, textarea, select"
        resizeHandles={['se']}
        onLayoutChange={handleLayoutChange}
      >
        {layout.map((item) => (
          <div key={item.i} data-grid={item}>
            <DashboardWidgetCard
              widgetKey={item.i}
              widgetState={widgetStates[item.i]}
              boardType={boardType}
              editMode={editMode}
              onRemove={handleRemoveWidget}
              onBoardTypeChange={setBoardType}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  )
}

export default DashboardPage
