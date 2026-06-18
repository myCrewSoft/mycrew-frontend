import { useMemo, useState } from 'react'
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
  DashboardVariant,
  DashboardWidgetData,
  DashboardWidgetKey,
  DashboardWidgetStateMap,
} from '../../types/dashboard'
import {
  DASHBOARD_WIDGET_CONFIG_MAP,
  DASHBOARD_WIDGETS,
  DEFAULT_DASHBOARD_LAYOUT,
} from './dashboard.config'
import { dashboardMockData } from './dashboard.mock'
import DashboardWidgetCard from './DashboardWidgetCard'
import './dashboard.css'

const DEFAULT_STORAGE_KEY = 'mycrew.dashboard.layout'
const GridLayout = WidthProvider(ReactGridLayout)

interface DashboardPageProps {
  /** 대시보드 기본 레이아웃 (미지정 시 사용자 기본 레이아웃 사용) */
  defaultLayout?: DashboardLayoutItem[]
  /** 레이아웃 저장에 사용할 localStorage 키 */
  storageKey?: string
  /** 상단 제목 */
  title?: string
  /** 상단 설명 문구 */
  description?: string
  /** 'admin'이면 관리자 전용 위젯 엔드포인트/렌더러를 사용한다. (기본 'user') */
  variant?: DashboardVariant
}

const isDashboardWidgetKey = (value: string): value is DashboardWidgetKey =>
  DASHBOARD_WIDGETS.some((widget) => widget.key === value)

const normalizeLayout = (layout: readonly LayoutItem[]): DashboardLayoutItem[] =>
  layout.flatMap((item) => {
    if (!isDashboardWidgetKey(item.i)) return []

      const config = DASHBOARD_WIDGET_CONFIG_MAP[item.i]
      return [{
        i: item.i,
        x: item.x,
        y: item.y,
        w: item.w,
        h: item.h,
        minW: config.defaultSize.minW,
        minH: config.defaultSize.minH,
        maxW: config.defaultSize.maxW,
        maxH: config.defaultSize.maxH,
      }]
    })

const getInitialLayout = (
  storageKey: string,
  fallbackLayout: DashboardLayoutItem[],
): DashboardLayoutItem[] => {
  const savedLayout = localStorage.getItem(storageKey)
  if (!savedLayout) return fallbackLayout

  try {
    const parsed = JSON.parse(savedLayout) as LayoutItem[]
    const normalized = normalizeLayout(parsed)
    return normalized.length ? normalized : fallbackLayout
  } catch {
    return fallbackLayout
  }
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
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'local'>('idle')
  const { execute: saveLayout, loading: saving } = useApi(dashboardApi.saveLayout, {
    immediate: false,
  })
  const { execute: resetRemoteLayout } = useApi(dashboardApi.resetLayout, {
    immediate: false,
  })

  const activeWidgetKeys = useMemo(
    () => new Set(layout.map((item) => item.i)),
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

  const availableWidgets = useMemo(
    () => DASHBOARD_WIDGETS.filter((widget) => !activeWidgetKeys.has(widget.key)),
    [activeWidgetKeys],
  )

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

  const handleSave = async () => {
    localStorage.setItem(storageKey, JSON.stringify(layout))

    try {
      await saveLayout({ layoutJson: layout })
      setSaveStatus('saved')
    } catch {
      setSaveStatus('local')
    }
  }

  const handleReset = async () => {
    setLayout(defaultLayout)
    localStorage.removeItem(storageKey)
    setSaveStatus('idle')

    try {
      await resetRemoteLayout()
    } catch {
      return
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
              dataMap={dashboardMockData}
              editMode={editMode}
              variant={variant}
              onRemove={handleRemoveWidget}
            />
          </div>
        ))}
      </GridLayout>
    </div>
  )
}

export default DashboardPage
