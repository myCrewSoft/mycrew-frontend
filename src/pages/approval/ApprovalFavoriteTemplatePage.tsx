import { RefreshCcw, Star } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { approvalApi } from '../../api/approvalApi'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import { useToast } from '../../components/common/toast/useToast'
import type { ApprovalTemplateResponse } from '../../types/approval'
import { getApiErrorMessage } from './approval.utils'
import './ApprovalPage.css'

export default function ApprovalFavoriteTemplatePage() {
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<ApprovalTemplateResponse[]>([])
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalTemplateResponse | null>(null)
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState('')

  const favoriteTemplates = useMemo(
    () => templates.filter((t) => t.favoriteYn === 'Y'),
    [templates],
  )

  const loadTemplates = useCallback(async () => {
    setListLoading(true)
    setErrorMessage('')
    try {
      const response = await approvalApi.getApprovalTemplates()
      const nextTemplates = response.data.data ?? []
      setTemplates(nextTemplates)
      const favs = nextTemplates.filter((t) => t.favoriteYn === 'Y')
      setSelectedTemplateCode((current) => {
        if (current && favs.some((t) => t.tmplatCd === current)) return current
        return favs[0]?.tmplatCd ?? null
      })
    } catch (error) {
      setTemplates([])
      setSelectedTemplateCode(null)
      setErrorMessage(getApiErrorMessage(error, '즐겨찾기 양식 목록을 불러오지 못했습니다.'))
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadTemplateDetail = useCallback(async () => {
    if (!selectedTemplateCode) {
      setSelectedTemplate(null)
      return
    }
    setDetailLoading(true)
    try {
      const response = await approvalApi.getApprovalTemplate(selectedTemplateCode)
      setSelectedTemplate(response.data.data ?? null)
    } catch (error) {
      setSelectedTemplate(null)
      showToast({
        title: '결재 양식 상세 조회 실패',
        description: getApiErrorMessage(error, '결재 양식 상세 정보를 불러오지 못했습니다.'),
        variant: 'danger',
      })
    } finally {
      setDetailLoading(false)
    }
  }, [selectedTemplateCode, showToast])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplates()
  }, [loadTemplates])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadTemplateDetail()
  }, [loadTemplateDetail])

  const handleToggleFavorite = async (tmplatCd: string, event: React.MouseEvent) => {
    event.stopPropagation()
    setTogglingFavorite(tmplatCd)
    try {
      await approvalApi.toggleTemplateFavorite(tmplatCd)
      await loadTemplates()
      if (selectedTemplateCode === tmplatCd) {
        void loadTemplateDetail()
      }
    } catch (error) {
      showToast({
        title: '즐겨찾기 변경 실패',
        description: getApiErrorMessage(error, '즐겨찾기 변경에 실패했습니다.'),
        variant: 'danger',
      })
    } finally {
      setTogglingFavorite(null)
    }
  }

  return (
    <div className="approval-page">
      <section className="approval-page__header">
        <div className="approval-page__header-top">
          <div className="approval-page__title-group">
            <div className="approval-page__icon-box">
              <Star size={24} />
            </div>
            <div className="approval-page__title-text">
              <h1 className="approval-page__title">즐겨찾기 양식</h1>
              <p className="approval-page__description">
                즐겨찾기로 등록한 결재 양식만 모아볼 수 있습니다.
              </p>
            </div>
          </div>
          <div className="approval-page__header-actions">
            <Button
              variant="outline"
              leftIcon={<RefreshCcw size={16} />}
              onClick={() => void loadTemplates()}
            >
              새로고침
            </Button>
          </div>
        </div>
      </section>

      {errorMessage ? <div className="approval-page__error">{errorMessage}</div> : null}

      <section className="approval-page__workspace">
        <div className="approval-page__list-panel">
          {listLoading ? (
            <div className="approval-page__loading">즐겨찾기 양식을 불러오는 중입니다.</div>
          ) : favoriteTemplates.length > 0 ? (
            <div className="approval-page__document-list">
              {favoriteTemplates.map((template) => (
                <div
                  key={template.tmplatCd}
                  className={[
                    'approval-page__document-row',
                    selectedTemplateCode === template.tmplatCd
                      ? 'approval-page__document-row--selected'
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedTemplateCode(template.tmplatCd)}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && setSelectedTemplateCode(template.tmplatCd)
                  }
                >
                  <div className="approval-page__document-info">
                    <div className="approval-page__document-title-line">
                      <h2 className="approval-page__document-title">{template.tmplatNm}</h2>
                      <Badge variant={template.useYn === 'Y' ? 'success' : 'outline'}>
                        {template.useYn === 'Y' ? '사용' : '미사용'}
                      </Badge>
                    </div>
                    <p className="approval-page__document-meta">
                      <span>{template.tmplatCd}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    className="approval-page__favorite-btn approval-page__favorite-btn--active"
                    disabled={togglingFavorite === template.tmplatCd}
                    onClick={(e) => void handleToggleFavorite(template.tmplatCd, e)}
                    aria-label="즐겨찾기 해제"
                  >
                    <Star size={15} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="즐겨찾기 양식이 없습니다."
              description="결재 양식 목록에서 별표 버튼을 눌러 즐겨찾기를 추가하세요."
            />
          )}
        </div>

        <div className="approval-page__detail-panel">
          {detailLoading ? (
            <div className="approval-page__loading">결재 양식 상세를 불러오는 중입니다.</div>
          ) : selectedTemplate ? (
            <>
              <div className="approval-page__detail-header">
                <div>
                  <div className="approval-page__detail-title-line">
                    <h2 className="approval-page__detail-title">{selectedTemplate.tmplatNm}</h2>
                    <Badge variant={selectedTemplate.useYn === 'Y' ? 'success' : 'outline'}>
                      {selectedTemplate.useYn === 'Y' ? '사용' : '미사용'}
                    </Badge>
                  </div>
                  <p className="approval-page__detail-subtitle">{selectedTemplate.tmplatCd}</p>
                </div>
              </div>

              <div className="approval-page__summary-grid">
                <div>
                  <span>템플릿 코드</span>
                  <strong>{selectedTemplate.tmplatCd}</strong>
                </div>
                <div>
                  <span>사용 여부</span>
                  <strong>{selectedTemplate.useYn}</strong>
                </div>
                <div>
                  <span>즐겨찾기</span>
                  <strong>{selectedTemplate.favoriteYn}</strong>
                </div>
                <div>
                  <span>첨부파일</span>
                  <strong>{selectedTemplate.atchFileId ?? '-'}</strong>
                </div>
              </div>

              <section className="approval-page__detail-section">
                <h3>문서 보기</h3>
                <article
                  className="approval-page__html-document"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedTemplate.tmplatCn || '<p>결재 양식 내용이 없습니다.</p>',
                  }}
                />
              </section>
            </>
          ) : (
            <EmptyState
              title="결재 양식을 선택하세요."
              description="왼쪽 목록에서 즐겨찾기 양식을 선택하면 문서 미리보기가 표시됩니다."
            />
          )}
        </div>
      </section>
    </div>
  )
}
