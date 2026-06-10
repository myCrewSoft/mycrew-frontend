import { useState, useRef, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Folder, FileImage, LayoutList, LayoutGrid, Plus, FolderPlus, ChevronRight, Star } from 'lucide-react'
import Button from '../../components/common/button/Button'
import IconButton from '../../components/common/button/IconButton'
import DropdownMenu from '../../components/common/overlay/dropdownMenu/DropdownMenu'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import Modal from '../../components/common/overlay/modal/Modal'
import FormField from '../../components/common/form/formField/FormField'
import FileUploadButton from '../../components/common/button/FileUploadButton'
import Pagination from '../../components/common/dataDisplay/pagination/Pagination'
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
  const [page, setPage] = useState(0) // 0-based

  const [folderModalOpen, setFolderModalOpen] = useState(false)
  const [folderName, setFolderName] = useState('')

  const [renameModalOpen, setRenameModalOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<DriveResponseDto | null>(null)
  const [renameName, setRenameName] = useState('')

  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)

  const [breadcrumb, setBreadcrumb] = useState<BreadcrumbItem[]>(() => {
    if (!folderId) return [{ id: null, name: '내 드라이브' }]
    const saved = sessionStorage.getItem('drive-breadcrumb')
    return saved ? JSON.parse(saved) : [{ id: null, name: '내 드라이브' }]
  })

  const { data: items, loading, pagination, execute: fetchList } = useApiList(
    () => driveApi.getMyDriveList(currentFolderId, page),
    { immediate: false }
  )

  useEffect(() => { void fetchList() }, [currentFolderId, page, fetchList])

  useEffect(() => {
    sessionStorage.setItem('drive-breadcrumb', JSON.stringify(breadcrumb))
  }, [breadcrumb])

  // ── 뒤로가기 감지 ──
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname
      if (path === '/drive') {
        setBreadcrumb([{ id: null, name: '내 드라이브' }])
      } else if (path.startsWith('/drive/folders/')) {
        const saved = sessionStorage.getItem('drive-breadcrumb')
        if (saved) setBreadcrumb(JSON.parse(saved))
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

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

  // ── 삭제 ──
  const handleDeleteOpen = (driveItemId: number) => {
    setDeleteTarget(driveItemId)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    await deleteItem(deleteTarget)
    setDeleteModalOpen(false)
    setDeleteTarget(null)
    void fetchList()
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setDeleteTarget(null)
  }

  // ── 파일 다운로드 ──
  const handleDownload = async (item: DriveResponseDto) => {
    try {
      const response = await driveApi.downloadFile(item.driveItemId)
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
      // 에러 처리 필요 시 추가
    }
  }

  // ── 폴더 진입 ──
  const handleFolderEnter = (item: DriveResponseDto) => {
    setBreadcrumb((prev) => [...prev, { id: item.driveItemId, name: item.itemNm }])
    setPage(0)
    navigate(`/drive/folders/${item.driveItemId}`)
  }

  const handleBreadcrumbNavigate = (id: number | null) => {
    setBreadcrumb((prev) => {
      const index = prev.findIndex((b) => b.id === id)
      return prev.slice(0, index + 1)
    })
    setPage(0)
    if (id === null) navigate('/drive')
    else navigate(`/drive/folders/${id}`)
  }

  // ── 행 클릭: 폴더면 진입 ──
  const handleRowClick = (item: DriveResponseDto) => {
    if (item.itemTypeCd === '01') handleFolderEnter(item)
  }

  if (loading) return <div>로딩 중...</div>

  return (
    <div className="flex h-full gap-0 overflow-hidden">
      <div className="flex min-w-0 flex-1 flex-col gap-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">

        {/* 상단 툴바 */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3">
          <div className="flex items-center gap-2">
            <NewItemDropdown
              onCreateFolder={() => setFolderModalOpen(true)}
              onUploadFile={handleUploadFile}
            />
          </div>
          <div className="flex items-center gap-2">
            <IconButton size="sm" aria-label="목록 보기" active={viewMode === 'list'} onClick={() => setViewMode('list')}><LayoutList size={16} /></IconButton>
            <IconButton size="sm" aria-label="격자 보기" active={viewMode === 'grid'} onClick={() => setViewMode('grid')}><LayoutGrid size={16} /></IconButton>
          </div>
        </div>

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
                    className="group cursor-pointer transition-colors hover:bg-slate-50"
                  >
                    <td className="py-2.5 pl-5 pr-2" onClick={(e) => handleBookmarkClick(e, item)}>
                      <Star
                        size={15}
                        className={
                          item.bookmarkYn === 'Y'
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-transparent group-hover:text-slate-300'
                        }
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
                            ...(item.itemTypeCd === '02' ? [{
                              label: '다운로드',
                              onClick: () => void handleDownload(item),
                            }] : []),
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
                  className="group relative flex cursor-pointer flex-col items-center gap-2 rounded-xl border border-slate-100 bg-white p-4 transition-colors hover:bg-slate-50"
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
            <Pagination
              page={page + 1}
              totalPages={pagination.totalPages}
              onChange={(p) => setPage(p - 1)}
            />
          </div>
        )}
      </div>

      {/* 폴더 생성 모달 */}
      <Modal open={folderModalOpen} title="폴더 생성" variant="confirm" confirmText="생성" onConfirm={handleCreateFolder} onClose={closeFolderModal}>
        <FormField label="폴더명" placeholder="폴더명을 입력하세요" value={folderName} onChange={(e) => setFolderName(e.target.value)} />
      </Modal>

      {/* 폴더명 수정 모달 */}
      <Modal open={renameModalOpen} title="폴더명 변경" variant="confirm" confirmText="변경" onConfirm={handleRenameConfirm} onClose={closeRenameModal}>
        <FormField label="폴더명" placeholder="새 폴더명을 입력하세요" value={renameName} onChange={(e) => setRenameName(e.target.value)} />
      </Modal>

      {/* 삭제 확인 모달 */}
      <Modal
        open={deleteModalOpen}
        title="삭제"
        variant="confirm"
        confirmText="삭제"
        onConfirm={handleDeleteConfirm}
        onClose={closeDeleteModal}
      >
        <p className="text-sm text-slate-600">
          삭제하시겠습니까? 삭제 후 휴지통으로 이동됩니다.
        </p>
      </Modal>
    </div>
  )
}