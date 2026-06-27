import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import ToastEditor from '@toast-ui/editor'
import '@toast-ui/editor/dist/toastui-editor.css'
import './BoardWriteForm.css'
import { AlignCenter, AlignLeft, AlignRight, X } from 'lucide-react'
import { renderToStaticMarkup } from 'react-dom/server'
import Button from '../../components/common/button/Button'
import FileUpload from '../../components/common/form/fileUpload/FileUpload'
import { boardApi } from '../../api/boardApi'
import { fileApi } from '../../api/fileApi'
import { ApiError } from '../../api/axiosInstance'
import { useApi } from '../../hooks/useApi'
import type { BoardKind } from '../../types/board'
import type { BoardMutationRequest } from '../../api/boardApi'
import type { BoardSideBarResponse } from '../../types'
import type { ScopeOptionResponse } from '../../types/admin'

type BoardWriteKind = BoardKind | 'project'

interface BoardWriteFormProps {
  mode?: 'create' | 'edit'
  boardId?: number
  initialBoardType?: BoardWriteKind
  initialBoardTypeCd?: string
  departmentCode?: string
  projectId?: number
  projectOptions?: ScopeOptionResponse[]
  allowProjectBoardSelection?: boolean
  initialTitle?: string
  initialContent?: string
  initialImportantYn?: string
  initialCommentUseYn?: string
  initialAttachmentFileId?: number | null
  onClose?: () => void
  onCreated?: (boardId: number | null) => void
  onUpdated?: (request: BoardMutationRequest) => void
  onBoardSelectionChange?: (
    boardType: BoardWriteKind,
    departmentName?: string,
    projectName?: string,
  ) => void
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

const boardOptions: Array<{ value: BoardWriteKind; label: string }> = [
  { value: 'notice', label: '공지사항' },
  { value: 'department', label: '부서게시판' },
  { value: 'free', label: '자유게시판' },
  { value: 'anonymous', label: '익명게시판' },
]

const projectBoardOption: { value: BoardWriteKind; label: string } = {
  value: 'project',
  label: '프로젝트 게시판',
}

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

const isYes = (value?: string) => value?.trim().toUpperCase() === 'Y'

type TextAlignment = 'left' | 'center' | 'right'

const getStoredBlockAlignments = (content: string): TextAlignment[] => {
  const document = new DOMParser().parseFromString(content, 'text/html')

  return Array.from(
    document.body.querySelectorAll<HTMLElement>('p, h1, h2, h3, h4, h5, h6'),
  ).map((element) => {
    const alignment = element.style.textAlign || element.getAttribute('align')

    if (
      element.classList.contains('board-text-align-center') ||
      alignment === 'center'
    ) {
      return 'center'
    }

    if (
      element.classList.contains('board-text-align-right') ||
      alignment === 'right'
    ) {
      return 'right'
    }

    return 'left'
  })
}

const createAlignmentToolbarButton = (
  label: string,
  icon: ReactNode,
) => {
  const button = document.createElement('button')
  button.type = 'button'
  button.className =
    'toastui-editor-toolbar-icons board-editor-alignment-button'
  button.setAttribute('aria-label', label)
  button.innerHTML = renderToStaticMarkup(icon)
  button.addEventListener('mousedown', (event) => event.preventDefault())
  return button
}

const BoardWriteForm = ({
  mode = 'create',
  boardId,
  initialBoardType = 'notice',
  initialBoardTypeCd = '',
  departmentCode = '',
  projectId,
  projectOptions = [],
  allowProjectBoardSelection = false,
  initialTitle = '',
  initialContent = '',
  initialImportantYn = 'N',
  initialCommentUseYn = 'Y',
  initialAttachmentFileId = 0,
  onClose,
  onCreated,
  onUpdated,
  onBoardSelectionChange,
}: BoardWriteFormProps) => {
  const editorHostRef = useRef<HTMLDivElement | null>(null)
  const editorRef = useRef<ToastEditor | null>(null)
  const selectedImagePreviewUrlRef = useRef<string | null>(null)
  const isEditMode = mode === 'edit'
  const [boardType, setBoardType] = useState<BoardWriteKind>(initialBoardType)
  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isImportant, setIsImportant] = useState(isYes(initialImportantYn))
  const [allowComments, setAllowComments] = useState(initialCommentUseYn.toUpperCase() !== 'N')
  const [selectedDepartmentCode, setSelectedDepartmentCode] = useState(departmentCode)
  const [selectedProjectId, setSelectedProjectId] = useState(projectId ?? 0)
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([])
  const [validationMessage, setValidationMessage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedImagePreviewUrl, setSelectedImagePreviewUrl] = useState<string | null>(null)

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
  const { loading: uploading, execute: uploadBoardFile } = useApi<
    number,
    [{ file: File; fileCn?: string }]
  >(fileApi.uploadBoardFile, { immediate: false })

