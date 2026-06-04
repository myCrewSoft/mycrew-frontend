import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Folder, FileImage, LayoutList, LayoutGrid, ArrowUpDown, Plus, Info, X, FolderPlus, ChevronRight, Star, Trash2 } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import Checkbox from '../../components/common/form/checkbox/Checkbox'
import DropdownMenu from '../../components/common/overlay/dropdownMenu/DropdownMenu'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Tabs from '../../components/common/tabs/Tabs'
import Modal from '../../components/common/overlay/modal/Modal'
import FormField from '../../components/common/form/formField/FormField'
import FileUploadButton from '../../components/common/button/FileUploadButton'
import { useApiList, useApi } from '../../hooks/useApi'
import { driveApi } from '../../api/driveApi'
import type { DriveResponseDto, DriveRenameRequestDto } from '../../types/drive.dto'

const FileIcon = ({ item }: { item: DriveResponseDto }) => {
  if (item.itemTypeCd === '01') return <Folder size={20} className="text-amber-400" />
  return <FileImage size={20} className="text-blue-400" />
}

interface NewItemDropdownProps {
  onCreateFolder: () => void
  onUploadFile: (file: File) => void
}

const NewItemDropdown = ({ onCreateFolder, onUploadFile }: NewItemDropdownProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <Button variant="primary" leftIcon={<Plus size={15} />} onClick={() => setOpen((v) => !v)}>
        새로 만들기
      </Button>
      {open && (
        <div className="absolute left-0 top-11 z-20 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
          <button
            type="button"
            onClick={() => { onCreateFolder(); setOpen(false) }}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <FolderPlus size={16} className="text-amber-400" />
            폴더 생성
          </button>
          <FileUploadButton onUpload={(file) => { onUploadFile(file); setOpen(false) }} />
        </div>
      )}
    </div>
  )
}

interface DetailPanelProps {
  item: DriveResponseDto | null
  onClose: () => void
}

