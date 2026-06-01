import { useMemo, useState } from 'react'
import {
  ChevronRight,
  FileArchive,
  Menu,
  Megaphone,
  MessageSquare,
  Send,
  ThumbsUp,
} from 'lucide-react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Button from '../../components/common/button/Button'
import type { BoardKind } from '../../types/board'
import type { BoardAttachment, BoardDetail } from '../../types/boardDetail'

const boardLabelByType: Record<BoardKind, string> = {
  notice: '공지사항',
  department: '부서게시판',
  free: '자유게시판',
  anonymous: '익명게시판',
}

const boardBadgeClassByType: Record<BoardKind, string> = {
  notice: 'border-blue-200 bg-blue-50 text-blue-600',
  department: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  free: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  anonymous: 'border-violet-200 bg-violet-50 text-violet-600',
}

const attachmentIconClassByType: Record<BoardAttachment['fileType'], string> = {
  pdf: 'bg-red-500 text-white',
  doc: 'bg-blue-500 text-white',
  xls: 'bg-emerald-500 text-white',
  image: 'bg-violet-500 text-white',
  etc: 'bg-slate-500 text-white',
}  

const getBoardTypeFromPath = (pathname: string): BoardKind => {
  if (pathname.includes('/departments')) return 'department'
  if (pathname.includes('/free')) return 'free'
  if (pathname.includes('/anonymous')) return 'anonymous'
  return 'notice'
}

const sampleDetailByType: Record<BoardKind, BoardDetail> = {
  notice: {
    id: 1025,
    type: 'notice',
    badgeLabel: '공지',
    title: '2024년 하반기 정기 안전 교육 안내',
    authorName: '관리자',
    authorDepartment: '총무팀',
    createdAt: '2024.08.20 10:30',
    viewCount: 256,
    likeCount: 0,
    commentCount: 0,
    commentsEnabled: false,
    content: [
      '안녕하세요, 임직원 여러분.',
      '2024년 하반기 정기 안전 교육 일정을 아래와 같이 안내드립니다.',
      '모든 임직원분들의 적극적인 참여 부탁드립니다.',
      '■ 교육 일시: 2024.09.03 (화) 10:00 ~ 12:00',
      '■ 교육 장소: 본사 3층 대회의실',
      '■ 교육 내용: 산업 안전 보건 교육',
      '■ 대상: 전 임직원',
      '감사합니다.',
    ],
    attachments: [
      { id: 1, fileName: '2024년 하반기 안전 교육 계획.pdf', fileSize: '1.25MB', fileType: 'pdf' },
      { id: 2, fileName: '안전 교육 자료.docx', fileSize: '2.04MB', fileType: 'doc' },
    ],
    comments: [],
  },
  department: {
    id: 105,
    type: 'department',
    badgeLabel: '부서게시판',
    title: '이번 주 업무 공유 및 협조 요청',
    authorName: '김철수',
    authorDepartment: '개발팀',
    createdAt: '2024.08.20 10:30',
    viewCount: 73,
    likeCount: 5,
    commentCount: 8,
    commentsEnabled: true,
    content: [
      '안녕하세요 개발팀 여러분,',
      '이번 주 진행 중인 업무 상황과 협조가 필요한 사항을 공유드립니다.',
      '• A 프로젝트: API 개발 진행 중 (예상 대비 70%)',
      '• B 프로젝트: 디자인 시안 검토 요청',
      '• C 프로젝트: QA 테스트 시작 예정',
      '각 담당자분들은 일정 확인 부탁드리며,',
      '추가 협조 사항은 댓글로 남겨주시면 감사하겠습니다.',
      '감사합니다!',
    ],
    attachments: [
      { id: 3, fileName: '개발팀 업무 현황.xlsx', fileSize: '15.6KB', fileType: 'xls' },
    ],
    comments: [
      {
        id: 1,
        authorName: '이영희',
        departmentName: '디자인팀',
        content: 'B 프로젝트 관련 디자인 시안 오늘 오후에 공유드리겠습니다.',
        createdAt: '2024.08.20 10:45',
      },
      {
        id: 2,
        authorName: '박민수',
        departmentName: '개발팀',
        content: 'A 프로젝트 관련해서 추가 논의가 필요할 것 같습니다.',
        createdAt: '2024.08.20 10:50',
        isReply: true,
      },
      {
        id: 3,
        authorName: '최지훈',
        departmentName: 'QA팀',
        content: 'C 프로젝트 테스트 일정 확인했습니다. 준비하겠습니다.',
        createdAt: '2024.08.20 11:02',
      },
    ],
  },
  free: {
    id: 205,
    type: 'free',
    badgeLabel: '자유게시판',
    title: '점심 메뉴 추천 받아요',
    authorName: '홍길동',
    createdAt: '2024.08.20 09:20',
    viewCount: 128,
    likeCount: 12,
    commentCount: 4,
    commentsEnabled: true,
    content: [
      '오늘 점심 같이 드실 분 계신가요?',
      '회사 근처 새로 생긴 국밥집이나 샐러드 가게 중에 고민 중입니다.',
      '괜찮은 곳 있으면 댓글로 추천해주세요.',
    ],
    attachments: [],
    comments: [
      {
        id: 4,
        authorName: '김민수',
        content: '새로 생긴 국밥집 괜찮았습니다. 대기만 조금 있어요.',
        createdAt: '2024.08.20 09:31',
      },
    ],
  },
  anonymous: {
    id: 305,
    type: 'anonymous',
    badgeLabel: '익명게시판',
    title: '연차 사용 눈치 보일 때...',
    authorName: '익명1',
    createdAt: '2024.08.20 08:45',
    viewCount: 156,
    likeCount: 7,
    commentCount: 3,
    commentsEnabled: true,
    content: [
      '연차를 자유롭게 쓰는 문화가 더 자리 잡았으면 좋겠습니다.',
      '업무 일정에 지장이 없도록 공유하고 조율하는 건 당연하지만, 필요 이상으로 눈치를 보지 않아도 되는 분위기가 되었으면 합니다.',
    ],
    attachments: [],
    comments: [
      {
        id: 5,
        authorName: '익명2',
        content: '공감합니다. 팀별로 분위기 차이가 큰 것 같아요.',
        createdAt: '2024.08.20 09:00',
      },
    ],
  },
}

