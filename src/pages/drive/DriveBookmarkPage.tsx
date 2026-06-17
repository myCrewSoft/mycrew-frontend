import { useState, useEffect } from 'react'
import { Folder, FileImage, LayoutList, LayoutGrid, Info, X, Star } from 'lucide-react'
import IconButton from '../../components/common/button/IconButton'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import DropdownMenu from '../../components/common/overlay/dropdownMenu/DropdownMenu'
import Modal from '../../components/common/overlay/modal/Modal'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import { useApiList, useApi } from '../../hooks/useApi'
import { driveApi } from '../../api/driveApi'
import type { DriveResponseDto } from '../../types/drive.dto'

const FileIcon = ({ item }: { item: DriveResponseDto }) => {
  if (item.itemTypeCd === '01') return <Folder size={20} className="text-amber-400" />
  return <FileImage size={20} className="text-blue-400" />
}

const ScopeBadge = ({ item }: { item: DriveResponseDto }) => {
  if (item.driveScopeCd !== '02') return null
  return (
    <span className="ml-2 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-600">
      프로젝트
    </span>
  )
}

const ChildCntBadge = ({ item }: { item: DriveResponseDto }) => {
  if (item.itemTypeCd !== '01' || !item.childCnt) return null
  return (
    <span className="ml-1.5 text-xs text-slate-400">
      ({item.childCnt}개)
    </span>
  )
}

interface DetailPanelProps {
  item: DriveResponseDto | null
  onClose: () => void
}

