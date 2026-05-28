import { useState } from 'react'
import { Folder, FileImage, LayoutList, LayoutGrid, ArrowUpDown, Plus, Info, X } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import Checkbox from '../../components/common/form/checkbox/Checkbox'
import DropdownMenu from '../../components/common/overlay/dropdownMenu/DropdownMenu'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Tabs from '../../components/common/tabs/Tabs'

// ─── 임시 목 데이터 (백엔드 연동 전까지 사용) ────────────────────────────
// 실제 연동 시 아래 타입과 MOCK_ITEMS를 지우고
// useApiList(() => driveApi.getMyDrive()) 로 교체하세요.

type ItemType = '01' | '02' // 01: 폴더, 02: 파일

interface DriveItem {
  driveItemId: number
  itemTypeCd: ItemType
  itemNm: string
  fileSz?: string       // 파일만
  lastMdfcnDt: string
  modifierNm?: string   // 수정한 사람
  frstRegDt: string
  bookmarkYn: 'Y' | 'N'
}

const MOCK_ITEMS: DriveItem[] = [
  {
    driveItemId: 1,
    itemTypeCd: '01',
    itemNm: '테스트',
    lastMdfcnDt: '26.05.19 15:20',
    frstRegDt: '26.05.19 15:20',
    bookmarkYn: 'N',
  },
  {
    driveItemId: 2,
    itemTypeCd: '02',
    itemNm: '1조발표용.jpg',
    fileSz: '229.3 KB',
    lastMdfcnDt: '25.12.29 16:06',
    modifierNm: '노윤하',
    frstRegDt: '26.05.15 09:47',
    bookmarkYn: 'N',
  },
]

// ─── 파일 아이콘 ────────────────────────────────────────────────────────────
const FileIcon = ({ item }: { item: DriveItem }) => {
  if (item.itemTypeCd === '01') {
    return <Folder size={20} className="text-amber-400" />
  }
  return <FileImage size={20} className="text-blue-400" />
}

// ─── 상세 패널 ──────────────────────────────────────────────────────────────
interface DetailPanelProps {
  item: DriveItem | null
  onClose: () => void
}

