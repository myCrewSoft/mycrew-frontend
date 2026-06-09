import {
  BriefcaseBusiness,
  FileText,
  IdCard,
  KeyRound,
  Mail,
  Signature,
} from 'lucide-react';
import { useLocation } from 'react-router-dom';
import SubSidebarMenuItem from './SubSidebarMenuItem';
import SubSidebarSection from './SubSidebarSection';

const myPageMenus = [
  { icon: IdCard, label: '내 정보', path: '/mypage' },
  { icon: KeyRound, label: '비밀번호 변경', path: '/mypage/password' },
  { icon: Signature, label: '전자서명 이미지 변경', path: '/mypage/signature' },
  { icon: FileText, label: '내 게시글', path: '/mypage/posts' },
  { icon: BriefcaseBusiness, label: '내 직무 설정', path: '/mypage/job-duty' },
  { icon: Mail, label: '이메일 변경', path: '/mypage/email' },
];

const isActive = (pathname: string, path: string) =>
  path === '/mypage' ? pathname === path : pathname.startsWith(path);

export default function MyPageSubSidebarContent() {
  const location = useLocation();

  return (
    <div className="flex h-full w-full flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950">마이페이지</h2>
      </div>

      <SubSidebarSection title="개인 설정">
        {myPageMenus.map((item) => (
          <SubSidebarMenuItem
            key={item.path}
            icon={item.icon}
            label={item.label}
            path={item.path}
            active={isActive(location.pathname, item.path)}
          />
        ))}
      </SubSidebarSection>
    </div>
  );
}
