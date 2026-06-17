import { FilePlus2, PenLine, RefreshCcw, Search, Send, Star, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import { approvalApi } from '../../api/approvalApi'
import Button from '../../components/common/button/Button'
import Badge from '../../components/common/dataDisplay/badge/Badge'
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState'
import SearchInput from '../../components/common/form/searchInput/SearchInput'
import { useToast } from '../../components/common/toast/useToast'
import type {
  ApprovalTemplateCreateRequestDTO,
  ApprovalTemplateResponse,
  ApprovalTemplateUpdateRequestDTO,
} from '../../types/approval'
import { defaultTemplateForm, toTemplateForm } from './approval.types'
import type { TemplateFormState } from './approval.types'
import { getApiErrorMessage } from './approval.utils'
import ApprovalDraftModal from './ApprovalDraftModal'
import ApprovalHtmlDocument from './ApprovalHtmlDocument'
import ApprovalTemplateEditorModal from './ApprovalTemplateEditorModal'
import { useDraftModal } from './useDraftModal'

export default function ApprovalTemplatePage({
  manageOnly = false,
}: { manageOnly?: boolean } = {}) {
  const { showToast } = useToast()
  const [templates, setTemplates] = useState<ApprovalTemplateResponse[]>([])
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<ApprovalTemplateResponse | null>(null)
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [listLoading, setListLoading] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<'create' | 'edit'>('create')
  const [templateForm, setTemplateForm] = useState<TemplateFormState>(defaultTemplateForm)
  const [templateError, setTemplateError] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const {
    draftOpen,
    draftForm,
    setDraftForm,
    draftApprovers,
    setDraftApprovers,
    draftError,
    draftSaving,
    aiPrompt,
    aiGenerating,
    aiApprovalLineGenerating,
    canGenerateAiApprovalLine,
    setAiPrompt,
    handleGenerateAiDraft,
    handleGenerateAiApprovalLine,
    handleSaveDraft,
    closeDraft,
  } = useDraftModal()

  const filteredTemplates = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase()
    if (!normalizedKeyword) return templates
    return templates.filter((template) => {
      const haystack = [template.tmplatCd, template.tmplatNm, template.useYn]
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalizedKeyword)
    })
  }, [keyword, templates])

  const loadTemplates = useCallback(async () => {
    setListLoading(true)
    setErrorMessage('')
    try {
      const response = await approvalApi.getApprovalTemplates()
      const nextTemplates = response.data.data ?? []
      setTemplates(nextTemplates)
      setSelectedTemplateCode((current) => {
        if (current && nextTemplates.some((t) => t.tmplatCd === current)) return current
        return nextTemplates[0]?.tmplatCd ?? null
      })
    } catch (error) {
      setTemplates([])
      setSelectedTemplateCode(null)
      setErrorMessage(getApiErrorMessage(error, '결재 양식 목록을 불러오지 못했습니다.'))
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

  const openCreateEditor = () => {
    setEditorMode('create')
    setTemplateForm(defaultTemplateForm)
    setTemplateError('')
    setEditorOpen(true)
  }

  const openEditEditor = () => {
    if (!selectedTemplate) return
    setEditorMode('edit')
    setTemplateForm(toTemplateForm(selectedTemplate))
    setTemplateError('')
    setEditorOpen(true)
  }

  const validateTemplateForm = () => {
    if (!templateForm.tmplatNm.trim()) return '양식명을 입력하세요.'
    if (!templateForm.tmplatCn.trim()) return 'HTML 양식 내용을 입력하세요.'
    if (!['Y', 'N'].includes(templateForm.useYn.trim().toUpperCase())) {
      return '사용 여부는 Y 또는 N으로 입력하세요.'
    }
    return ''
  }

  const handleSaveTemplate = async () => {
    const validationMessage = validateTemplateForm()
    if (validationMessage) {
      setTemplateError(validationMessage)
      return
    }
    setSaving(true)
    setTemplateError('')
    try {
      if (editorMode === 'create') {
        const payload: ApprovalTemplateCreateRequestDTO = {
          tmplatNm: templateForm.tmplatNm.trim(),
          tmplatCn: templateForm.tmplatCn,
          useYn: templateForm.useYn.trim().toUpperCase(),
        }
        const response = await approvalApi.createApprovalTemplate(payload)
        const createdTemplate = response.data.data
        setSelectedTemplateCode(createdTemplate?.tmplatCd ?? null)
        showToast({
          title: '결재 양식 생성 완료',
          description: createdTemplate?.tmplatNm ?? templateForm.tmplatNm,
          variant: 'success',
        })
      } else {
        const payload: ApprovalTemplateUpdateRequestDTO = {
          tmplatCd: templateForm.tmplatCd,
          tmplatNm: templateForm.tmplatNm.trim(),
          tmplatCn: templateForm.tmplatCn,
          useYn: templateForm.useYn.trim().toUpperCase(),
        }
        await approvalApi.updateApprovalTemplate(payload)
        setSelectedTemplateCode(templateForm.tmplatCd)
        showToast({
          title: '결재 양식 수정 완료',
          description: templateForm.tmplatNm,
          variant: 'success',
        })
      }
      setEditorOpen(false)
      await loadTemplates()
    } catch (error) {
      setTemplateError(getApiErrorMessage(error, '결재 양식을 저장하지 못했습니다.'))
    } finally {
      setSaving(false)
    }
  }

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

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate || deleting) return
    const confirmed = window.confirm(
      `'${selectedTemplate.tmplatNm}' 결재 양식을 삭제하시겠습니까?\n삭제하면 양식 목록에서 더 이상 보이지 않습니다.`,
    )
    if (!confirmed) return

    setDeleting(true)
    try {
      await approvalApi.deleteApprovalTemplate(selectedTemplate.tmplatCd)
      showToast({
        title: '결재 양식 삭제 완료',
        description: selectedTemplate.tmplatNm,
        variant: 'success',
      })
      setSelectedTemplateCode(null)
      setSelectedTemplate(null)
      await loadTemplates()
    } catch (error) {
      showToast({
        title: '결재 양식 삭제 실패',
        description: getApiErrorMessage(error, '결재 양식 삭제에 실패했습니다.'),
        variant: 'danger',
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSearchSubmit = (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault()
    setKeyword(keywordInput.trim())
  }

  return (
    <div className="approval-page">
      <section className="approval-page__header">
        <div className="approval-page__header-top">
          <div className="approval-page__title-group">
            <div className="approval-page__icon-box">
              <FilePlus2 size={24} />
            </div>
            <div className="approval-page__title-text">
              <h1 className="approval-page__title">결재 양식</h1>
              <p className="approval-page__description">
                DB에 저장된 전자결재 HTML 양식을 조회하고, 선택한 양식을 수정하거나 새 양식을
                만들 수 있습니다.
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
            {!manageOnly && (
              <Button
                variant="outline"
                leftIcon={<Send size={16} />}
                onClick={() => window.dispatchEvent(new Event('approval:open-draft'))}
              >
                기안서 작성
              </Button>
            )}
            <Button leftIcon={<FilePlus2 size={16} />} onClick={openCreateEditor}>
              양식 만들기
            </Button>
          </div>
        </div>

        <form className="approval-page__search" onSubmit={handleSearchSubmit}>
          <SearchInput
            placeholder="양식명, 코드, HTML 내용으로 검색"
            value={keywordInput}
            onChange={(event) => setKeywordInput(event.target.value)}
          />
          <Button type="submit" leftIcon={<Search size={16} />}>
            검색
          </Button>
        </form>
      </section>

      {errorMessage ? <div className="approval-page__error">{errorMessage}</div> : null}

      <section className="approval-page__workspace">
        <div className="approval-page__list-panel">
          {listLoading ? (
            <div className="approval-page__loading">결재 양식을 불러오는 중입니다.</div>
          ) : (
            <>
              {filteredTemplates.length > 0 ? (
                <div className="approval-page__document-list">
                  {filteredTemplates.map((template) => (
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
                        className={`approval-page__favorite-btn${template.favoriteYn === 'Y' ? ' approval-page__favorite-btn--active' : ''}`}
                        disabled={togglingFavorite === template.tmplatCd}
                        onClick={(e) => void handleToggleFavorite(template.tmplatCd, e)}
                        aria-label={template.favoriteYn === 'Y' ? '즐겨찾기 해제' : '즐겨찾기 추가'}
                      >
                        <Star size={15} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="결재 양식이 없습니다."
                  description="양식 만들기 버튼으로 HTML 결재 양식을 등록하세요."
                />
              )}
            </>
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
                <div className="approval-page__detail-actions">
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<PenLine size={15} />}
                    onClick={openEditEditor}
                  >
                    수정
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    leftIcon={<Trash2 size={15} />}
                    loading={deleting}
                    onClick={() => void handleDeleteTemplate()}
                  >
                    삭제
                  </Button>
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
                <ApprovalHtmlDocument html={selectedTemplate.tmplatCn} />
              </section>

              <section className="approval-page__detail-section">
                <h3>HTML 원본</h3>
                <pre className="approval-page__html-source">
                  <code>{selectedTemplate.tmplatCn || 'HTML 양식 내용이 없습니다.'}</code>
                </pre>
              </section>
            </>
          ) : (
            <EmptyState
              title="결재 양식을 선택하세요."description="왼쪽 목록에서 결재 양식을 선택하면 문서 미리보기와 수정 버튼이 표시됩니다."
            />
          )}
        </div>
      </section>

      <ApprovalTemplateEditorModal
        open={editorOpen}
        mode={editorMode}
        saving={saving}
        form={templateForm}
        error={templateError}
        onChange={setTemplateForm}
        onClose={() => {
          setEditorOpen(false)
          setTemplateError('')
        }}
        onSubmit={handleSaveTemplate}
      />

      {!manageOnly && (
        <ApprovalDraftModal
          open={draftOpen}
          saving={draftSaving}
          form={draftForm}
          approvers={draftApprovers}
          error={draftError}
          aiPrompt={aiPrompt}
          aiGenerating={aiGenerating}
          aiApprovalLineGenerating={aiApprovalLineGenerating}
          canGenerateAiApprovalLine={canGenerateAiApprovalLine}
          onAiPromptChange={setAiPrompt}
          onGenerateAiDraft={handleGenerateAiDraft}
          onGenerateAiApprovalLine={handleGenerateAiApprovalLine}
          onChange={setDraftForm}
          onApproversChange={setDraftApprovers}
          onClose={closeDraft}
          onSubmit={handleSaveDraft}
        />
      )}
    </div>
  )
}
