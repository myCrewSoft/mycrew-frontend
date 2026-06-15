// src/pages/project/ProjectSummaryCard.tsx

import { CheckCircle2, Clock, PauseCircle, LayoutList } from 'lucide-react'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'

interface ProjectSummaryCardProps {
  totTaskCnt: number        // 전체 업무 수
  cmplTaskCnt: number       // 완료 업무 수
  inProgTaskCnt: number     // 진행 중 업무 수
  stopTaskCnt: number       // 중지된 업무 수
  projPrgrsRt: number       // 진척률 (0~100)
}

const ProjectSummaryCard = ({
  totTaskCnt,
  cmplTaskCnt,
  inProgTaskCnt,
  stopTaskCnt,
  projPrgrsRt,
}: ProjectSummaryCardProps) => {

  const stats = [
    {
      label: '전체 업무',
      value: totTaskCnt,
      icon: <LayoutList size={16} className="text-slate-500" />,
      bg: 'bg-slate-100',
      color: 'text-slate-800',
    },
    {
      label: '완료',
      value: cmplTaskCnt,
      icon: <CheckCircle2 size={16} className="text-blue-500" />,
      bg: 'bg-blue-50',
      color: 'text-blue-600',
    },
    {
      label: '진행 중',
      value: inProgTaskCnt,
      icon: <Clock size={16} className="text-amber-500" />,
      bg: 'bg-amber-50',
      color: 'text-amber-600',
    },
    {
      label: '중지',
      value: stopTaskCnt,
      icon: <PauseCircle size={16} className="text-red-400" />,
      bg: 'bg-red-50',
      color: 'text-red-500',
    },
  ]

  const prgrsRt = Math.min(Math.max(projPrgrsRt ?? 0, 0), 100)

  const barColor =
    prgrsRt >= 100
      ? 'bg-emerald-500'
      : prgrsRt >= 60
      ? 'bg-blue-500'
      : prgrsRt >= 30
      ? 'bg-amber-400'
      : 'bg-slate-300'

  return (
    <ContentCard title="프로젝트 진행 요약">

      {/* 수치 카드 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={`flex flex-col gap-2 rounded-xl ${stat.bg} px-4 py-4`}
          >
            <div className="flex items-center gap-1.5">
              {stat.icon}
              <span className="text-xs font-medium text-slate-500">{stat.label}</span>
            </div>
            <span className={`text-3xl font-bold ${stat.color}`}>
              {stat.value ?? 0}
            </span>
          </div>
        ))}
      </div>

      {/* 진척률 바 */}
      <div className="mt-4">
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="font-medium text-slate-500">프로젝트 진척률</span>
          <span className="font-bold text-slate-700">{prgrsRt}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${barColor}`}
            style={{ width: `${prgrsRt}%` }}
          />
        </div>
      </div>

    </ContentCard>
  )
}

export default ProjectSummaryCard