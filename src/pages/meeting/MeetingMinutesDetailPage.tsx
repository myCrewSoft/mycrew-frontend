import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'
import { meetingApi } from '../../api/meetingApi'
import Button from '../../components/common/button/Button'
import PageComponent from '../../components/layouts/PageComponent'
import { useApi } from '../../hooks/useApi'
import type { MeetingDetail } from '../../types/meeting.dto'
import MeetingMinutesPage from './MeetingMinutesPage'

const MeetingMinutesDetailPage = () => {
  const navigate = useNavigate()
  const { mtngId } = useParams<{ mtngId: string }>()
  const meetingId = Number(mtngId)

  const {
    data: meeting,
    loading,
    error,
    execute: fetchMeetingDetail,
  } = useApi<MeetingDetail, [number]>(meetingApi.getMeeting, {
    immediate: false,
  })

  useEffect(() => {
    if (!Number.isFinite(meetingId) || meetingId <= 0) return
    void fetchMeetingDetail(meetingId)
  }, [fetchMeetingDetail, meetingId])

  const goBackToList = () => {
    navigate('/meeting/history')
  }

  if (!Number.isFinite(meetingId) || meetingId <= 0) {
    return (
      <PageComponent
        title="회의록"
        description="회의 정보를 확인할 수 없습니다."
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={goBackToList}
          >
            목록으로
          </Button>
        }
      >
        <section className="rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          올바르지 않은 회의록 주소입니다.
        </section>
      </PageComponent>
    )
  }

  if (loading || (!meeting && !error)) {
    return (
      <PageComponent title="회의록" description="회의 정보를 불러오는 중입니다.">
        <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 text-sm font-bold text-slate-600">
          회의록 정보를 불러오는 중입니다.
        </section>
      </PageComponent>
    )
  }

  if (error || !meeting) {
    return (
      <PageComponent
        title="회의록"
        description="회의록 정보를 불러오지 못했습니다."
        actions={
          <Button
            variant="outline"
            leftIcon={<ArrowLeft size={16} />}
            onClick={goBackToList}
          >
            목록으로
          </Button>
        }
      >
        <section className="flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          <AlertCircle size={17} />
          회의록 정보를 불러오지 못했습니다.
        </section>
      </PageComponent>
    )
  }

  return <MeetingMinutesPage meeting={meeting} onBack={goBackToList} />
}

export default MeetingMinutesDetailPage
