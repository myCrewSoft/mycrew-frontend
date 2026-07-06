import { Link } from 'react-router-dom';
import {
  FileText,
  FolderKanban,
  Megaphone,
  MessageSquare,
  ShieldQuestion,
} from 'lucide-react';
import AdminSelectionMark from './AdminSelectionMark';
import {
  getSubNavLinkClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

const boardTypeItems = [
  { value: 'notice', label: '공지사항', icon: Megaphone },
  { value: 'department', label: '부서게시판', icon: FileText },
  { value: 'free', label: '자유게시판', icon: MessageSquare },
  { value: 'anonymous', label: '익명게시판', icon: ShieldQuestion },
  { value: 'project', label: '프로젝트 게시판', icon: FolderKanban },
];

interface AdminBoardsSubSidebarProps {
  selectedBoardType: string;
}

export default function AdminBoardsSubSidebar({
  selectedBoardType,
}: AdminBoardsSubSidebarProps) {
  return (
    <>
      <h2 className={subSidebarTitleClass}>게시판</h2>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>게시판 메뉴</p>

        <div className="flex flex-col gap-1.5">
          {boardTypeItems.map((item) => {
            const Icon = item.icon;
            const active = selectedBoardType === item.value;

            return (
              <Link
                key={item.value}
                to={`/admin/boards?boardType=${item.value}`}
                className={getSubNavLinkClass(active)}
              >
                <span className="flex min-w-0 items-center gap-2">
                  <AdminSelectionMark active={active} />
                  <Icon size={16} />
                  <span className="truncate">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