  const saving = creating || updating || uploading
  const originalBoardTypeCd = initialBoardTypeCd.trim().toUpperCase()
  const fixedProjectId = typeof projectId === 'number' && projectId > 0
    ? projectId
    : 0
  const isFixedProjectBoard = !allowProjectBoardSelection && fixedProjectId > 0
  const firstProjectOptionId = Number(projectOptions[0]?.scopeId ?? 0)
  const effectiveProjectId = selectedProjectId || fixedProjectId || firstProjectOptionId
  const isProjectBoard = boardType === 'project' || isFixedProjectBoard
  const selectableBoardOptions = allowProjectBoardSelection
    ? [...boardOptions, projectBoardOption]
    : boardOptions
  const resolvedBoardTypeCd = isProjectBoard
    ? 'PROJ'
    : boardTypeCdByKind[boardType as BoardKind]
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

  useEffect(() => {
    const departmentName = boardType === 'department'
      ? departmentOptions.find(
          (option) => option.code === selectedDepartmentCode,
        )?.name
      : undefined
    const projectName = isProjectBoard
      ? projectOptions.find(
          (option) => Number(option.scopeId) === effectiveProjectId,
        )?.scopeName
      : undefined

    onBoardSelectionChange?.(boardType, departmentName, projectName)
  }, [
    boardType,
    departmentOptions,
    effectiveProjectId,
    isProjectBoard,
    onBoardSelectionChange,
    projectOptions,
    selectedDepartmentCode,
  ])

  useEffect(() => () => {
    if (selectedImagePreviewUrlRef.current) {
      URL.revokeObjectURL(selectedImagePreviewUrlRef.current)
    }
  }, [])

  useEffect(() => {
    if (!editorHostRef.current) return

    const editorHost = editorHostRef.current
    const storedBlockAlignments = getStoredBlockAlignments(initialContent)
    const alignLeftButton = createAlignmentToolbarButton(
      '왼쪽 정렬',
      <AlignLeft size={18} />,
    )
    const alignCenterButton = createAlignmentToolbarButton(
      '가운데 정렬',
      <AlignCenter size={18} />,
    )
    const alignRightButton = createAlignmentToolbarButton(
      '오른쪽 정렬',
      <AlignRight size={18} />,
    )
    const editor = new ToastEditor({
      el: editorHost,
      initialValue: initialContent,
      initialEditType: 'wysiwyg',
      previewStyle: 'vertical',
      // Toast Editor의 자동 높이 기능을 사용해 내용만큼 입력 영역을 늘립니다.
      // 고정 높이를 사용하지 않으므로 짧은 글의 빈 공간과 좁은 내부 스크롤이 사라집니다.
      height: 'auto',
      // 작성 화면의 남는 공간을 활용할 수 있도록 빈 글의 기본 입력 높이는 확보합니다.
      minHeight: '400px',
      usageStatistics: false,
      useCommandShortcut: true,
      hideModeSwitch: true,
      toolbarItems: [
        ['heading', 'bold', 'italic', 'strike'],
        ['hr', 'quote'],
        ['ul', 'ol', 'task', 'indent', 'outdent'],
        [
          { name: 'alignLeft', tooltip: '왼쪽 정렬', el: alignLeftButton },
          { name: 'alignCenter', tooltip: '가운데 정렬', el: alignCenterButton },
          { name: 'alignRight', tooltip: '오른쪽 정렬', el: alignRightButton },
        ],
        ['table', 'link'],
        ['code'],
      ],
      events: {
        change: () => {
          setContent(editor.getHTML())
          setValidationMessage(null)
        },
      },
    })

    editor.changeMode('wysiwyg', true)
    editorRef.current = editor

    const addAlignmentCommand = (
      commandName: string,
      alignment: 'left' | 'center' | 'right',
    ) => {
      editor.addCommand(
        'wysiwyg',
        commandName,
        (_payload, state, dispatch, view) => {
          const { from, to, $from } = state.selection
          const targetPositions = new Set<number>()

          state.doc.nodesBetween(
            from,
            Math.min(Math.max(to, from + 1), state.doc.content.size),
            (node, position) => {
              if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                targetPositions.add(position)
              }
            },
          )

          for (let depth = $from.depth; depth > 0; depth -= 1) {
            const node = $from.node(depth)

            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              targetPositions.add($from.before(depth))
              break
            }
          }

          if (targetPositions.size === 0) return false

          let transaction = state.tr

          targetPositions.forEach((position) => {
            const node = state.doc.nodeAt(position)
            if (!node) return

            const nextClassNames = (node.attrs.classNames ?? []).filter(
              (className: string) =>
                !className.startsWith('board-text-align-'),
            )

            if (alignment !== 'left') {
              nextClassNames.push(`board-text-align-${alignment}`)
            }

            transaction = transaction.setNodeMarkup(
              position,
              undefined,
              {
                ...node.attrs,
                classNames:
                  nextClassNames.length > 0 ? nextClassNames : null,
              },
            )
          })

          dispatch(transaction.scrollIntoView())
          view.focus()
          return true
        },
      )
    }

