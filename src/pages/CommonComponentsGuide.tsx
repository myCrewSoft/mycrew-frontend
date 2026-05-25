import { useState } from 'react'
import {
  Bell,
  Check,
  ClipboardList,
  List,
  ListChecks,
  Mail,
  MessageSquare,
  Plus,
} from 'lucide-react'
import Badge from '../components/common/dataDisplay/badge/Badge'
import Button from '../components/common/button/Button'
import FloatingButton from '../components/common/button/FloatingButton'
import IconButton from '../components/common/button/IconButton'
import NotificationIconButton from '../components/common/button/NotificationIconButton'
import Checkbox from '../components/common/form/checkbox/Checkbox'
import ContentCard from '../components/common/dataDisplay/card/ContentCard'
import DataTable from '../components/common/dataDisplay/dataTable/DataTable'
import DatePickerField from '../components/common/form/datePicker/DatePickerField'
import EmptyState from '../components/common/dataDisplay/emptyState/EmptyState'
import FileUpload from '../components/common/form/fileUpload/FileUpload'
import FilterBar from '../components/common/dataDisplay/filter/FilterBar'
import FormField from '../components/common/form/formField/FormField'
import Modal from '../components/common/overlay/modal/Modal'
import PageComponent from '../components/layouts/PageComponent'
import Pagination from '../components/common/dataDisplay/pagination/Pagination'
import SearchInput from '../components/common/form/searchInput/SearchInput'
import Select from '../components/common/form/select/Select'
import Tabs from '../components/common/tabs/Tabs'
import Textarea from '../components/common/form/textarea/Textarea'
import Toggle from '../components/common/form/toggle/Toggle'
import type { ToastItem } from '../components/common/toast/toast.types'
import DropdownMenu from '../components/common/overlay/dropdownMenu/DropdownMenu'
import ToastViewport from '../components/common/toast/ToastViewport'
import { useToast } from '../components/common/toast/ToastProvider'
import SubSidebarActionButton from '../components/layouts/sidebar/SubSidebarActionButton'
import SubSidebarMenuItem from '../components/layouts/sidebar/SubSidebarMenuItem'
import SubSidebarSection from '../components/layouts/sidebar/SubSidebarSection'

interface ApprovalRow {
  id: string
  title: string
  writer: string
  status: '대기' | '진행' | '완료'
}

const approvalRows: ApprovalRow[] = [
  { id: 'AP-001', title: '휴가 신청서', writer: '박범준', status: '대기' },
  { id: 'AP-002', title: '지출 결의서', writer: '김민지', status: '진행' },
  { id: 'AP-003', title: '구매 요청서', writer: '이도윤', status: '완료' },
]

