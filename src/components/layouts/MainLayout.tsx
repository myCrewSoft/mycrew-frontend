/* eslint-disable @typescript-eslint/no-explicit-any */
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Mail, FileText, Cloud, Kanban, Video, 
  Clock, Calendar, GraduationCap, Network, ClipboardList,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Header from '../common/header/Header';
import { useState } from 'react';
import Button from '../common/button/Button_Primary';

export default function MainLayout() {
  const location = useLocation();

  const [isSubOpen, setIsSubOpen] = useState(true);

  const menuItems = [
    { icon: <Mail size={18} />, label: '메일', path: '/mail' },
    { icon: <FileText size={18} />, label: '전자결재', path: '/approval' },
    { icon: <Cloud size={18} />, label: '드라이브', path: '/drive' },
    { icon: <Kanban size={18} />, label: '프로젝트', path: '/project' },
    { icon: <Video size={18} />, label: '회의', path: '/meeting' },
    { icon: <Clock size={18} />, label: '근태', path: '/attendance' },
    { icon: <Calendar size={18} />, label: '일정', path: '/calendar' },
    { icon: <GraduationCap size={18} />, label: '교육', path: '/education' },
    { icon: <Network size={18} />, label: '조직관리', path: '/organization' },
    { icon: <ClipboardList size={18} />, label: '게시판', path: '/board' }, 
  ];

  return (
    // 1. 전체 화면 구조 설정
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden">
      
      {/* 2. 주 사이드바 (가장 왼쪽) */}
      <aside className="w-16 h-full bg-[#0d1527] flex flex-col items-center py-4 text-white flex-shrink-0">
       <Link 
  to="/" 
  className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#2563eb] to-[#5ac8fa] flex items-center justify-center font-black text-xl mb-6 cursor-pointer no-underline text-white shadow-md transition-transform hover:scale-105"
>
  M
</Link>
        
        <nav className="w-full flex flex-col gap-1 px-1">
          {menuItems.map((item, index) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <Link
                key={index}
                to={item.path}
                className={`w-full h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 no-underline transition-all duration-200
                  ${isActive 
                    ? 'bg-gradient-to-r from-[#2563eb] to-[#5ac8fa] text-white font-bold shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <div className="flex items-center justify-center">
                  {item.icon}
                </div>
                <span className="text-[9px] tracking-tight scale-90 origin-center">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* 3. 서브 사이드바 (접기 애니메이션 추가 구역) */}
      <aside 
        className={`h-full bg-[#f8fafc] border-r border-slate-100 flex-shrink-0 transition-all duration-300 ease-in-out relative
          ${isSubOpen ? 'w-52 p-4 opacity-100' : 'w-0 p-0 opacity-0 border-r-0 overflow-hidden'}`}
      >
        {/* 닫혀있을 때 내부 레이아웃이 찌그러지는 것을 방지하는 컨테이너 */}
        <div className="w-44"> 
          <h2 className="text-xl font-bold mb-4">안녕하세요!</h2>
          {/* 여기에 메뉴 리스트 등이 위치합니다 */}
        </div>

        {/* 🛠️ 해결 포인트: 'as any' 치트 적용 및 토글 전용 커스텀 스타일 적용 */}
        <Button
          variant={"toggle" as any}
          size={"icon" as any}
          onClick={() => setIsSubOpen(!isSubOpen)}
          // 공통 버튼에 규정된 스타일과 부딪히지 않도록 className으로 둥근 흰색 테두리 형태를 명확히 고정합니다.
          className="absolute -right-3 top-6 z-50 w-6 h-6 rounded-full bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:bg-slate-50 p-0 shadow-sm min-w-0"
          leftIcon={isSubOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        />
      </aside>

      {/* 사이드바가 완전히 닫혔을 때 열 수 있는 우측 탈출 버튼 */}
      {!isSubOpen && (
        <div className="absolute left-16 top-6 z-50">
          <Button
            variant={"toggle" as any}
            size={"icon" as any}
            onClick={() => setIsSubOpen(true)}
            className="w-6 h-6 rounded-l-none rounded-r-md border border-l-0 border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:bg-slate-50 p-0 shadow-sm min-w-0"
            leftIcon={<ChevronRight size={14} />}
          />
        </div>
      )}

      {/* 4. 우측 전체 영역 (상단 헤더 + 하단 본문 내용) */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        <Header />

        {/* 유저님이 말씀하신 순수 오리지널 main 통로 구역입니다 */}
        <main className="flex-1 overflow-y-auto p-6 bg-[#f1f5f9]">
          <Outlet />
        </main>
      </div>

    </div>
  );
}