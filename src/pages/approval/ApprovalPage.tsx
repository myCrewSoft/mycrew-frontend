import { useParams } from 'react-router-dom'
import ApprovalDocumentPage from './ApprovalDocumentPage'
import ApprovalFavoriteTemplatePage from './ApprovalFavoriteTemplatePage'
import ApprovalTemplatePage from './ApprovalTemplatePage'

export default function ApprovalPage() {
  const { folder, status } = useParams<{ folder?: string; status?: string }>()

  if (folder === 'templates' && status === 'favorites') {
    return <ApprovalFavoriteTemplatePage />
  }

  if (folder === 'templates') {
    return <ApprovalTemplatePage />
  }

  return <ApprovalDocumentPage folder={folder} status={status} />
}