    addAlignmentCommand('alignLeft', 'left')
    addAlignmentCommand('alignCenter', 'center')
    addAlignmentCommand('alignRight', 'right')

    if (storedBlockAlignments.some((alignment) => alignment !== 'left')) {
      editor.addCommand(
        'wysiwyg',
        'restoreStoredAlignments',
        (_payload, state, dispatch) => {
          const blockPositions: number[] = []

          state.doc.descendants((node, position) => {
            if (node.type.name === 'paragraph' || node.type.name === 'heading') {
              blockPositions.push(position)
            }
          })

          let transaction = state.tr
          let hasChanges = false

          blockPositions.forEach((position, index) => {
            const alignment = storedBlockAlignments[index]
            const node = state.doc.nodeAt(position)
            if (!alignment || !node) return

            const nextClassNames = (node.attrs.classNames ?? []).filter(
              (className: string) =>
                !className.startsWith('board-text-align-'),
            )

            if (alignment !== 'left') {
              nextClassNames.push(`board-text-align-${alignment}`)
            }

            transaction = transaction.setNodeMarkup(
              position,
              undefined,
              {
                ...node.attrs,
                classNames:
                  nextClassNames.length > 0 ? nextClassNames : null,
              },
            )
            hasChanges = true
          })

          if (!hasChanges) return false

          dispatch(transaction)
          return true
        },
      )
      editor.exec('restoreStoredAlignments')
      setContent(editor.getHTML())
    }

    alignLeftButton.addEventListener('click', () => editor.exec('alignLeft'))
    alignCenterButton.addEventListener('click', () => editor.exec('alignCenter'))
    alignRightButton.addEventListener('click', () => editor.exec('alignRight'))

    const handleEmptyTableDelete = (event: KeyboardEvent) => {
      if (event.key !== 'Backspace' && event.key !== 'Delete') return

      const selectionNode = window.getSelection()?.anchorNode
      const selectionElement = selectionNode instanceof Element
        ? selectionNode
        : selectionNode?.parentElement
      const selectedHeading = selectionElement?.closest('h1, h2')
      const selectedTable = selectionElement?.closest('table')

      if (selectedHeading && !selectedHeading.textContent?.trim()) {
        event.preventDefault()
        editor.exec('heading', { level: 0 })
        return
      }

      // Toast UI는 새 표를 만들 때 내용이 없는 머리글 행도 함께 생성합니다.
      // 빈 표 안에서 Delete/Backspace를 누르면 셀이 아니라 표 전체를 삭제합니다.
      if (!selectedTable || selectedTable.textContent?.trim()) return

      event.preventDefault()
      editor.exec('removeTable')
    }

    const handleActiveListToggle = (event: MouseEvent) => {
      const target = event.target
      const button = target instanceof Element
        ? target.closest<HTMLButtonElement>(
            '.toastui-editor-toolbar-icons.bullet-list.active, ' +
            '.toastui-editor-toolbar-icons.ordered-list.active, ' +
            '.toastui-editor-toolbar-icons.task-list.active',
          )
        : null

      if (!button) return

      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      editor.exec('outdent')
    }

    editorHost.addEventListener('keydown', handleEmptyTableDelete)
    editorHost.addEventListener('click', handleActiveListToggle, true)

