// src/pages/project/ProjectDriveTab.tsx
import { useState, useRef, useEffect } from 'react'
import {
  Folder, FileImage, LayoutList, LayoutGrid, FolderPlus, Plus, Info, X, Star, ChevronRight,
} from 'lucide-react'
import IconButton from '../../components/common/button/IconButton'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
import Button from '../../components/common/button/Button'
import FileUploadButton from '../../components/common/button/FileUploadButton'
import Modal from '../../components/common/overlay/modal/Modal'
import FormField from '../../components/common/form/formField/FormField'
import DropdownMenu from '../../components/common/overlay/dropdownMenu/DropdownMenu'
import { useApiList, useApi } from '../../hooks/useApi'
import { projectDriveApi } from '../../api/projectDriveApi'
import type { DriveResponseDto } from '../../types/drive.dto'

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

const DetailPanel = ({ item, onClose }: DetailPanelProps) => (
  <aside className="flex h-full w-72 flex-shrink-0 flex-col border-l border-slate-200 bg-white">
    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
      <div className="flex items-center gap-2">
        {item ? <FileIcon item={item} /> : <Folder size={18} className="text-amber-400" />}
        <span className="max-w-[140px] truncate text-sm font-semibold text-slate-800">
          {item ? item.itemNm : '상세 정보'}
        </span>
      </div>
      <IconButton size="sm" aria-label="닫기" onClick={onClose}><X size={16} /></IconButton>
    </div>
    <div className="flex-1 overflow-y-auto px-4 py-4">
      {!item ? (
        <div className="flex h-full items-center justify-center text-center text-sm text-slate-400">
          항목을 선택하면<br />상세 정보가 표시됩니다.
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-slate-50">
            {item.itemTypeCd === '02'
              ? <FileImage size={48} className="text-blue-300" />
              : <Folder size={48} className="text-amber-400" />}
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="w-20 py-2 text-slate-500">종류</td>
                <td className="py-2 font-medium text-slate-800">{item.itemTypeCd === '01' ? '폴더' : '파일'}</td>
              </tr>
              {item.fileSz && (
                <tr>
                  <td className="py-2 text-slate-500">크기</td>
                  <td className="py-2 font-medium text-slate-800">{item.fileSz}</td>
                </tr>
              )}
              <tr>
                <td className="py-2 text-slate-500">생성일</td>
                <td className="py-2 font-medium text-slate-800">{item.frstRegDt ?? '-'}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500">생성자</td>
                <td className="py-2 font-medium text-slate-800">{item.frstRgtrNm ?? '-'}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500">수정일</td>
                <td className="py-2 font-medium text-slate-800">{item.lastMdfcnDt ?? '-'}</td>
              </tr>
              <tr>
                <td className="py-2 text-slate-500">수정자</td>
                <td className="py-2 font-medium text-slate-800">{item.lastMdfrNm ?? '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  </aside>
)

interface BreadcrumbItem {
  id: number | null
  name: string
}

interface ProjectDriveTabProps {
  projId: number
  className?: string
}

export default function ProjectDriveTab({ projId, className }: ProjectDriveTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list')
  const [page, setPage] = useState(0)
  const [currentFolderId, setCurrentFolderId] = useState<number | undefined>(undefined)
  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>([{ id: null, name: '프로젝트 드라이브' }])

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DriveResponseDto | null>(null)
  const [renameName, setRenameName] = useState('')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const [showPanel, setShowPanel] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DriveResponseDto | null>(null)

  const { data: items, loading, pagination, execute: fetchList } = useApiList(
    () => projectDriveApi.getProjectDriveList(projId, currentFolderId, page),
    { immediate: false }
  )

  useEffect(() => { void fetchList() }, [projId, currentFolderId, page, fetchList])

  const { execute: createFolder } = useApi(
    (data: { itemNm: string; prntDriveItemId?: number }) => projectDriveApi.createFolder(projId, data),
    { immediate: false }
  )
  const { execute: uploadFile } = useApi(
    (file: File, prntDriveItemId?: number) => projectDriveApi.uploadFile(projId, file, prntDriveItemId),
    { immediate: false }
  )
  const { execute: renameFolder } = useApi(
    (driveItemId: number, itemNm: string) => projectDriveApi.renameFolder(driveItemId, itemNm),
    { immediate: false }
  )
  const { execute: toggleBookmark } = useApi(
    (driveItemId: number) => projectDriveApi.toggleBookmark(driveItemId),
    { immediate: false }
  )
  const { execute: deleteItem } = useApi(
    (driveItemId: number) => projectDriveApi.deleteItem(driveItemId),
    { immediate: false }
  )

  // ── 폴더 생성 ──
  const handleCreateFolder = async () => {
    if (!folderName.trim()) return
    await createFolder({ itemNm: folderName, prntDriveItemId: currentFolderId })
    setFolderModalOpen(false)
    setFolderName('')
    void fetchList()
  }

  const closeFolderModal = () => { setFolderModalOpen(false); setFolderName('') }

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
    await renameFolder(renameTarget.driveItemId, renameName)
    setRenameModalOpen(false)
    setRenameTarget(null)
    setRenameName('')
    void fetchList()
  }

  const closeRenameModal = () => { setRenameModalOpen(false); setRenameTarget(null); setRenameName('') }

  // ── 즐겨찾기 ──
  const handleBookmark = async (item: DriveResponseDto) => {
    await toggleBookmark(item.driveItemId)
    void fetchList()
  }

  const handleBookmarkClick = (e: React.MouseEvent, item: DriveResponseDto) => {
    e.stopPropagation()
    void handleBookmark(item)
  }

  // ── 삭제 ──
  const handleDeleteOpen = (driveItemId: number) => { setDeleteTarget(driveItemId); setDeleteModalOpen(true) }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteItem(deleteTarget)
    setDeleteModalOpen(false)
    setDeleteTarget(null)
    void fetchList()
  }

  const closeDeleteModal = () => { setDeleteModalOpen(false); setDeleteTarget(null) }

  // ── 다운로드 ──
  const handleDownload = async (item: DriveResponseDto) => {
    try {
      const response = await projectDriveApi.downloadFile(item.driveItemId)
      const blob = new Blob([response.data])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = item.orgnlFileNm ?? item.itemNm
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // 에러 처리
    }
  }

  // ── 폴더 탐색 ──
  const handleFolderEnter = (item: DriveResponseDto) => {
    setBreadcrumb((prev) => [...prev, { id: item.driveItemId, name: item.itemNm }])
    setCurrentFolderId(item.driveItemId)
    setSelectedItem(null)
    setPage(0)
  }

  const handleBreadcrumbNavigate = (id: number | null, index: number) => {
    setBreadcrumb((prev) => prev.slice(0, index + 1))
    setCurrentFolderId(id ?? undefined)
    setSelectedItem(null)
    setPage(0)
  }

  const handleRowClick = (item: DriveResponseDto) => setSelectedItem(item)

  const handleRowDoubleClick = (item: DriveResponseDto) => {
    if (item.itemTypeCd === '01') handleFolderEnter(item)
  }

  if (loading) return <div className="mt-5 text-sm text-slate-400">로딩 중...</div>

  return (
    <div className={className ?? 'mt-5 flex h-[calc(100vh-280px)] gap-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'}>

      {/* 드라이브 본문 */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <NewItemDropdown
            onCreateFolder={() => setFolderModalOpen(true)}
            onUploadFile={handleUploadFile}
          />
          <div className="flex items-center gap-2">
            <IconButton size="sm" aria-label="목록 보기" active={viewMode === 'list'} onClick={() => setViewMode('list')}><LayoutList size={16} /></IconButton>
            <IconButton size="sm" aria-label="격자 보기" active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></IconButton>
            <IconButton size="sm" aria-label="상세 정보" active={showPanel} onClick={() => setShowPanel((v) => !v)}><Info size={16} /></IconButton>
          </div>
        </div>

        {/* 브레드크럼 */}
        <div className="flex items-center gap-1 px-5 py-2 text-sm text-slate-500 border-b border-slate-100">
          {breadcrumb.map((item, index) => (
            <div key={item.id ?? 'root'} className="flex items-center gap-1">
              {index > 0 && <ChevronRight size={14} className="text-slate-300" />}
              <button
                type="button"
                onClick={() => handleBreadcrumbNavigate(item.id, index)}
                className={`hover:text-blue-600 ${index === breadcrumb.length - 1 ? 'font-semibold text-slate-800' : 'hover:underline'}`}
              >
                {item.name}
              </button>
            </div>
          ))}
        </div>

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {(items ?? []).length === 0 ? (
            <div className="flex h-full items-center justify-center p-8">
              <EmptyState
                title="파일이 없습니다."
                description="파일을 업로드하거나 폴더를 생성해보세요."
                actions={<NewItemDropdown onCreateFolder={() => setFolderModalOpen(true)} onUploadFile={handleUploadFile} />}
              />
            </div>
          ) : viewMode === 'list' ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="w-10 py-2 pl-5 pr-2"><span className="sr-only">즐겨찾기</span></th>
                  <th className="w-8 py-2 pr-3 text-center whitespace-nowrap">종류</th>
                  <th className="py-2 pr-4">이름</th>
                  <th className="w-24 py-2 pr-4 whitespace-nowrap">크기</th>
                  <th className="w-36 py-2 pr-4 whitespace-nowrap">수정한 날짜</th>
                  <th className="w-36 py-2 pr-4 whitespace-nowrap">생성한 날짜</th>
                  <th className="w-8 py-2 pr-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(items ?? []).map((item) => (
                  <tr
                    key={item.driveItemId}
                    onClick={() => handleRowClick(item)}
                    onDoubleClick={() => handleRowDoubleClick(item)}
                    className={`group cursor-pointer transition-colors hover:bg-slate-50 ${
                      selectedItem?.driveItemId === item.driveItemId ? 'bg-blue-50' : ''
                    }`}
                  >
                    <td className="py-2.5 pl-5 pr-2" onClick={(e) => handleBookmarkClick(e, item)}>
                      <Star
                        size={15}
                        className={item.bookmarkYn === 'Y' ? 'fill-amber-400 text-amber-400' : 'text-transparent group-hover:text-slate-300'}
                      />
                    </td>
                    <td className="py-2.5 pr-3 text-center"><FileIcon item={item} /></td>
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{item.itemNm}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.fileSz ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.lastMdfcnDt ?? '-'}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{item.frstRegDt ?? '-'}</td>
                    <td className="py-2.5 pr-4">
                      <div className="opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu
                          items={[
                            ...(item.itemTypeCd === '01' ? [{ label: '폴더명 변경', onClick: () => handleRenameOpen(item) }] : []),
                            ...(item.itemTypeCd === '02' ? [{ label: '다운로드', onClick: () => void handleDownload(item) }] : []),
                            {
                              label: item.bookmarkYn === 'Y' ? '즐겨찾기 해제' : '즐겨찾기 추가',
                              onClick: () => void handleBookmark(item),
                            },
                            { label: '삭제', danger: true, onClick: () => handleDeleteOpen(item.driveItemId) },
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
                  onDoubleClick={() => handleRowDoubleClick(item)}
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

        {/* 페이지네이션 */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex justify-center border-t border-slate-100 py-3">
            <Pagination page={page + 1} totalPages={pagination.totalPages} onChange={(p) => setPage(p - 1)} />
          </div>
        )}
      </div>

      {/* 상세 패널 */}
      {showPanel && <DetailPanel item={selectedItem} onClose={() => setShowPanel(false)} />}

      {/* 폴더 생성 모달 */}
      <Modal open={folderModalOpen} title="폴더 생성" variant="confirm" confirmText="생성" onConfirm={handleCreateFolder} onClose={closeFolderModal}>
        <FormField label="폴더명" placeholder="폴더명을 입력하세요" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      </Modal>

      {/* 폴더명 수정 모달 */}
      <Modal open={renameModalOpen} title="폴더명 변경" variant="confirm" confirmText="변경" onConfirm={handleRenameConfirm} onClose={closeRenameModal}>
        <FormField label="폴더명" placeholder="새 폴더명을 입력하세요" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal open={deleteModalOpen} title="삭제" variant="confirm" confirmText="삭제" onConfirm={handleDeleteConfirm} onClose={closeDeleteModal}>
        <p className="text-sm text-slate-600">삭제하시겠습니까? 삭제 후 휴지통으로 이동됩니다.</p>
      </Modal>
    </div>
  )
}