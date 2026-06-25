// src/pages/project/ProjectUrgentTaskCard.tsx

import { AlertCircle } from 'lucide-react'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import type { TaskUpcomingResponse } from '../../types'
import { formatDateTime } from '../../utils/date'

interface ProjectUrgentTaskCardProps {
  taskList: TaskUpcomingResponse[]
}

// 업무우선순위코드: 01-높음 / 02-중간 / 03-낮음
const PriorityBadge = ({ taskPriorityCd }: { taskPriorityCd?: string }) => {
  if (taskPriorityCd === '01') return <Badge variant="danger">높음</Badge>
  if (taskPriorityCd === '02') return <Badge variant="warning">중간</Badge>
  if (taskPriorityCd === '03') return <Badge variant="neutral">낮음</Badge>
  return <Badge variant="neutral">-</Badge>
}

const DDayBadge = ({ dDay }: { dDay?: string }) => {
  if (!dDay) return <Badge variant="neutral">-</Badge>

  // dDay는 백엔드(DateUtil.dDay)에서 "D-1", "D-Day", "D+2" 형태 문자열로 내려옴
  if (dDay === 'D-Day') return <Badge variant="danger">D-Day</Badge>
  if (dDay.startsWith('D+')) return <Badge variant="danger">{dDay}</Badge>

  const remaining = Number(dDay.replace('D-', ''))
  if (!Number.isNaN(remaining) && remaining <= 3) {
    return <Badge variant="warning">{dDay}</Badge>
  }
  return <Badge variant="neutral">{dDay}</Badge>
}

const ProjectUrgentTaskCard = ({ taskList }: ProjectUrgentTaskCardProps) => {
  return (
    <ContentCard
      title="마감 임박 업무"
      description="7일 이내 마감인 진행 중 업무입니다."
    >
      {taskList.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 text-slate-400">
          <AlertCircle size={28} className="text-slate-300" />
          <p className="text-sm">마감 임박 업무가 없습니다.</p>
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <table className="w-full text-sm">
            {/* 헤더 */}
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-2.5 text-left text-xs font-semibold text-slate-400">업무명</th>
                <th className="pb-2.5 text-left text-xs font-semibold text-slate-400">담당자</th>
                <th className="pb-2.5 text-left text-xs font-semibold text-slate-400">마감 날짜</th>
                <th className="pb-2.5 text-left text-xs font-semibold text-slate-400">우선순위</th>
                <th className="pb-2.5 text-right text-xs font-semibold text-slate-400">D-DAY</th>
              </tr>
            </thead>

            {/* 바디 */}
            <tbody className="divide-y divide-slate-50">
              {taskList.map((task) => (
                <tr key={task.taskId} className="hover:bg-slate-50">
                  <td className="py-3 pr-4">
                    <span className="font-semibold text-slate-800">{task.taskNm}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500">{task.taskMngrNm}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500">
                      {formatDateTime(task.taskEndDt)}
                    </span>
                  </td>
                  <td className="py-3 pr-4">
                    <PriorityBadge taskPriorityCd={task.taskPriorityCd} />
                  </td>
                  <td className="py-3 text-right">
                    <DDayBadge dDay={task.dday} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ContentCard>
  )
}

export default ProjectUrgentTaskCard