const DetailPanel = ({ item, onClose }: DetailPanelProps) => (
  <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {item ? <FileIcon item={item} /> : <Star size={18} className="text-amber-400" />}
        <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
          {item ? item.itemNm : '즐겨찾기'}
        </span>
      </div>
      <IconButton size="sm" aria-label="닫기" onClick={onClose}><X size={16} /></IconButton>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50">
          {item?.itemTypeCd === '02'
            ? <FileImage size={48} className="text-blue-300" />
            : <Folder size={48} className="text-amber-400" />}
        </div>
        <table className="w-full text-sm">
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="py-2 text-slate-500 w-24">종류</td>
              <td className="py-2 text-slate-800 font-medium">
                {item ? (item.itemTypeCd === '01' ? '폴더' : '파일') : '-'}
              </td>
            </tr>
            <tr>
              <td className="py-2 text-slate-500">드라이브</td>
              <td className="py-2 text-slate-800 font-medium">
                {item?.driveScopeCd === '02' ? '프로젝트' : '개인'}
              </td>
            </tr>
            {item?.fileSz && (
              <tr>
                <td className="py-2 text-slate-500">크기</td>
                <td className="py-2 text-slate-800 font-medium">{item.fileSz}</td>
              </tr>
            )}
            {item?.itemTypeCd === '01' && (
              <tr>
                <td className="py-2 text-slate-500">하위 항목</td>
                <td className="py-2 text-slate-800 font-medium">{item.childCnt ?? 0}개</td>
              </tr>
            )}
            {item && (
              <>
                <tr>
                  <td className="py-2 text-slate-500">생성자</td>
                  <td className="py-2 text-slate-800 font-medium">{item.frstRgtrNm ?? '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">생성일</td>
                  <td className="py-2 text-slate-800 font-medium">{item.frstRegDt ?? '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">수정자</td>
                  <td className="py-2 text-slate-800 font-medium">{item.lastMdfrNm ?? '-'}</td>
                </tr>
                <tr>
                  <td className="py-2 text-slate-500">수정일</td>
                  <td className="py-2 text-slate-800 font-medium">{item.lastMdfcnDt ?? '-'}</td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </aside>
)

export default function DriveFavoritePage() {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedItem, setSelectedItem] = useState<DriveResponseDto | null>(null)
  const [showPanel, setShowPanel] = useState(false)
  const [page, setPage] = useState(0)
  const [unbookmarkModalOpen, setUnbookmarkModalOpen] = useState(false)
  const [unbookmarkTarget, setUnbookmarkTarget] = useState<number | null>(null)

  const { data: items, loading, pagination, execute: fetchList } = useApiList<DriveResponseDto>(
    () => driveApi.getBookmarkList(page),
    { immediate: false }
  )

  const { execute: toggleBookmark } = useApi(driveApi.toggleBookmark, { immediate: false })

  useEffect(() => { void fetchList() }, [page, fetchList])

  const handleUnbookmarkOpen = (driveItemId: number) => {
    setUnbookmarkTarget(driveItemId)
    setUnbookmarkModalOpen(true)
  }

  const handleUnbookmarkConfirm = async () => {
    if (!unbookmarkTarget) return
    await toggleBookmark(unbookmarkTarget)
    setUnbookmarkModalOpen(false)
    setUnbookmarkTarget(null)
    setSelectedItem(null)
    void fetchList()
  }

  const handleStarClick = (e: React.MouseEvent, item: DriveResponseDto) => {
    e.stopPropagation()
    handleUnbookmarkOpen(item.driveItemId)
  }

  const handleRowClick = (item: DriveResponseDto) => {
    setSelectedItem(item)
    setShowPanel(true)
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-0 rounded-xl bg-white overflow-hidden">

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <span className="text-sm text-slate-500">
            {pagination && pagination.totalElements > 0 ? `총 ${pagination.totalElements}개 항목` : ''}
          </span>
          <div className="flex items-center gap-2">
            <IconButton size="sm" aria-label="목록 보기" active={viewMode === 'list'} onClick={() => setViewMode('list')}><LayoutList size={16} /></IconButton>
            <IconButton size="sm" aria-label="격자 보기" active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></IconButton>
            <IconButton size="sm" aria-label="상세 정보" active={showPanel} onClick={() => setShowPanel((v) => !v)}><Info size={16} /></IconButton>
          </div>
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {(items ?? []).length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="즐겨찾기한 항목이 없습니다."
                description="자주 사용하는 파일이나 폴더를 즐겨찾기에 추가해보세요."
              />
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="w-10 py-2 pl-5 pr-2"><span className="sr-only">즐겨찾기</span></th>
                  <th className="w-8 py-2 pr-3 text-center whitespace-nowrap">종류</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="w-24 py-2 pr-4 whitespace-nowrap">크기</th>
                  <th className="w-36 py-2 pr-4 whitespace-nowrap">수정한 날짜</th>
                  <th className="w-12 py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(items ?? []).map((item) => (
                  <tr
                    key={item.driveItemId}
                    onClick={() => handleRowClick(item)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedItem?.driveItemId === item.driveItemId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-5 pr-2" onClick={(e) => handleStarClick(e, item)}>
                      <Star size={15} className="fill-amber-400 text-amber-400" />
                    </td>
                    <td className="py-2.5 pr-3 text-center"><FileIcon item={item} /></td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">
                      <div className="flex items-center">
                        <span>{item.itemNm}</span>
                        <ChildCntBadge item={item} />
                        <ScopeBadge item={item} />
                      </div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.fileSz ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.lastMdfcnDt ?? '-'}</td>
                    <td className="py-2.5 pr-4" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu
                        items={[
                          { label: '즐겨찾기 해제', danger: true, onClick: () => handleUnbookmarkOpen(item.driveItemId) },
                        ]}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="grid grid-cols-4 gap-3 p-4">
              {(items ?? []).map((item) => (
                <div
                  key={item.driveItemId}
                  onClick={() => handleRowClick(item)}
                  className={`group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4 transition-colors hover:bg-slate-50 ${
                    selectedItem?.driveItemId === item.driveItemId ? 'border-blue-300 bg-blue-50' : 'border-slate-100 bg-white'
                  }`}
                >
                  <div className="absolute right-2 top-2" onClick={(e) => handleStarClick(e, item)}>
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center"><FileIcon item={item} /></div>
                  <div className="flex w-full flex-col items-center gap-0.5">
                    <span className="w-full truncate text-center text-xs font-medium text-slate-700">{item.itemNm}</span>
                    <div className="flex items-center gap-1">
                      <ChildCntBadge item={item} />
                      <ScopeBadge item={item} />
                    </div>
                    <span className="text-xs text-slate-400">{item.lastMdfcnDt ?? '-'}</span>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu
                      items={[
                        { label: '즐겨찾기 해제', danger: true, onClick: () => handleUnbookmarkOpen(item.driveItemId) },
                      ]}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Pagination
              page={page + 1}
              totalPages={pagination.totalPages}
              onChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      {showPanel && <DetailPanel item={selectedItem} onClose={() => setShowPanel(false)} />}

      <Modal
        open={unbookmarkModalOpen}
        title="즐겨찾기 해제"
        variant="confirm"
        confirmText="해제"
        onConfirm={handleUnbookmarkConfirm}
        onClose={() => { setUnbookmarkModalOpen(false); setUnbookmarkTarget(null) }}
      >
        <p className="text-sm text-slate-600">즐겨찾기에서 해제하시겠습니까?</p>
      </Modal>
    </div>
  )
}