const DetailPanel = ({ item, onClose }: DetailPanelProps) => {
  const [detailTab, setDetailTab] = useState('info')

  return (
    <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          {item ? <FileIcon item={item} /> : <Folder size={18} className="text-amber-400" />}
          <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
            {item ? item.itemNm : '내 드라이브'}
          </span>
        </div>
        <IconButton size="sm" aria-label="닫기" onClick={onClose}><X size={16} /></IconButton>
      </div>

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

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {detailTab === 'info' && (
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
                    {item ? (item.itemTypeCd === '01' ? '폴더' : '파일') : '내 드라이브'}
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
                  </>
                )}
                {!item && (
                  <tr>
                    <td className="py-2 text-slate-500">사용 용량</td>
                    <td className="py-2">
                      <button className="text-blue-500 text-sm font-medium hover:underline">용량 확인</button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {detailTab === 'activity' && (
          <EmptyState title="활동 내역이 없습니다." description="파일 업로드, 수정 등의 활동이 여기에 표시됩니다." />
        )}
      </div>
    </aside>
  )
}

interface BreadcrumbItem {
  id: number | null
  name: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  onNavigate: (id: number | null) => void
}

const Breadcrumb = ({ items, onNavigate }: BreadcrumbProps) => (
  <div className="flex items-center gap-1 px-5 py-2 text-sm text-slate-500 border-b border-slate-100">
    {items.map((item, index) => (
      <div key={item.id ?? 'root'} className="flex items-center gap-1">
        {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
        <button
          type="button"
          onClick={() => onNavigate(item.id)}
          className={`hover:text-blue-600 ${index === items.length - 1 ? 'font-semibold text-slate-800' : 'hover:underline'}`}
        >
          {item.name}
        </button>
      </div>
    ))}
  </div>
)

export default function DriveMyPage() {
  const { folderId } = useParams<{ folderId: string }>()
  const navigate = useNavigate()
  const currentFolderId = folderId ? Number(folderId) : undefined

  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [selectedItem, setSelectedItem] = useState<DriveResponseDto | null>(null)
  const [showPanel, setShowPanel] = useState(true)

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DriveResponseDto | null>(null)
  const [renameName, setRenameName] = useState('')

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>(() => {
    if (!folderId) return [{ id: null, name: '내 드라이브' }]
    const saved = sessionStorage.getItem('drive-breadcrumb')
    return saved ? JSON.parse(saved) : [{ id: null, name: '내 드라이브' }]
  })

  const { data: items, loading, execute: fetchList } = useApiList(
    () => driveApi.getMyDriveList(currentFolderId),
    { immediate: false }
  )

  useEffect(() => { void fetchList() }, [currentFolderId, fetchList])
  useEffect(() => {
    sessionStorage.setItem('drive-breadcrumb', JSON.stringify(breadcrumb))
  }, [breadcrumb])

  const { execute: createFolder } = useApi(driveApi.createFolder, { immediate: false })
  const { execute: uploadFile } = useApi(driveApi.uploadFile, { immediate: false })
  const { execute: renameFolder } = useApi(driveApi.renameFolder, { immediate: false })
  const { execute: toggleBookmark } = useApi(driveApi.toggleBookmark, { immediate: false })
  const { execute: deleteItem } = useApi(driveApi.deleteItem, { immediate: false })

  // ── 폴더 생성 ──
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    await createFolder({ itemNm: folderName, prntDriveItemId: currentFolderId })
    setFolderModalOpen(false)
    setFolderName('')
    void fetchList()
  }

  const closeFolderModal = () => {
    setFolderModalOpen(false)
    setFolderName('')
  }

  // ── 파일 업로드 ──
  const handleUploadFile = async (file: File) => {
    await uploadFile(file, currentFolderId)
    void fetchList()
  }

  // ── 폴더명 수정 ──
  const handleRenameOpen = (item: DriveResponseDto) => {
    setRenameTarget(item)
    setRenameName(item.itemNm)
    setRenameModalOpen(true)
  }

  const handleRenameConfirm = async () => {
    if (!renameTarget || !renameName.trim()) return
    await renameFolder(renameTarget.driveItemId, { itemNm: renameName } as DriveRenameRequestDto)
    setRenameModalOpen(false)
    setRenameTarget(null)
    setRenameName('')
    void fetchList()
  }

  const closeRenameModal = () => {
    setRenameModalOpen(false)
    setRenameTarget(null)
    setRenameName('')
  }

  // ── 즐겨찾기 토글 ──
  const handleBookmark = async (item: DriveResponseDto) => {
    await toggleBookmark(item.driveItemId)
    void fetchList()
  }

  const handleBookmarkClick = (e: React.MouseEvent, item: DriveResponseDto) => {
    e.stopPropagation()
    void handleBookmark(item)
  }

  // ── 단건 삭제 ──
  const handleDeleteItem = async (driveItemId: number) => {
    await deleteItem(driveItemId)
    setSelectedIds((prev) => prev.filter((id) => id !== driveItemId))
    void fetchList()
  }

  // ── 다건 삭제 ──
  const handleDeleteSelected = async () => {
    await Promise.all(selectedIds.map((id) => deleteItem(id)))
    setSelectedIds([])
    void fetchList()
  }

  // ── 폴더 진입 ──
  const handleFolderEnter = (item: DriveResponseDto) => {
    setBreadcrumb((prev) => [...prev, { id: item.driveItemId, name: item.itemNm }])
    setSelectedItem(null)
    setSelectedIds([])
    navigate(`/drive/folders/${item.driveItemId}`)
  }

  const handleBreadcrumbNavigate = (id: number | null) => {
    setBreadcrumb((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      return prev.slice(0, index + 1)
    })
    setSelectedItem(null)
    setSelectedIds([])
    if (id === null) navigate('/drive')
    else navigate(`/drive/folders/${id}`)
  }

  const handleRowClick = (item: DriveResponseDto) => {
    if (item.itemTypeCd === '01') handleFolderEnter(item)
    else { setSelectedItem(item); setShowPanel(true) }
  }

  if (loading) return <div>로딩 중...</div>

  const allChecked = (items ?? []).length > 0 && selectedIds.length === (items ?? []).length
  const toggleAll = () => setSelectedIds(allChecked ? [] : (items ?? []).map((i) => i.driveItemId))
  const toggleOne = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])

  const isSelecting = selectedIds.length > 0

  return (
    <div className="flex h-full gap-0 overflow-hidden">

      <div className="flex min-w-0 flex-1 flex-col gap-0 rounded-xl bg-white overflow-hidden">

        {/* 상단 툴바 — 선택 여부에 따라 변경 */}
        {isSelecting ? (
          <div className="flex items-center gap-3 border-b border-blue-100 bg-blue-50 px-5 py-3">
            <Checkbox label="" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" />
            <span className="text-sm font-semibold text-blue-600">{selectedIds.length}개 선택됨</span>
            <div className="h-4 w-px bg-blue-200" />
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 size={14} />}
              onClick={() => void handleDeleteSelected()}
            >
              삭제
            </Button>
            <div style={{ flex: 1 }} />
            <button
              type="button"
              className="text-sm text-slate-400 hover:text-slate-600"
              onClick={() => setSelectedIds([])}
            >
              선택 해제
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
            <div className="flex items-center gap-2">
              <Checkbox label="" checked={allChecked} onChange={toggleAll} aria-label="전체 선택" />
              <NewItemDropdown
                onCreateFolder={() => setFolderModalOpen(true)}
                onUploadFile={handleUploadFile}
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" leftIcon={<ArrowUpDown size={14} />} size="sm">수정한 날짜순</Button>
              <IconButton size="sm" aria-label="목록 보기" active={viewMode === 'list'} onClick={() => setViewMode('list')}><LayoutList size={16} /></IconButton>
              <IconButton size="sm" aria-label="격자 보기" active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></IconButton>
              <IconButton size="sm" aria-label="상세 정보" active={showPanel} onClick={() => setShowPanel((v) => !v)}><Info size={16} /></IconButton>
            </div>
          </div>
        )}

        <Breadcrumb items={breadcrumb} onNavigate={handleBreadcrumbNavigate} />

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {(items ?? []).length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="파일이 없습니다."
                description="파일을 업로드하거나 폴더를 생성해보세요."
                actions={
                  <NewItemDropdown
                    onCreateFolder={() => setFolderModalOpen(true)}
                    onUploadFile={handleUploadFile}
                  />
                }
              />
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                  <th className="w-8 py-2 pl-5"><span className="sr-only">선택</span></th>
                  <th className="w-6 py-2"><span className="sr-only">즐겨찾기</span></th>
                  <th className="w-8 py-2 pr-2">종류</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="w-28 py-2 pr-4">크기</th>
                  <th className="w-36 py-2 pr-4">수정한 날짜</th>
                  <th className="w-36 py-2 pr-4">생성한 날짜</th>
                  <th className="w-8 py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(items ?? []).map((item) => (
                  <tr
                    key={item.driveItemId}
                    onClick={() => handleRowClick(item)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedIds.includes(item.driveItemId) ? 'bg-blue-50' :
                      selectedItem?.driveItemId === item.driveItemId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="pl-5">
                      <Checkbox
                        label=""
                        checked={selectedIds.includes(item.driveItemId)}
                        onChange={() => toggleOne(item.driveItemId)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${item.itemNm} 선택`}
                      />
                    </td>
                    <td className="py-2.5" onClick={(e) => handleBookmarkClick(e, item)}>
                      <Star
                        size={15}
                        className={
                          item.bookmarkYn === 'Y'
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-transparent group-hover:text-slate-300'
                        }
                      />
                    </td>
                    <td className="py-2.5 pr-2"><FileIcon item={item} /></td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{item.itemNm}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.fileSz ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.lastMdfcnDt ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.frstRegDt ?? '-'}</td>
                    <td className="py-2.5 pr-4">
                      <div className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu
                          items={[
                            ...(item.itemTypeCd === '01' ? [{ label: '폴더명 변경', onClick: () => handleRenameOpen(item) }] : []),
                            {
                              label: item.bookmarkYn === 'Y' ? '즐겨찾기 해제' : '즐겨찾기 추가',
                              onClick: () => void handleBookmark(item),
                            },
                            { label: '삭제', danger: true, onClick: () => void handleDeleteItem(item.driveItemId) },
                          ]}
                        />
                      </div>
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
                  {item.bookmarkYn === 'Y' && (
                    <Star size={13} className="absolute right-2 top-2 fill-amber-400 text-amber-400" />
                  )}
                  <div className="flex h-12 w-12 items-center justify-center"><FileIcon item={item} /></div>
                  <span className="w-full truncate text-center text-xs font-medium text-slate-700">{item.itemNm}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showPanel && <DetailPanel item={selectedItem} onClose={() => setShowPanel(false)} />}

      {/* 폴더 생성 모달 */}
      <Modal open={folderModalOpen} title="폴더 생성" variant="confirm" confirmText="생성" onConfirm={handleCreateFolder} onClose={closeFolderModal}>
        <FormField label="폴더명" placeholder="폴더명을 입력하세요" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      </Modal>

      {/* 폴더명 수정 모달 */}
      <Modal open={renameModalOpen} title="폴더명 변경" variant="confirm" confirmText="변경" onConfirm={handleRenameConfirm} onClose={closeRenameModal}>
        <FormField label="폴더명" placeholder="새 폴더명을 입력하세요" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      </Modal>
    </div>
  )
}