    return () => {
      editorHost.removeEventListener('keydown', handleEmptyTableDelete)
      editorHost.removeEventListener('click', handleActiveListToggle, true)
      editor.destroy()
      editorRef.current = null
    }
  }, [initialContent])

  const handleSubmit = async () => {
    const trimmedTitle = title.trim()
    const latestContent = editorRef.current?.getHTML() ?? content
    const trimmedContent = latestContent.trim()
    const plainTextContent = new DOMParser()
      .parseFromString(trimmedContent, 'text/html')
      .body.textContent
      ?.trim() ?? ''

    if (!trimmedTitle) {
      setValidationMessage('제목을 입력해주세요.')
      return
    }

    if (!plainTextContent) {
      setValidationMessage('내용을 입력해주세요.')
      return
    }

    if (trimmedContent.length > 4000) {
      setValidationMessage('내용은 4000자 이하여야 합니다.')
      return
    }

    if (boardType === 'department' && !selectedDepartmentCode.trim()) {
      setValidationMessage('부서게시판은 하위 부서를 선택한 뒤 작성할 수 있습니다.')
      return
    }

    if (isProjectBoard && !effectiveProjectId) {
      setValidationMessage('프로젝트 게시판은 프로젝트를 선택한 뒤 작성할 수 있습니다.')
      return
    }

    if (isEditMode && !boardId) {
      setValidationMessage('수정할 게시글 정보를 찾을 수 없습니다.')
      return
    }

    try {
      setValidationMessage(null)

      const attachmentFileId = selectedFile
        ? (await uploadBoardFile({
            file: selectedFile,
            fileCn: trimmedTitle,
          })).data
        : initialAttachmentFileId ?? 0

      const request: BoardMutationRequest = {
        boardTypeCd: isEditMode && (
          validBoardTypeCodes.has(originalBoardTypeCd) ||
          originalBoardTypeCd === 'PROJ'
        )
          ? originalBoardTypeCd
          : resolvedBoardTypeCd,
        boardSj: trimmedTitle,
        boardCn: trimmedContent,
        boardAtchFileId: attachmentFileId ?? 0,
        deptCd: isProjectBoard
          ? ''
          : isEditMode
          ? originalDepartmentCode
          : boardType === 'department' ? selectedDepartmentCode : '',
        projId: isProjectBoard ? effectiveProjectId : 0,
        imprtntYn: isImportant ? 'Y' : 'N',
        cmntUseYn: boardType === 'notice' || allowComments ? 'Y' : 'N',
      }

      if (isEditMode && boardId) {
        await updateBoard({
          type: isProjectBoard ? 'free' : boardType as BoardKind,
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
           제목 <span className="text-red-500">*</span>
          </label>
          <div className="flex w-full items-center ">
            {isFixedProjectBoard ? (
              <div className="">
                
              </div>
            ) : (
              <select
                value={boardType}
                onChange={(event) => {
                  setBoardType(event.target.value as BoardWriteKind)
                  setValidationMessage(null)
                }}
                disabled={isEditMode}
                className="h-11 w-fit rounded-md border border-slate-300 bg-white pl-2 pr-7 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                {selectableBoardOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}

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

            {isProjectBoard && !isFixedProjectBoard && (
              <select
                value={effectiveProjectId || ''}
                onChange={(event) => {
                  setSelectedProjectId(Number(event.target.value))
                  setValidationMessage(null)
                }}
                disabled={isEditMode}
                className="h-11 w-52 rounded-md border border-slate-300 bg-white pl-2 pr-7 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500"
              >
                <option value="">프로젝트 선택</option>
                {projectOptions.map((option) => (
                  <option key={option.scopeId} value={Number(option.scopeId)}>
                    {option.scopeName}
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
            <div className="board-toast-editor">
              <div ref={editorHostRef} className="board-write-editor" />
            </div>

            <div className="flex h-10 items-center justify-between border-t border-slate-200 px-5 text-sm font-medium text-slate-500">
              <span>입력 바이트: {contentByteLength.toLocaleString()} / 10,000 byte</span>
            </div>
          </div>

          <span className="pt-3 text-base font-bold text-slate-950">
            첨부 파일
          </span>
          <div className="flex min-w-0 flex-col gap-2">
            <FileUpload
              label={selectedFile?.name ?? '파일 선택'}
              helperText={
                selectedFile
                  ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                  : '파일을 선택하거나 영역에 끌어다 놓으세요.'
              }
              onChange={(event) => {
                const nextFile = event.target.files?.[0] ?? null

                if (selectedImagePreviewUrlRef.current) {
                  URL.revokeObjectURL(selectedImagePreviewUrlRef.current)
                }

                const nextPreviewUrl = nextFile?.type.startsWith('image/')
                  ? URL.createObjectURL(nextFile)
                  : null

                selectedImagePreviewUrlRef.current = nextPreviewUrl
                setSelectedFile(nextFile)
                setSelectedImagePreviewUrl(nextPreviewUrl)
                setValidationMessage(null)
              }}
            />

            {selectedImagePreviewUrl && (
              <div className="flex justify-center">
                <img
                  src={selectedImagePreviewUrl}
                  alt="첨부 이미지 미리보기"
                  className="h-auto max-h-96 max-w-full rounded-md border border-slate-200 object-contain"
                />
              </div>
            )}

            {initialAttachmentFileId ? (
              <p className="text-xs text-slate-500">
                기존 첨부파일 ID: {initialAttachmentFileId}
              </p>
            ) : (
              <p className="text-xs text-slate-400">
                게시글 등록 시 선택한 파일이 함께 업로드됩니다.
              </p>
            )}
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

              {(isProjectBoard || boardType !== 'notice') && (
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