const BoardDetailPage = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { boardId } = useParams()
  const boardType = getBoardTypeFromPath(location.pathname)
  const [commentText, setCommentText] = useState('')
  const detail = useMemo(() => {
    const sample = sampleDetailByType[boardType]
    return { ...sample, id: Number(boardId) || sample.id }
  }, [boardId, boardType])

  const handleSubmitComment = () => {
    if (!commentText.trim()) return
    setCommentText('')
  }

  return (
    <section className="flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-sm">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 px-6 text-sm font-semibold text-slate-500">
        <button
          type="button"
          aria-label="게시판 메뉴"
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu size={19} />
        </button>
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-slate-500 transition-colors hover:text-slate-900"
        >
          게시판
        </button>
        <ChevronRight size={15} />
        <span>{boardLabelByType[boardType]}</span>
        <ChevronRight size={15} />
        <span className="text-slate-900">게시글 상세</span>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/70 p-7">
        <article className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-7 shadow-sm">
          <div className="border-b border-slate-200 pb-6">
            <div className="mb-4 flex items-center gap-3">
              <span
                className={`rounded-md border px-2.5 py-1 text-xs font-bold ${boardBadgeClassByType[detail.type]}`}
              >
                {detail.badgeLabel}
              </span>
              <h1 className="min-w-0 text-2xl font-bold text-slate-950">{detail.title}</h1>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-medium text-slate-500">
              <span className="font-bold text-slate-800">
                {detail.authorName}
                {detail.authorDepartment ? ` (${detail.authorDepartment})` : ''}
              </span>
              <span>{detail.createdAt}</span>
              <span>조회 {detail.viewCount}</span>
            </div>
          </div>

          <div className="space-y-3 whitespace-pre-line border-b border-slate-200 py-7 text-[15px] font-medium leading-7 text-slate-800">
            {detail.content.map((line,index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          <section className="border-b border-slate-200 py-5">
            <h2 className="mb-3 text-sm font-bold text-slate-900">
              첨부파일 {detail.attachments.length}
            </h2>

            {detail.attachments.length > 0 ? (
              <div className="space-y-2">
                {detail.attachments.map((file) => (
                  <button
                    key={file.id}
                    type="button"
                    className="flex h-11 w-full items-center gap-3 rounded-md border border-slate-200 px-3 text-left text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                  >
                    <span
                      className={`inline-flex h-6 w-6 items-center justify-center rounded text-[10px] font-black ${attachmentIconClassByType[file.fileType]}`}
                    >
                      {file.fileType === 'etc' ? <FileArchive size={14} /> : file.fileType.toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate">{file.fileName}</span>
                    <span className="text-xs font-medium text-slate-500">{file.fileSize}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex h-11 items-center rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-400">
                첨부된 파일이 없습니다.
              </div>
            )}
          </section>

          {detail.commentsEnabled ? (
            <section className="pt-4">
              <div className="mb-3 flex items-center justify-between text-sm font-bold">
                <button type="button" className="inline-flex items-center gap-2 text-blue-600">
                  <ThumbsUp size={17} />
                  좋아요 {detail.likeCount}
                </button>
                <span className="inline-flex items-center gap-2 text-slate-700">
                  <MessageSquare size={17} />
                  댓글 {detail.commentCount}
                </span>
              </div>

              <div className="divide-y divide-slate-200 rounded-lg border border-slate-200 bg-slate-50">
                {detail.comments.map((comment) => (
                  <div key={comment.id} className={`flex gap-3 px-4 py-3 ${comment.isReply ? 'pl-9' : ''}`}>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-300 text-xs font-bold text-white">
                      {comment.authorName.slice(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-sm">
                        <span className="font-bold text-slate-800">
                          {comment.authorName}
                          {comment.departmentName ? ` (${comment.departmentName})` : ''}
                        </span>
                      </div>
                      <p className="text-sm font-medium leading-6 text-slate-700">{comment.content}</p>
                      <div className="mt-1 flex items-center gap-3 text-xs font-medium text-slate-500">
                        <span>{comment.createdAt}</span>
                        <button type="button" className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-slate-600">
                          답글
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-2 bg-white p-3">
                  <input
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                    placeholder="댓글을 입력하세요."
                    className="h-10 min-w-0 flex-1 rounded-md border border-slate-200 px-3 text-sm outline-none transition-colors placeholder:text-slate-400 focus:border-blue-400"
                  />
                  <Button size="sm" onClick={handleSubmitComment} leftIcon={<Send size={15} />} className="h-10 rounded-md px-5">
                    등록
                  </Button>
                </div>
              </div>
            </section>
          ) : (
            <section className="pt-5">
              <div className="flex h-16 items-center gap-3 rounded-md border border-blue-200 bg-blue-50 px-4 text-sm font-semibold text-slate-700">
                <Megaphone size={18} className="text-slate-700" />
                공지사항 게시판은 댓글 기능이 제공되지 않습니다.
              </div>
            </section>
          )}
        </article>
      </div>
    </section>
  )
}

export default BoardDetailPage

