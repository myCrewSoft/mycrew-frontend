export const hasBoardAttachment = (
  attachmentFileId: number | null | undefined,
) => (
  typeof attachmentFileId === 'number' &&
  Number.isFinite(attachmentFileId) &&
  attachmentFileId > 0
)
