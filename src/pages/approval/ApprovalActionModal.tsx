import Button from '../../components/common/button/Button'
import Modal from '../../components/common/overlay/modal/Modal'
import Textarea from '../../components/common/form/textarea/Textarea'

type Props = {
  open: boolean
  title: string
  description: string
  loading: boolean
  reason: string
  onReasonChange: (value: string) => void
  onClose: () => void
  onConfirm: () => void | Promise<void>
}

export default function ApprovalActionModal({
  open,
  title,
  description,
  loading,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal
      open={open}
      title={title}
      description={description}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
          <Button loading={loading} onClick={() => void onConfirm()}>
            확인
          </Button>
        </>
      }
    >
      <Textarea
        label="처리 사유"
        placeholder="승인 또는 반려 사유를 입력하세요."
        value={reason}
        onChange={(event) => onReasonChange(event.target.value)}
      />
    </Modal>
  )
}
