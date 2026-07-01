import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import ContentCard from '../../components/common/dataDisplay/card/ContentCard'
import type { ProjectMemberResponseDto } from '../../types/project'
import { useAuth } from '../../store/AuthContext'
import InviteMemberModal from './InviteMemberModal'
import type { EmployeeSearchItem } from '../../components/common/employeeSearch/EmployeeSearchPicker'
import { projectApi } from '../../api/projectApi'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'

interface ProjectMemberCardProps {
  projId: number
  projLdrEmpId: number
  memberList: ProjectMemberResponseDto[]
  employees: EmployeeSearchItem[]
  departments: string[]
  onSuccess: () => void
}

const getProfileFileId = (employee?: EmployeeSearchItem) => {
  if (employee?.profileImageFileId) return employee.profileImageFileId

  const urlFileId = employee?.profileImageUrl?.match(/\/images\/(\d+)/)?.[1]
  return urlFileId ? Number(urlFileId) : null
}

const ProjectMemberCard = ({
  projId,
  projLdrEmpId,
  memberList,
  employees,
  departments,
  onSuccess,
}: ProjectMemberCardProps) => {
  const { auth } = useAuth()
  const currentEmpId = Number(auth.payload?.sub)
  const isLeader = projLdrEmpId === currentEmpId

  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const employeeMap = useMemo(
    () => new Map(employees.map((employee) => [String(employee.id), employee])),
    [employees],
  )
  const handleRemove = async (empId: number) => {
    if(!confirm('정말 퇴출하시겠습니까?')) return
    try{
      await projectApi.removeProjMember(projId, empId)
      onSuccess()
    } catch {
      alert('퇴출 중 오류가 발생했습니다.')
    }
  }

  return (
    <ContentCard title="프로젝트 참여자">
      <div className="flex flex-col gap-3">

        {memberList.map((member) => (
          <div key={member.empId} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ProfileAvatar
                fileId={getProfileFileId(employeeMap.get(String(member.empId)))}
                name={member.empNm}
                size={36}
              />
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  {member.empNm}
                  {member.empId === projLdrEmpId && (
                    <span className="ml-1.5 text-xs font-normal text-blue-500">
                      프로젝트 장
                    </span>
                  )}
                </p>
                <p className="text-xs text-slate-400">{member.deptNm}</p>
              </div>
            </div>

            {isLeader && member.empId !== currentEmpId && (
              <button
                type="button"
                onClick={()=> handleRemove(member.empId)}
                className="text-xs text-slate-400 hover:text-red-500"
              >
                퇴출
              </button>
            )}
          </div>
        ))}

        {isLeader && (
          <button
            type="button"
            onClick={() => setInviteModalOpen(true)}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:border-blue-300 hover:text-blue-500"
          >
            <Plus size={15} />
            팀 멤버 초대
          </button>
        )}

      </div>

      <InviteMemberModal
        open={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        projId={projId}
        employees={employees}
        departments={departments}
        onSuccess={onSuccess}
      />
    </ContentCard>
  )
}

export default ProjectMemberCard
