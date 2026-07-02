import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Save,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { meetingApi } from '../../api/meetingApi'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import Button from '../../components/common/button/Button'
import Textarea from '../../components/common/form/textarea/Textarea'
import PageComponent from '../../components/layouts/PageComponent'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import { useToast } from '../../components/common/toast/useToast'
import { useApi } from '../../hooks/useApi'
import type {
  MeetingDetail,
  MeetingMinutesResponse,
  MeetingParticipant,
} from '../../types/meeting.dto'

interface ActionItem {
  assignee: string
  content: string
  deadline: string
}

interface MinutesFormData {
  purpose: string
  discussion: string
  decisions: string
  actionItems: ActionItem[]
  notes: string
}

interface MinutesRevision {
  revisionId: number
  version: number
  content: string
  modifiedByName: string
  modifiedAt: string
}

interface MinutesHistoryItem {
  histId: number
  momCn: string
  edtrNm: string
  editDt: string
}

interface MeetingMinutesPageProps {
  meeting: MeetingDetail
  onBack: () => void
}

const defaultMinutesForm = (): MinutesFormData => ({
  purpose: '',
  discussion: '',
  decisions: '',
  actionItems: [{ assignee: '', content: '', deadline: '' }],
  notes: '',
})

const parseMinutesHtml = (html: string): MinutesFormData => {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const boxes = doc.querySelectorAll('.content-box')
  const rows = Array.from(doc.querySelectorAll('.action-table tr')).slice(1)

  const actionItems: ActionItem[] = rows.map((row) => {
    const cells = row.querySelectorAll('td')
    return {
      assignee: cells[0]?.textContent ?? '',
      content: cells[1]?.textContent ?? '',
      deadline: cells[2]?.textContent ?? '',
    }
  })

  return {
    purpose: boxes[0]?.textContent ?? '',
    discussion: boxes[1]?.textContent ?? '',
    decisions: boxes[2]?.textContent ?? '',
    actionItems:
      actionItems.length > 0
        ? actionItems
        : [{ assignee: '', content: '', deadline: '' }],
    notes: boxes[3]?.textContent ?? '',
  }
}

const buildMinutesHtml = (form: MinutesFormData, baseHtml: string) => {
  const doc = new DOMParser().parseFromString(baseHtml, 'text/html')
  const boxes = doc.querySelectorAll('.content-box')

  if (boxes[0]) boxes[0].textContent = form.purpose
  if (boxes[1]) boxes[1].textContent = form.discussion
  if (boxes[2]) boxes[2].textContent = form.decisions
  if (boxes[3]) boxes[3].textContent = form.notes

  const actionTable = doc.querySelector('.action-table')
  if (actionTable) {
    const headerRow = actionTable.querySelector('tr')
    actionTable.innerHTML = ''
    if (headerRow) actionTable.appendChild(headerRow)

    form.actionItems.forEach((item) => {
      const row = doc.createElement('tr')
      row.innerHTML = `<td>${item.assignee}</td><td>${item.content}</td><td>${item.deadline}</td>`
      actionTable.appendChild(row)
    })
  }

  return `<!DOCTYPE html>${doc.documentElement.outerHTML}`
}

const formatDateTime = (dateTime?: string | null) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const getMomStatusLabel = (code?: string | null) => {
  const labels: Record<string, string> = {
    '01': 'AI 초안',
    '02': '편집 중',
    '03': '검토 중',
    '04': '확정',
  }

  return code ? (labels[code] ?? '생성 중') : '생성 전'
}

const isApprovalStarted = (code?: string | null) =>
  code === '03' || code === '04'

const getRecordingLabel = (meeting: MeetingDetail) => {
  if (meeting.vconfId === null) return '해당 없음'
  return meeting.rcrdgAtchFileId ? '생성 완료' : '녹취록 없음'
}

