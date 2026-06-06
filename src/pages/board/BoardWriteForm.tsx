import { useMemo, useState } from 'react'
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
import type { BoardKind } from '../../types/board'

interface BoardWriteFormProps {
  initialBoardType?: BoardKind
  onClose?: () => void
}

interface ToolbarItem {
  icon?: LucideIcon
  text?: string
  label: string
  className?: string
}

const boardOptions: Array<{ value: BoardKind; label: string }> = [
  { value: 'notice', label: '공지사항' },
  { value: 'department', label: '부서게시판' },
  { value: 'free', label: '자유게시판' },
  { value: 'anonymous', label: '익명게시판' },
]

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

const BoardWriteForm = ({
  initialBoardType = 'notice',
  onClose,
}: BoardWriteFormProps) => {
  const [boardType, setBoardType] = useState<BoardKind>(initialBoardType)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [allowComments, setAllowComments] = useState(true)

  const contentByteLength = useMemo(
    () => new Blob([content]).size,
    [content],
  )

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <header className="flex h-[70px] shrink-0 items-center justify-between border-b border-slate-200 px-7">
        <h1 className="text-xl font-bold text-slate-950">게시글 작성</h1>

        <button
          type="button"
          aria-label="작성 닫기"
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
              onChange={(event) => setBoardType(event.target.value as BoardKind)}
              className="h-11 w-fit rounded-md border border-slate-300 bg-white pl-2 pr-7 text-sm font-medium text-slate-800 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            >
              {boardOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

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
            <div className="flex h-12 items-center gap-1 border-b border-slate-200 px-4">
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
              <span>입력 글자수: {contentByteLength.toLocaleString()} / 10,000 byte</span>
              <span>임시저장&nbsp;&nbsp;10:30:25</span>
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
                  파일을 선택하거나 이 영역에 끌어 놓으세요.
                </span>
              </div>

              <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-md border border-slate-300 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100">
                <Upload size={16} />
                <span>파일 선택</span>
                <input type="file" className="hidden" />
              </label>
            </div>

            <p className="text-xs text-slate-400">
              최대 10개, 개당 50MB까지 첨부 가능합니다.
            </p>
          </div>

          <span className="pt-1 text-base font-bold text-slate-950">추가 설정</span>
          <div className="flex items-center gap-9">
            <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={isImportant}
                onChange={(event) => setIsImportant(event.target.checked)}
                className="h-5 w-5 rounded border-slate-300 accent-blue-600"
              />
              중요글로 등록
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
        </div>
      </div>

      <footer className="flex h-[84px] shrink-0 items-center justify-end gap-3 border-t border-slate-200 px-7">
        <Button size="sm" className="h-11 rounded-md px-11">
          등록하기
        </Button>

        <Button variant="outline" size="sm" className="h-11 rounded-md px-11">
          취소하기
        </Button>
      </footer>
    </section>
  )
}

export default BoardWriteForm