const DetailPanel = ({ item, onClose }: DetailPanelProps) => {
  const [detailTab, setDetailTab] = useState('info')

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
      {/* 패널 헤더 */}
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {item ? (
            <FileIcon item={item} />
          ) : (
            <Folder size={18} className="text-amber-400" />
          )}
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
            {item ? item.itemNm : '내 드라이브'}
          </span>
        </div>
        <IconButton size="sm" aria-label="닫기" onClick={onClose}>
          <X size={16} />
        </IconButton>
      </div>

      {/* 탭 */}
      <div className="px-4 pt-2">
        <Tabs
          value={detailTab}
          onChange={setDetailTab}
          items={[
            { value: 'info', label: '상세 정보' },
            { value: 'activity', label: '활동' },
          ]}
        />
      </div>

      {/* 탭 콘텐츠 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {detailTab === 'info' && (
          <div className="flex flex-col items-center gap-4">
            {/* 아이콘 미리보기 */}
            <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50">
              {item?.itemTypeCd === '02' ? (
                <FileImage size={48} className="text-blue-300" />
              ) : (
                <Folder size={48} className="text-amber-400" />
              )}
            </div>

            {/* 메타 정보 */}
            <table className="w-full text-sm">
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2 text-slate-500 w-24">종류</td>
                  <td className="py-2 text-slate-800 font-medium">
                    {item
                      ? item.itemTypeCd === '01' ? '폴더' : '파일'
                      : '내 드라이브'}
                  </td>
                </tr>
                {item?.fileSz && (
                  <tr>
                    <td className="py-2 text-slate-500">크기</td>
                    <td className="py-2 text-slate-800 font-medium">{item.fileSz}</td>
                  </tr>
                )}
                {item && (
                  <>
                    <tr>
                      <td className="py-2 text-slate-500">수정일</td>
                      <td className="py-2 text-slate-800 font-medium">{item.lastMdfcnDt}</td>
                    </tr>
                    <tr>
                      <td className="py-2 text-slate-500">생성일</td>
                      <td className="py-2 text-slate-800 font-medium">{item.frstRegDt}</td>
                    </tr>
                    {item.modifierNm && (
                      <tr>
                        <td className="py-2 text-slate-500">수정자</td>
                        <td className="py-2 text-slate-800 font-medium">{item.modifierNm}</td>
                      </tr>
                    )}
                  </>
                )}
                {!item && (
                  <tr>
                    <td className="py-2 text-slate-500">사용 용량</td>
                    <td className="py-2">
                      <button className="text-blue-500 text-sm font-medium hover:underline">
                        용량 확인
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {detailTab === 'activity' && (
          <EmptyState
            title="활동 내역이 없습니다."
            description="파일 업로드, 수정 등의 활동이 여기에 표시됩니다."
          />
        )}
      </div>
    </aside>
  )
}

// ─── 메인 페이지 ────────────────────────────────────────────────────────────
export default function DriveMyPage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedItem, setSelectedItem] = useState<DriveItem | null>(null)
  const [showPanel, setShowPanel] = useState(true)

  // 실제 연동 시 아래 목 데이터를 교체하세요
  // const { data: items, loading } = useApiList(() => driveApi.getMyDrive())
  const items = MOCK_ITEMS

  const allChecked = items.length > 0 && selectedIds.length === items.length
  const toggleAll = () =>
    setSelectedIds(allChecked ? [] : items.map((i) => i.driveItemId))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]
    )

  const handleRowClick = (item: DriveItem) => {
    setSelectedItem(item)
    setShowPanel(true)
  }

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      {/* ── 메인 영역 ── */}
      <div className="flex min-w-0 flex-1 flex-col gap-0 rounded-xl bg-white overflow-hidden">

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            {/* 전체 선택 체크박스 */}
            <Checkbox
              label=""
              checked={allChecked}
              onChange={toggleAll}
              aria-label="전체 선택"
            />
            <Button variant="primary" leftIcon={<Plus size={15} />}>
              새로 만들기
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* 정렬 */}
            <Button
              variant="outline"
              leftIcon={<ArrowUpDown size={14} />}
              size="sm"
            >
              수정한 날짜순
            </Button>

            {/* 리스트 / 그리드 토글 */}
            <IconButton
              size="sm"
              aria-label="목록 보기"
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
            >
              <LayoutList size={16} />
            </IconButton>
            <IconButton
              size="sm"
              aria-label="격자 보기"
              active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </IconButton>

            {/* 상세 패널 토글 */}
            <IconButton
              size="sm"
              aria-label="상세 정보"
              active={showPanel}
              onClick={() => setShowPanel((v) => !v)}
            >
              <Info size={16} />
            </IconButton>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="파일이 없습니다."
                description="파일을 업로드하거나 폴더를 생성해보세요."
                actions={
                  <Button variant="primary" leftIcon={<Plus size={15} />}>
                    새로 만들기
                  </Button>
                }
              />
            </div>
          ) : viewMode === 'list' ? (
            // ── 리스트 뷰 ──
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="w-8 py-2 pl-5">
                    <span className="sr-only">선택</span>
                  </th>
                  <th className="w-8 py-2 pr-2">종류</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="w-28 py-2 pr-4">크기</th>
                  <th className="w-36 py-2 pr-4">수정한 날짜</th>
                  <th className="w-24 py-2 pr-4">수정한 사람</th>
                  <th className="w-36 py-2 pr-4">생성한 날짜</th>
                  <th className="w-8 py-2 pr-4">
                    <Plus size={14} className="cursor-pointer text-slate-400 hover:text-slate-700" />
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {items.map((item) => (
                  <tr
                    key={item.driveItemId}
                    onClick={() => handleRowClick(item)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedItem?.driveItemId === item.driveItemId
                        ? 'bg-blue-50'
                        : ''
                    }`}
                  >
                    <td
                      className="pl-5"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleOne(item.driveItemId)
                      }}
                    >
                      <Checkbox
                        label=""
                        checked={selectedIds.includes(item.driveItemId)}
                        onChange={() => toggleOne(item.driveItemId)}
                        aria-label={`${item.itemNm} 선택`}
                      />
                    </td>
                    <td className="py-2.5 pr-2">
                      <FileIcon item={item} />
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">
                      {item.itemNm}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {item.fileSz ?? '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {item.lastMdfcnDt}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {item.modifierNm ?? '-'}
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">
                      {item.frstRegDt}
                    </td>
                    <td className="py-2.5 pr-4">
                      <div
                        className="opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenu
                          items={[
                            { label: '이름 변경', onClick: () => {} },
                            { label: '이동', onClick: () => {} },
                            { label: '복사', onClick: () => {} },
                            { label: '즐겨찾기 추가', onClick: () => {} },
                            { label: '삭제', danger: true, onClick: () => {} },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            // ── 그리드 뷰 ──
            <div className="grid grid-cols-4 gap-3 p-4">
              {items.map((item) => (
                <div
                  key={item.driveItemId}
                  onClick={() => handleRowClick(item)}
                  className={`group flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
                    selectedItem?.driveItemId === item.driveItemId
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="flex h-12 w-12 items-center justify-center">
                    <FileIcon item={item} />
                  </div>
                  <span className="w-full truncate text-center text-xs font-medium text-slate-700">
                    {item.itemNm}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── 상세 패널 (고정) ── */}
      {showPanel && (
        <DetailPanel
          item={selectedItem}
          onClose={() => setShowPanel(false)}
        />
      )}
    </div>
  )
}