const MeetingMinutesPage = ({ meeting, onBack }: MeetingMinutesPageProps) => {
  const { showToast } = useToast()
  const [momData, setMomData] = useState<MeetingMinutesResponse | null>(null)
  const [minutesContent, setMinutesContent] = useState('')
  const [minutesEditing, setMinutesEditing] = useState(false)
  const [minutesForm, setMinutesForm] =
    useState<MinutesFormData>(defaultMinutesForm)
  const [selectedRevision, setSelectedRevision] =
    useState<MinutesRevision | null>(null)

  const { execute: fetchMom } = useApi(meetingApi.getMom, {
    immediate: false,
  })
  const { loading: createEmptyMomLoading, execute: createEmptyMom } = useApi(
    meetingApi.createEmptyMom,
    { immediate: false },
  )
  const { loading: updateMomLoading, execute: updateMom } = useApi(
    meetingApi.updateMom,
    { immediate: false },
  )
  const { execute: requestReview } = useApi(meetingApi.requestMomApproval, {
    immediate: false,
  })
  const { loading: regenerateLoading, execute: execRegenerateAiDraft } = useApi(
    meetingApi.regenerateAiDraft,
    { immediate: false },
  )

  useEffect(() => {
    void fetchMom(meeting.mtngId)
      .then((response) => {
        const content = response.data?.momCn ?? ''
        setMomData(response.data ?? null)
        setMinutesContent(content)
      })
      .catch(() => {
        setMomData(null)
        setMinutesContent('')
      })
  }, [fetchMom, meeting.mtngId])

  const revisions = useMemo<MinutesRevision[]>(
    () =>
      (momData?.histList ?? []).map(
        (history: MinutesHistoryItem, index: number) => ({
          revisionId: history.histId,
          version: (momData?.histList.length ?? 0) - index,
          content: history.momCn,
          modifiedByName: history.edtrNm,
          modifiedAt: history.editDt,
        }),
      ),
    [momData],
  )

  const isOfflineMeeting = meeting.vconfId === null
  const approvalStarted = isApprovalStarted(
    momData?.momSttusCd ?? meeting.momSttusCd,
  )

  const startEditing = () => {
    setMinutesForm(parseMinutesHtml(minutesContent))
    setMinutesEditing(true)
  }

  const handleSave = async () => {
    try {
      const newHtml = buildMinutesHtml(minutesForm, minutesContent)
      await updateMom(meeting.mtngId, { momCn: newHtml })
      const fresh = await fetchMom(meeting.mtngId)
      setMomData(fresh.data ?? null)
      setMinutesContent(fresh.data?.momCn ?? newHtml)
      setMinutesEditing(false)
    } catch {
      showToast({
        title: '회의록 저장에 실패했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleStartOfflineMinutes = async () => {
    try {
      let existingResponse: Awaited<ReturnType<typeof fetchMom>> | null = null

      try {
        existingResponse = await fetchMom(meeting.mtngId)
      } catch {
        existingResponse = null
      }

      if (existingResponse?.data) {
        const existingContent = existingResponse.data?.momCn ?? minutesContent
        const updatedResponse = await updateMom(meeting.mtngId, {
          momCn: existingContent,
        })
        const content = updatedResponse.data?.momCn ?? existingContent

        setMomData(updatedResponse.data ?? existingResponse.data ?? null)
        setMinutesContent(content)
        setMinutesForm(parseMinutesHtml(content))
        setMinutesEditing(true)
        showToast({
          title: '회의록 수정을 시작합니다.',
          description: '회의 내용을 직접 수정한 뒤 저장해 주세요.',
          variant: 'success',
        })
        return
      }

      await createEmptyMom(meeting.mtngId)
      const response = await fetchMom(meeting.mtngId)
      const content = response.data?.momCn ?? ''
      setMomData(response.data ?? null)
      setMinutesContent(content)
      setMinutesForm(parseMinutesHtml(content))
      setMinutesEditing(true)
      showToast({
        title: '회의록 작성을 시작합니다.',
        description: '회의 내용을 직접 입력한 뒤 저장해 주세요.',
        variant: 'success',
      })
    } catch (error) {
      showToast({
        title: '회의록을 생성하지 못했습니다.',
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleRequestReview = async () => {
    try {
      await requestReview(meeting.mtngId)
      const response = await fetchMom(meeting.mtngId)
      setMomData(response.data ?? null)
      setMinutesContent(response.data?.momCn ?? minutesContent)
    } catch {
      showToast({
        title: '결재 요청에 실패했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleRegenerateAiDraft = async () => {
    try {
      await execRegenerateAiDraft(meeting.mtngId)
      showToast({
        title: 'AI 초안 재생성을 요청했습니다.',
        description: '완료되면 회의록 페이지를 새로고침해 확인하세요.',
        variant: 'success',
      })
    } catch {
      showToast({
        title: 'AI 초안 재생성에 실패했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleDownloadRecording = async () => {
    if (meeting.vconfId === null || !meeting.rcrdgAtchFileId) return
    try {
      const response = await meetingApi.downloadRcrdg(meeting.vconfId, meeting.rcrdgAtchFileId)
      const url = URL.createObjectURL(new Blob([response.data as BlobPart]))
      const a = document.createElement('a')
      a.href = url
      a.download = `recording_${meeting.vconfId}.webm`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      showToast({
        title: '녹취록을 다운로드하지 못했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  const handleStreamRecording = async () => {
    if (meeting.vconfId === null || !meeting.rcrdgAtchFileId) return
    const streamWindow = window.open('', '_blank')
    if (streamWindow) streamWindow.opener = null

    try {
      const response = await meetingApi.streamRcrdg(
        meeting.vconfId,
        meeting.rcrdgAtchFileId,
      )
      const blob = new Blob([response.data as BlobPart], {
        type: (response.data as Blob).type || 'audio/webm',
      })
      const blobUrl = URL.createObjectURL(blob)
      if (streamWindow) {
        streamWindow.location.href = blobUrl
      } else {
        window.location.assign(blobUrl)
      }
    } catch {
      streamWindow?.close()
      showToast({
        title: '녹취록을 재생하지 못했습니다.',
        description: '잠시 후 다시 시도해 주세요.',
        variant: 'danger',
      })
    }
  }

  return (
    <PageComponent
      title={meeting.mtngNm ?? '회의록'}
      description="AI 초안을 검토하고 수정한 뒤 참석자 결재를 요청합니다."
      actions={
        <Button
          variant="outline"
          leftIcon={<ArrowLeft size={16} />}
          onClick={onBack}
        >
          목록으로
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-5">
          {momData ? (
            <section className={`rounded-xl border px-5 py-4 ${approvalStarted ? 'border-emerald-100 bg-emerald-50/80' : 'border-blue-100 bg-blue-50/80'}`}>
              <p className={`flex items-center gap-2 text-sm font-bold ${approvalStarted ? 'text-emerald-800' : 'text-blue-800'}`}>
                <CheckCircle2 size={18} />
                {approvalStarted
                  ? '전자결재 요청이 완료되었습니다. 결재 진행 상황은 전자결재 메뉴에서 확인할 수 있습니다.'
                  : '회의록이 생성되었습니다. 내용을 확인한 뒤 전자결재를 요청할 수 있습니다.'}
              </p>
            </section>
          ) : (
            <section className="rounded-xl border border-slate-200 bg-slate-50 px-5 py-4">
              <p className="text-sm font-bold text-slate-600">
                아직 생성된 회의록이 없습니다.
              </p>
            </section>
          )}

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 ring-1 ring-blue-100">
                <FileText size={17} />
              </span>
              <h2 className="text-base font-bold text-slate-950">회의 정보</h2>
              <Badge variant="primary">
                {getMomStatusLabel(momData?.momSttusCd ?? meeting.momSttusCd)}
              </Badge>
            </div>
            <dl className="mt-5 grid gap-2 text-sm font-semibold text-slate-600 md:grid-cols-4">
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <dt>일시</dt>
                <dd className="mt-1 text-slate-950">
                  {formatDateTime(meeting.beginDt)}
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <dt>참여자</dt>
                <dd className="mt-1 text-slate-950">
                  {meeting.ptcptList?.length ?? 0}명
                </dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <dt>담당자</dt>
                <dd className="mt-1 text-slate-950">{meeting.crtrNm}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2.5">
                <dt>녹취록</dt>
                <dd className="mt-1">
                  {meeting.vconfId !== null && meeting.rcrdgAtchFileId ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        aria-label="녹취록 스트리밍"
                        title="스트리밍"
                        onClick={() => void handleStreamRecording()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <Play size={13} fill="currentColor" />
                      </button>
                      <button
                        type="button"
                        aria-label="녹취록 다운로드"
                        title="다운로드"
                        onClick={() => void handleDownloadRecording()}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-200 bg-white text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  ) : (
                    <span className="font-bold text-slate-500">
                      {getRecordingLabel(meeting)}
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-base font-bold text-slate-950">
                <FileText size={18} />
                회의 내용
              </h3>
              <Button
                variant={!momData && isOfflineMeeting ? 'primary' : 'outline'}
                size="sm"
                disabled={!momData && !isOfflineMeeting}
                loading={createEmptyMomLoading || updateMomLoading}
                leftIcon={
                  minutesEditing ? <Save size={15} /> : <Pencil size={15} />
                }
                onClick={() => {
                  if (minutesEditing) void handleSave()
                  else if (!momData && isOfflineMeeting) {
                    void handleStartOfflineMinutes()
                  } else startEditing()
                }}
              >
                {minutesEditing
                  ? '저장'
                  : !momData && isOfflineMeeting
                    ? '회의록 작성'
                    : '수정'}
              </Button>
            </div>

            {minutesEditing ? (
              <div className="flex flex-col gap-5">
                {(
                  [
                    ['purpose', '1. 회의 목적', '회의 목적을 입력하세요.'],
                    [
                      'discussion',
                      '2. 안건별 논의 내용',
                      '안건별 논의된 내용을 입력하세요.',
                    ],
                    ['decisions', '3. 결정 사항', '결정된 사항을 입력하세요.'],
                  ] as const
                ).map(([key, label, placeholder]) => (
                  <div key={key}>
                    <div className="mb-2 border-l-4 border-blue-500 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      {label}
                    </div>
                    <Textarea
                      value={minutesForm[key]}
                      onChange={(event) =>
                        setMinutesForm((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                      className="min-h-20"
                      placeholder={placeholder}
                    />
                  </div>
                ))}

                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex-1 border-l-4 border-blue-500 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                      4. 액션 아이템
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<Plus size={14} />}
                      onClick={() =>
                        setMinutesForm((current) => ({
                          ...current,
                          actionItems: [
                            ...current.actionItems,
                            { assignee: '', content: '', deadline: '' },
                          ],
                        }))
                      }
                    >
                      행 추가
                    </Button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="w-28 border-b border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600">
                            담당자
                          </th>
                          <th className="border-b border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600">
                            내용
                          </th>
                          <th className="w-32 border-b border-slate-200 px-3 py-2 text-left text-xs font-bold text-slate-600">
                            기한
                          </th>
                          <th className="w-10 border-b border-slate-200" />
                        </tr>
                      </thead>
                      <tbody>
                        {minutesForm.actionItems.map((item, index) => (
                          <tr
                            key={`${index}-${item.assignee}-${item.content}`}
                            className="group"
                          >
                            {(
                              [
                                ['assignee', '담당자'],
                                ['content', '내용'],
                                ['deadline', '기한 (예: 6/30)'],
                              ] as const
                            ).map(([field, placeholder]) => (
                              <td
                                key={field}
                                className="border-b border-slate-100 px-2 py-1"
                              >
                                <input
                                  className="w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm outline-none transition-colors focus:border-blue-300 focus:bg-white"
                                  value={item[field]}
                                  onChange={(event) => {
                                    const actionItems = [
                                      ...minutesForm.actionItems,
                                    ]
                                    actionItems[index] = {
                                      ...actionItems[index],
                                      [field]: event.target.value,
                                    }
                                    setMinutesForm((current) => ({
                                      ...current,
                                      actionItems,
                                    }))
                                  }}
                                  placeholder={placeholder}
                                />
                              </td>
                            ))}
                            <td className="border-b border-slate-100 px-1 py-1">
                              <button
                                type="button"
                                aria-label="행 삭제"
                                onClick={() =>
                                  setMinutesForm((current) => {
                                    const actionItems =
                                      current.actionItems.filter(
                                        (_, itemIndex) => itemIndex !== index,
                                      )
                                    return {
                                      ...current,
                                      actionItems:
                                        actionItems.length > 0
                                          ? actionItems
                                          : [
                                              {
                                                assignee: '',
                                                content: '',
                                                deadline: '',
                                              },
                                            ],
                                    }
                                  })
                                }
                                className="flex h-7 w-7 items-center justify-center rounded text-slate-400 opacity-0 transition-opacity hover:bg-red-50 hover:text-red-500 group-hover:opacity-100"
                              >
                                <Trash2 size={14} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <div className="mb-2 border-l-4 border-blue-500 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-700">
                    5. 특이사항 / 기타
                  </div>
                  <Textarea
                    value={minutesForm.notes}
                    onChange={(event) =>
                      setMinutesForm((current) => ({
                        ...current,
                        notes: event.target.value,
                      }))
                    }
                    className="min-h-20"
                    placeholder="특이사항이나 기타 내용을 입력하세요."
                  />
                </div>
              </div>
            ) : (
              <iframe
                srcDoc={
                  minutesContent.replace(/\{\{SIGN:\d+\}\}/g, '') ||
                  '<p style="color:#94a3b8;font-family:sans-serif;padding:16px">회의록 내용이 없습니다.</p>'
                }
                className="w-full rounded-xl border border-slate-100"
                sandbox="allow-same-origin"
                title="회의록 내용"
                onLoad={(e) => {
                  const doc = e.currentTarget.contentDocument
                  if (doc) e.currentTarget.style.height = `${doc.documentElement.scrollHeight}px`
                }}
              />
            )}
          </section>
        </div>

        <div className="flex h-fit flex-col gap-4 xl:sticky xl:top-6">
          <aside className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-950">전자결재</h3>
              <Badge variant={approvalStarted ? 'success' : 'warning'}>
                {approvalStarted ? '요청 완료' : '요청 전'}
              </Badge>
            </div>
            {(meeting.ptcptList ?? []).length > 0 && (
              <div className="mt-4 border-t border-slate-100 pt-4">
                <p className="mb-3 text-xs font-bold text-slate-500">
                  참석자 ({meeting.ptcptList?.length ?? 0}명)
                </p>
                <div className="flex flex-col gap-2">
                  {(meeting.ptcptList ?? []).map((p: MeetingParticipant) => (
                    <div key={p.empId} className="flex items-center gap-2.5">
                      <ProfileAvatar fileId={p.prflImgFileId} name={p.empNm} size={30} />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-800">{p.empNm}</p>
                        <p className="truncate text-xs text-slate-500">{p.deptNm}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4">
              <Button
                disabled={!momData || approvalStarted}
                leftIcon={<Send size={16} />}
                onClick={() => void handleRequestReview()}
              >
                결재 요청 발송
              </Button>
              {meeting.vconfId !== null && (
                <Button
                  variant="outline"
                  disabled={approvalStarted}
                  loading={regenerateLoading}
                  leftIcon={<RefreshCw size={16} />}
                  onClick={() => void handleRegenerateAiDraft()}
                >
                  AI 초안 재생성
                </Button>
              )}
            </div>
          </aside>

          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-950">
                <History size={16} />
                수정 이력
              </h3>
              <Badge variant="outline">{revisions.length}개 버전</Badge>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {revisions.length === 0 && (
                <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs font-semibold text-slate-500">
                  수정 이력이 없습니다.
                </p>
              )}
              {revisions.map((revision) => (
                <div
                  key={revision.revisionId}
                  className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            revision.version === revisions.length
                              ? 'primary'
                              : 'outline'
                          }
                        >
                          v{revision.version}
                        </Badge>
                        <span className="truncate text-sm font-bold text-slate-900">
                          {revision.modifiedByName}
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {formatDateTime(revision.modifiedAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      aria-label={`v${revision.version} 내용 보기`}
                      onClick={() => setSelectedRevision(revision)}
                      className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition-colors hover:border-blue-200 hover:text-blue-700"
                    >
                      <Eye size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>

      {selectedRevision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <section className="relative w-full max-w-2xl overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <button
              type="button"
              aria-label="수정 이력 닫기"
              onClick={() => setSelectedRevision(null)}
              className="absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <X size={20} />
            </button>
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-wrap items-center gap-2 pr-10">
                <Badge variant="primary">v{selectedRevision.version}</Badge>
                <h3 className="text-lg font-bold text-slate-950">
                  회의록 수정 이력
                </h3>
              </div>
              <p className="mt-2 text-sm font-semibold text-slate-500">
                {selectedRevision.modifiedByName} ·{' '}
                {formatDateTime(selectedRevision.modifiedAt)}
              </p>
            </div>
            <div className="max-h-[60vh] overflow-y-auto px-6 py-5">
              <iframe
                srcDoc={selectedRevision.content}
                className="w-full rounded-xl border border-slate-100"
                sandbox="allow-same-origin"
                title="수정 이력 내용"
                scrolling="no"
                onLoad={(e) => {
                  const doc = e.currentTarget.contentDocument
                  if (doc) e.currentTarget.style.height = `${doc.documentElement.scrollHeight}px`
                }}
              />
            </div>
            <div className="flex justify-end border-t border-slate-100 bg-slate-50/80 px-6 py-4">
              <Button
                variant="outline"
                onClick={() => setSelectedRevision(null)}
              >
                닫기
              </Button>
            </div>
          </section>
        </div>
      )}
    </PageComponent>
  )
}

export default MeetingMinutesPage
