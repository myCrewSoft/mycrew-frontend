import { useEffect, useMemo, useState } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Maximize2,
  Paperclip,
  Smile,
  Strikethrough,
  Table2,
  Underline,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'
import Button from '../../components/common/button/Button'
import { boardApi } from '../../api/boardApi'
import { ApiError } from '../../api/axiosInstance'
import { useApi } from '../../hooks/useApi'
import type { BoardKind } from '../../types/board'
import type { BoardMutationRequest } from '../../api/boardApi'
import type { BoardSideBarResponse } from '../../types'

interface BoardWriteFormProps {
  mode?: 'create' | 'edit'
  boardId?: number
  initialBoardType?: BoardKind
  initialBoardTypeCd?: string
  departmentCode?: string
  initialTitle?: string
  initialContent?: string
  initialImportantYn?: string
  initialCommentUseYn?: string
  initialAttachmentFileId?: number | null
  onClose?: () => void
  onCreated?: (boardId: number | null) => void
  onUpdated?: (request: BoardMutationRequest) => void
}

interface ToolbarItem {
  icon?: LucideIcon
  text?: string
  label: string
  className?: string
}

interface DepartmentOption {
  code: string
  name: string
}

type DepartmentBoardSideBarResponse = BoardSideBarResponse & {
  deptCd?: string
  deptCode?: string
  departmentCode?: string
  code?: string
}

const boardOptions: Array<{ value: BoardKind; label: string }> = [
  { value: 'notice', label: '공지사항' },
  { value: 'department', label: '부서게시판' },
  { value: 'free', label: '자유게시판' },
  { value: 'anonymous', label: '익명게시판' },
]

const boardTypeCdByKind: Record<BoardKind, string> = {
  notice: 'NOTICE',
  department: 'DEPT',
  free: 'FREE',
  anonymous: 'ANON',
}
const validBoardTypeCodes = new Set(Object.values(boardTypeCdByKind))

const departmentCodeByName: Record<string, string> = {
  개발팀: 'DEV',
  운영팀: 'OPS',
  디자인팀: 'DESIGN',
  인사팀: 'HR',
  마케팅팀: 'MARKETING',
}

const getDepartmentCode = (board: DepartmentBoardSideBarResponse) => {
  const candidates = [
    board.deptCd,
    board.deptCode,
    board.departmentCode,
    board.code,
    departmentCodeByName[board.boardName],
    board.boardTypeCd?.toUpperCase() === 'DEPT' ? undefined : board.boardTypeCd,
  ]

  return candidates.find((value): value is string => Boolean(value?.trim()))?.toUpperCase() ?? ''
}

const getDepartmentOptions = (boards: BoardSideBarResponse[]): DepartmentOption[] => {
  const departmentBoard = boards.find(
    (board) => board.boardTypeCd?.toUpperCase() === 'DEPT',
  )

  if (!Array.isArray(departmentBoard?.underlevel)) return []

  return departmentBoard.underlevel
    .map((board) => {
      const code = getDepartmentCode(board)

      return code
        ? {
            code,
            name: board.boardName,
          }
        : null
    })
    .filter((option): option is DepartmentOption => Boolean(option))
}

const toolbarGroups: ToolbarItem[][] = [
  [
    { icon: ChevronDown, label: '문단' },
    { text: '10pt', label: '글자 크기' },
  ],
  [
    { icon: Bold, label: '굵게' },
    { icon: Italic, label: '기울임' },
    { icon: Underline, label: '밑줄' },
    { icon: Strikethrough, label: '취소선' },
  ],
  [
    { text: 'A', label: '글자색', className: 'border-b-2 border-red-500' },
    { icon: ChevronDown, label: '글자색 선택' },
    { icon: Paperclip, label: '강조', className: 'text-yellow-500' },
    { icon: ChevronDown, label: '강조 선택' },
  ],
  [
    { icon: List, label: '목록' },
    { icon: ListOrdered, label: '번호 목록' },
    { icon: ChevronDown, label: '목록 옵션' },
  ],
  [
    { icon: AlignLeft, label: '왼쪽 정렬' },
    { icon: AlignCenter, label: '가운데 정렬' },
    { icon: AlignRight, label: '오른쪽 정렬' },
    { icon: AlignJustify, label: '양쪽 정렬' },
  ],
  [
    { icon: Link, label: '링크' },
    { icon: ChevronDown, label: '링크 옵션' },
    { icon: Image, label: '이미지' },
    { icon: Table2, label: '표' },
    { icon: ChevronDown, label: '표 옵션' },
    { icon: Smile, label: '이모지' },
  ],
  [{ icon: Maximize2, label: '전체 화면' }],
]

