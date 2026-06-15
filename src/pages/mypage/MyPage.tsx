import { useParams } from 'react-router-dom';
import { useMyPage } from '../../hooks/useMyPage';
import ProfileSection from './ProfileSection';
import ChangePasswordSection from './ChangePasswordSection';
import ChangeEmailSection from './ChangeEmailSection';
import ChangeSignatureSection from './ChangeSignatureSection';
import ChangeJobDutySection from './ChangeJobDutySection';
import MyPostsSection from './MyPostsSection';

interface SectionMeta {
  title: string;
  description: string;
}

const sectionMeta: Record<string, SectionMeta> = {
  '': { title: '마이페이지', description: '내 프로필과 조직 정보를 확인합니다.' },
  password: { title: '비밀번호 변경', description: '계정 비밀번호를 변경합니다.' },
  email: { title: '이메일 변경', description: '연동된 이메일 주소를 변경합니다.' },
  signature: {
    title: '전자서명 이미지 변경',
    description: '결재 등에 사용할 전자서명 이미지를 등록합니다.',
  },
  posts: { title: '내 게시글', description: '내가 작성한 게시글을 확인합니다.' },
  'job-duty': { title: '내 직무 설정', description: '담당 직무 내용을 설정합니다.' },
};

export default function MyPage() {
  const { section = '' } = useParams<{ section?: string }>();
  const state = useMyPage();
  const meta = sectionMeta[section] ?? sectionMeta[''];

  const renderSection = () => {
    switch (section) {
      case 'password':
        return <ChangePasswordSection />;
      case 'email':
        return <ChangeEmailSection myPage={state.myPage} />;
      case 'signature':
        return <ChangeSignatureSection state={state} />;
      case 'job-duty':
        return <ChangeJobDutySection state={state} />;
      case 'posts':
        return <MyPostsSection />;
      default:
        return <ProfileSection state={state} />;
    }
  };

  return (
    <section className="flex w-full max-w-4xl flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">{meta.title}</h1>
        <p className="mt-2 text-sm font-medium text-slate-500">{meta.description}</p>
      </div>

      {renderSection()}
    </section>
  );
}
