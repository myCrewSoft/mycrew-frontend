// src/pages/project/ProjectUrgentTaskCard.tsx

import { AlertCircle } from 'lucide-react'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import Badge from '../../components/common/dataDisplay/badge/Badge'

interface UrgentTask {
  taskId: number
  taskNm: string
  assigneeNm: string
  taskEndYmd: string
  prirtCd: string
  dDay: number
}

interface ProjectUrgentTaskCardProps {
  taskList?: UrgentTask[]
}

const PriorityBadge = ({ prirtCd }: { prirtCd: string }) => {
  if (prirtCd === '04') return <Badge variant="danger">긴급</Badge>
  if (prirtCd === '03') return <Badge variant="warning">높음</Badge>
  if (prirtCd === '02') return <Badge variant="primary">보통</Badge>
  return <Badge variant="neutral">낮음</Badge>
}

const DDayBadge = ({ dDay }: { dDay: number }) => {
  if (dDay < 0)  return <Badge variant="danger">D+{Math.abs(dDay)}</Badge>
  if (dDay === 0) return <Badge variant="danger">D-Day</Badge>
  if (dDay <= 3)  return <Badge variant="warning">D-{dDay}</Badge>
  return <Badge variant="neutral">D-{dDay}</Badge>
}

const DUMMY_TASKS: UrgentTask[] = [
  { taskId: 1, taskNm: '결제 API 인증 모듈 구현', assigneeNm: '이지혜', taskEndYmd: '2026-06-11', prirtCd: '04', dDay: 1 },
  { taskId: 2, taskNm: '정산 배치 스케줄러 설계', assigneeNm: '이지혜', taskEndYmd: '2026-06-12', prirtCd: '03', dDay: 2 },
  { taskId: 3, taskNm: 'CI/CD 파이프라인 구성', assigneeNm: '정진호', taskEndYmd: '2026-06-14', prirtCd: '02', dDay: 4 },
  { taskId: 4, taskNm: '환율 계산 엔진 단위 테스트', assigneeNm: '김철수', taskEndYmd: '2026-06-16', prirtCd: '01', dDay: 6 },
]

const ProjectUrgentTaskCard = ({ taskList = DUMMY_TASKS }: ProjectUrgentTaskCardProps) => {
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
                    <span className="text-slate-500">{task.assigneeNm}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <span className="text-slate-500">{task.taskEndYmd}</span>
                  </td>
                  <td className="py-3 pr-4">
                    <PriorityBadge prirtCd={task.prirtCd} />
                  </td>
                  <td className="py-3 text-right">
                    <DDayBadge dDay={task.dDay} />
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