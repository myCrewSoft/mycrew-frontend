import { useState } from 'react'
import EmployeeSearchPicker, {
  type EmployeeSearchItem,
} from '../../components/common/employeeSearch/EmployeeSearchPicker'
import { projectApi } from '../../api/projectApi'
import Modal from '../../components/common/overlay/modal/Modal'

interface InviteMemberModalProps {
  open: boolean
  onClose: () => void
  projId: number
  employees: EmployeeSearchItem[]
  departments: string[]
  onSuccess: () => void
}

export default function InviteMemberModal({
  open,
  onClose,
  projId,
  employees,
  departments,
  onSuccess,
}: InviteMemberModalProps) {

  const [selectedIds, setSelectedIds] = useState<Array<string | number>>([])
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    if (selectedIds.length === 0) return

    try {
      setLoading(true)
      await projectApi.addProjMembers(projId, {
        addMemberList: selectedIds.map((id) => ({ empId: Number(id) })),
      })
      onSuccess()
      handleClose()
    } catch {
      alert('팀원 추가 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedIds([])
    onClose()
  }

  return (
    <Modal
      open={open}
      title="팀 멤버 초대"
      confirmText={loading ? '추가 중...' : '초대하기'}
      cancelText="취소"
      variant="confirm"
      onClose={handleClose}
      onConfirm={handleConfirm}
    >
      <EmployeeSearchPicker
        variant="detailed"
        employees={employees}
        departments={departments}
        selectedEmployeeIds={selectedIds}
        onChange={setSelectedIds}
      />
    </Modal>
  )
}