const iconButtonClass =
  'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950'

const isYes = (value?: string) => value?.trim().toUpperCase() === 'Y'

const BoardWriteForm = ({
  mode = 'create',
  boardId,
  initialBoardType = 'notice',
  initialBoardTypeCd = '',
  departmentCode = '',
  initialTitle = '',
  initialContent = '',
  initialImportantYn = 'N',
  initialCommentUseYn = 'Y',
  initialAttachmentFileId = 0,
  onClose,
  onCreated,
  onUpdated,
}: BoardWriteFormProps) => {
  const isEditMode = mode === 'edit'
  const [boardType, setBoardType] = useState<BoardKind>(initialBoardType)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isImportant, setIsImportant] = useState(isYes(initialImportantYn))
  const [allowComments, setAllowComments] = useState(initialCommentUseYn.toUpperCase() !== 'N')
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState(departmentCode)
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([])
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const { loading: creating, execute: createBoard } = useApi<
    number,
    [BoardMutationRequest]
  >(boardApi.createBoard, { immediate: false })
  const { loading: updating, execute: updateBoard } = useApi<
    number,
    [
      {
        type: BoardKind
        boardId: number
        departmentCode?: string
        request: BoardMutationRequest
      },
    ]
  >(boardApi.updateBoard, { immediate: false })

  const saving = creating || updating
  const originalBoardTypeCd = initialBoardTypeCd.trim().toUpperCase()
  const resolvedBoardTypeCd = boardTypeCdByKind[boardType]
  const originalDepartmentCode = departmentCode.trim()
  const contentByteLength = useMemo(
    () => new Blob([content]).size,
    [content],
  )

  useEffect(() => {
    if (boardType !== 'department') return

    let ignore = false

    boardApi.getBoardSideBar()
      .then((response) => {
        if (ignore) return

        const boards = response.data.data ?? []
        setDepartmentOptions(getDepartmentOptions(boards))
      })
      .catch(() => {
        if (ignore) return

        setDepartmentOptions([])
      })

    return () => {
      ignore = true
    }
  }, [boardType])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()

    if (!trimmedTitle) {
      setValidationMessage('제목을 입력해주세요.')
      return
    }

    if (!trimmedContent) {
      setValidationMessage('내용을 입력해주세요.')
      return
    }

    if (boardType === 'department' && !selectedDepartmentCode.trim()) {
      setValidationMessage('부서게시판은 하위 부서를 선택한 뒤 작성할 수 있습니다.')
      return
    }

    if (isEditMode && !boardId) {
      setValidationMessage('수정할 게시글 정보를 찾을 수 없습니다.')
      return
    }

    const request: BoardMutationRequest = {
      boardTypeCd: isEditMode && validBoardTypeCodes.has(originalBoardTypeCd)
        ? originalBoardTypeCd
        : resolvedBoardTypeCd,
      boardSj: trimmedTitle,
      boardCn: trimmedContent,
      boardAtchFileId: initialAttachmentFileId ?? 0,
      deptCd: isEditMode
        ? originalDepartmentCode
        : boardType === 'department' ? selectedDepartmentCode : '',
      projId: 0,
      imprtntYn: isImportant ? 'Y' : 'N',
      cmntUseYn: boardType === 'notice' || allowComments ? 'Y' : 'N',
    }

    try {
      setValidationMessage(null)

      if (isEditMode && boardId) {
        await updateBoard({
          type: boardType,
          boardId,
          departmentCode: selectedDepartmentCode,
          request,
        })
        onUpdated?.(request)
      } else {
        const response = await createBoard(request)
        onCreated?.(response.data ?? null)
      }

      onClose?.()
    } catch (error) {
      setValidationMessage(
        error instanceof ApiError
          ? error.message
          : `게시글 ${isEditMode ? '수정' : '등록'} 중 오류가 발생했습니다.`,
      )
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200 px-7">
        <h1 className="text-xl font-bold text-slate-950">
          게시글 {isEditMode ? '수정' : '작성'}
        </h1>

        <button
          type="button"
          aria-label={`${isEditMode ? '수정' : '작성'} 닫기`}
          onClick={onClose}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md text-slate-800 transition-colors hover:bg-slate-100"
        >
          <X size={24} />
        </button>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-11 py-8">
        <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-x-8 gap-y-6">
          <label className="pt-3 text-base font-bold text-slate-950">
            게시판 선택 <span className="text-red-500">*</span>
          </label>
          <div className="flex w-full items-center gap-3">
            <select
              value={boardType}
              onChange={(event) => {
                setBoardType(event.target.value as BoardKind)
                setValidationMessage(null)
              }}
              disabled={isEditMode}
              className="h-11 w-fit rounded-md border border-slate-300 bg-white pl-2 pr-7 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
            >
              {boardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {boardType === 'department' && (
              <select
                value={selectedDepartmentCode}
                onChange={(event) => {
                  setSelectedDepartmentCode(event.target.value)
                  setValidationMessage(null)
                }}
                disabled={isEditMode}
                className="h-11 w-40 rounded-md border border-slate-300 bg-white pl-2 pr-7 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">부서 선택</option>
                {departmentOptions.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.name}
                  </option>
                ))}
              </select>
            )}

            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="제목을 입력하세요."
              className="h-11 min-w-0 flex-1 rounded-md border border-slate-300 px-4 text-sm font-medium text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>

          <label className="pt-4 text-base font-bold text-slate-950">
            내용 <span className="text-red-500">*</span>
          </label>
          <div className="overflow-hidden rounded-md border border-slate-300 bg-white">
            <div className="flex h-12 items-center gap-1 overflow-x-auto border-b border-slate-200 px-4">
              {toolbarGroups.map((group, groupIndex) => (
                <div
                  key={groupIndex}
                  className="flex items-center gap-1 border-r border-slate-200 pr-2 last:border-r-0 last:pr-0"
                >
                  {group.map((item) => {
                    const Icon = item.icon

                    return (
                      <button
                        key={item.label}
                        type="button"
                        aria-label={item.label}
                        className={`${iconButtonClass} ${item.className ?? ''}`}
                      >
                        {Icon ? <Icon size={18} /> : item.text}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="내용을 입력하세요."
              className="h-[300px] w-full resize-none border-0 px-7 py-5 text-sm leading-6 text-slate-800 outline-none placeholder:text-slate-400"
            />

            <div className="flex h-10 items-center justify-between border-t border-slate-200 px-5 text-sm font-medium text-slate-500">
              <span>입력 바이트: {contentByteLength.toLocaleString()} / 10,000 byte</span>
              <span>임시저장 준비 중</span>
            </div>
          </div>

          <span className="pt-3 text-base font-bold text-slate-950">
            첨부 파일
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <div className="flex min-w-0 items-center justify-between gap-4 rounded-md border border-slate-300 bg-white px-4 py-3">
              <div className="flex min-w-0 items-center gap-3 text-sm text-slate-500">
                <Paperclip size={18} className="shrink-0" />
                <span className="truncate">
                  파일을 선택하거나 영역에 끌어다 놓으세요.
                </span>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                <Upload size={16} />
                <span>파일 선택</span>
                <input type="file" className="hidden" />
              </label>
            </div>

            <p className="text-xs text-slate-400">
              파일 업로드 API가 연결되면 첨부파일 ID를 게시글 요청에 함께 전송합니다.
            </p>
          </div>

          <span className="pt-1 text-base font-bold text-slate-950">추가 설정</span>
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-9">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={isImportant}
                  onChange={(event) => setIsImportant(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300 accent-blue-600"
                />
                중요 글로 등록
              </label>

              {boardType !== 'notice' && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <input
                    type="checkbox"
                    checked={allowComments}
                    onChange={(event) => setAllowComments(event.target.checked)}
                    className="h-5 w-5 rounded border-slate-300 accent-blue-600"
                  />
                  댓글 허용
                </label>
              )}
            </div>

            {validationMessage && (
              <p className="text-sm font-semibold text-red-500">{validationMessage}</p>
            )}
          </div>
        </div>
      </div>

      <footer className="flex h-[84px] shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-7">
        <Button
          size="sm"
          className="h-11 rounded-md px-11"
          loading={saving}
          onClick={handleSubmit}
        >
          {isEditMode ? '수정하기' : '등록하기'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          className="h-11 rounded-md px-11"
          onClick={onClose}
          disabled={saving}
        >
          취소하기
        </Button>
      </footer>
    </section>
  )
}

export default BoardWriteForm
