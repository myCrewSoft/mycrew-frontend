// src/pages/project/components/ProjectInfoCard.tsx

import { Calendar, CalendarCheck, Crown, Activity } from 'lucide-react'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import Badge from '../../components/common/dataDisplay/badge/Badge'

interface ProjectInfoCardProps {
  projBgngYmd: string
  projEndYmd: string
  projStatCd: string
  projLdrNm: string
}

const STATUS_LABEL: Record<string, string> = {
  '01': '예정',
  '02': '진행 중',
  '03': '완료',
  '04': '중단',
}

const STATUS_VARIANT: Record<string, 'primary' | 'neutral' | 'danger' | 'success'> = {
  '01': 'neutral',
  '02': 'primary',
  '03': 'success',
  '04': 'danger',
}

const ProjectInfoCard = ({
  projBgngYmd,
  projEndYmd,
  projStatCd,
  projLdrNm,
}: ProjectInfoCardProps) => {
  return (
    <ContentCard title="프로젝트 정보">
      <div className="flex flex-col gap-4">

        {/* 날짜 구역 */}
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            일정
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Calendar size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">시작일</p>
              <p className="text-sm font-semibold text-slate-800">{projBgngYmd}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <CalendarCheck size={15} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-slate-400">마감 예정일</p>
              <p className="text-sm font-semibold text-slate-800">{projEndYmd}</p>
            </div>
          </div>
        </div>

        {/* 프로젝트 장 구역 */}
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            담당
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
              <Crown size={15} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">프로젝트 장</p>
              <p className="text-sm font-semibold text-slate-800">{projLdrNm}</p>
            </div>
          </div>
        </div>

        {/* 상태 구역 */}
        <div className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            상태
          </p>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-green-100">
              <Activity size={15} className="text-green-500" />
            </div>
            <div>
              <p className="text-xs text-slate-400">현재 상태</p>
              <div className="mt-0.5">
                <Badge variant={STATUS_VARIANT[projStatCd]}>
                  {STATUS_LABEL[projStatCd]}
                </Badge>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ContentCard>
  )
}

export default ProjectInfoCard