const Source2323 = () => {
  const [modalOpen, setModalOpen] = useState(false)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [checked, setChecked] = useState(true)
  const [toggleChecked, setToggleChecked] = useState(false)
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [dateValue, setDateValue] = useState<Date | null>(new Date())
  const [dateTimeValue, setDateTimeValue] = useState<Date | null>(new Date())
  const [timeValue, setTimeValue] = useState<Date | null>(new Date())

  const { showToast } = useToast()

  const handleShowToast = () => {
    showToast({
      title: '저장되었습니다.',
      description: '변경사항이 정상적으로 반영되었습니다.',
      variant: 'success',
    })
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <PageComponent
        title="공통 컴포넌트"
        description="팀원들이 그룹웨어 화면에서 반복 사용할 공통 UI를 한 번에 확인하는 소개 페이지입니다."
        actions={
          <>
            <SearchInput
              wrapperClassName="w-64"
              placeholder="컴포넌트 검색"
              aria-label="컴포넌트 검색"
            />
            <Button variant="outline" onClick={handleShowToast}>
              알림 보기
            </Button>
            <Button variant="primary" onClick={() => setModalOpen(true)}>
              확인창 열기
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-6">
          <ContentCard
            title="기본 레이아웃"
            description="Header와 MainSidebar는 현재 화면 바깥의 공통 레이아웃에서 사용 중입니다. Header는 통합 검색과 알림/프로필 영역, MainSidebar는 좌측 모듈 메뉴와 보조 사이드바를 담당합니다."
          />

          <FilterBar
            actions={
              <>
                <Button variant="outline">초기화</Button>
                <Button variant="primary">조회</Button>
              </>
            }
          >
            <SearchInput
              wrapperClassName="max-w-sm"
              placeholder="문서, 게시글, 구성원 검색"
            />
            <DatePickerField
              label="기간"
              mode="date"
              value={dateValue}
              onChange={setDateValue}
              className="min-w-40"
            />
            <Select
              label="상태"
              defaultValue="all"
              options={[
                { value: 'all', label: '전체' },
                { value: 'waiting', label: '대기' },
                { value: 'done', label: '완료' },
              ]}
            />
          </FilterBar>

          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'all', label: '전체', count: 24 },
              { value: 'waiting', label: '대기', count: 3 },
              { value: 'done', label: '완료', count: 18 },
            ]}
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ContentCard
              title="페이지 작업 박스"
              description="PageComponent는 제목, 설명, 액션, 필터, 목록 등 페이지 작업 영역을 하나의 큰 박스로 묶습니다."
            />

            <ContentCard
              title="정보 카드"
              description="ContentCard는 공지, 결재 요약, 근태 현황 같은 작은 정보 묶음을 표현합니다."
            />

            <ContentCard title="버튼">
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="primary">기본</Button>
                <Button variant="outline">보조</Button>
                <Button variant="secondary">중립</Button>
                <Button variant="danger">삭제</Button>
                <IconButton aria-label="확인">
                  <Check size={18} />
                </IconButton>
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl">
                  <Plus size={22} />
                </span>
              </div>
            </ContentCard>

            <ContentCard title="알림 아이콘 버튼">
              <div className="flex gap-3">
                <NotificationIconButton
                  label="메일"
                  count={12}
                  icon={<Mail size={20} className="text-slate-700" />}
                />
                <NotificationIconButton
                  label="메신저"
                  count={7}
                  icon={<MessageSquare size={20} className="text-slate-700" />}
                />
                <NotificationIconButton
                  label="알림"
                  count={5}
                  badgeVariant="danger"
                  icon={<Bell size={20} className="text-slate-700" />}
                />
              </div>
            </ContentCard>

            <ContentCard title="상태 배지">
              <div className="flex flex-wrap gap-2">
                <Badge variant="primary">진행</Badge>
                <Badge variant="success">완료</Badge>
                <Badge variant="warning">대기</Badge>
                <Badge variant="danger">반려</Badge>
                <Badge variant="neutral">임시저장</Badge>
                <Badge variant="outline">외부</Badge>
              </div>
            </ContentCard>

            <ContentCard title="검색 / 입력 / 선택">
              <div className="flex flex-col gap-3">
                <SearchInput placeholder="통합 검색" />
                <FormField
                  label="문서 제목"
                  placeholder="제목을 입력하세요"
                  helperText="목록과 상세 화면에 표시됩니다."
                />
                <Select
                  label="문서 상태"
                  defaultValue="waiting"
                  options={[
                    { value: 'waiting', label: '대기' },
                    { value: 'progress', label: '진행' },
                    { value: 'done', label: '완료' },
                  ]}
                />
              </div>
            </ContentCard>

            <ContentCard title="체크박스 / 토글">
              <div className="flex flex-col gap-4">
                <Checkbox
                  label="중요 문서로 표시"
                  checked={checked}
                  onChange={(event) => setChecked(event.target.checked)}
                />
                <Toggle
                  label="알림 받기"
                  checked={toggleChecked}
                  onChange={setToggleChecked}
                />
              </div>
            </ContentCard>

            <ContentCard title="긴 글 입력">
              <Textarea
                label="반려 사유"
                placeholder="사유를 입력하세요"
                helperText="결재자에게 표시되는 메시지입니다."
              />
            </ContentCard>

            <ContentCard title="더보기 메뉴">
              <DropdownMenu
                items={[
                  { label: '수정', onClick: handleShowToast },
                  { label: '복사', onClick: handleShowToast },
                  {
                    label: '삭제',
                    danger: true,
                    onClick: () => setModalOpen(true),
                  },
                ]}
              />
            </ContentCard>

            <ContentCard title="파일 첨부">
              <FileUpload />
            </ContentCard>

            <ContentCard title="빈 상태">
              <EmptyState
                title="등록된 게시글이 없습니다."
                description="첫 게시글을 작성하면 이 영역에 표시됩니다."
                actions={<Button variant="primary">게시글 작성</Button>}
              />
            </ContentCard>

            <ContentCard
              title="사이드바 메뉴 항목"
              description="ModuleNavItem은 좌측 MainSidebar 내부에서 사용하는 아이콘 + 메뉴명 + 활성 상태 메뉴 항목입니다."
            />

            <ContentCard
              title="서브 사이드바 구성"
              description="업무 추가, 프로젝트 생성 같은 주요 액션과 프로젝트 목록, 업무 상태 목록처럼 모듈 안쪽 메뉴를 묶을 때 사용합니다."
            >
              <div className="flex max-w-xs flex-col gap-5 rounded-2xl bg-slate-50 p-4">
                <div className="flex flex-col gap-2">
                  <SubSidebarActionButton variant="primary">
                    업무 추가
                  </SubSidebarActionButton>
                  <SubSidebarActionButton>프로젝트 생성</SubSidebarActionButton>
                </div>

                <SubSidebarSection title="프로젝트">
                  <SubSidebarMenuItem
                    icon={List}
                    label="프로젝트 목록"
                    path="/"
                  />
                  <SubSidebarMenuItem
                    icon={ClipboardList}
                    label="업무"
                    path="/project/tasks"
                    active
                  />
                  <SubSidebarMenuItem
                    icon={ListChecks}
                    label="해야할 일"
                    path="/project/todo"
                  />
                </SubSidebarSection>
              </div>
            </ContentCard>

            <ContentCard
              title="모달 / 확인창"
              description="저장, 삭제, 제출 같은 확인 액션은 Modal의 variant, confirmText, onConfirm 속성으로 처리합니다."
            >
              <Button variant="primary" onClick={() => setModalOpen(true)}>
                확인창 열기
              </Button>
            </ContentCard>

            <ContentCard
              title="토스트 알림"
              description="저장 완료, 삭제 실패, 업로드 성공 같은 짧은 피드백 메시지입니다. 기본 3초 뒤 사라지고 duration으로 시간을 바꿀 수 있습니다."
            >
              <Button variant="outline" onClick={handleShowToast}>
                알림 표시
              </Button>
            </ContentCard>
          </div>

          <ContentCard
            title="날짜 선택"
            description="DatePickerField는 mode 값에 따라 날짜만, 날짜와 시간, 시간만 선택할 수 있는 공통 컴포넌트입니다."
          >
            <div className="grid gap-3 md:grid-cols-3">
              <DatePickerField
                label="날짜만 선택"
                mode="date"
                value={dateValue}
                onChange={setDateValue}
              />
              <DatePickerField
                label="날짜 + 시간 선택"
                mode="datetime"
                value={dateTimeValue}
                onChange={setDateTimeValue}
              />
              <DatePickerField
                label="시간만 선택"
                mode="time"
                value={timeValue}
                onChange={setTimeValue}
              />
            </div>
          </ContentCard>

          <DataTable
            data={approvalRows}
            getRowKey={(row) => row.id}
            columns={[
              { key: 'id', header: '문서번호', render: (row) => row.id },
              { key: 'title', header: '제목', render: (row) => row.title },
              { key: 'writer', header: '작성자', render: (row) => row.writer },
              {
                key: 'status',
                header: '상태',
                render: (row) => (
                  <Badge
                    variant={
                      row.status === '완료'
                        ? 'success'
                        : row.status === '진행'
                          ? 'primary'
                          : 'warning'
                    }
                  >
                    {row.status}
                  </Badge>
                ),
              },
            ]}
          />

          <Pagination page={page} totalPages={5} onChange={setPage} />
        </div>
      </PageComponent>

      <Modal
        open={modalOpen}
        title="작업을 진행할까요?"
        description="확인하면 선택한 작업이 적용됩니다."
        variant="confirm"
        confirmText="진행"
        cancelText="취소"
        onClose={() => setModalOpen(false)}
        onConfirm={() => {
          setModalOpen(false)
          handleShowToast()
        }}
      >
        <p className="text-sm leading-6 text-slate-500">
          Modal에 confirm 관련 속성을 넘기면 확인창처럼 사용할 수 있습니다.
        </p>
      </Modal>

      <FloatingButton onClick={handleShowToast} />

      <ToastViewport
        items={toasts}
        onClose={(id) =>
          setToasts((current) => current.filter((item) => item.id !== id))
        }
      />
    </section>
  )
}

export default Source2323
