import { Outlet } from 'react-router-dom';

// TODO: Header, Footer 컴포넌트 추가
export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* <Header /> */}
      <main className="flex-1 container mx-auto px-4 py-6">
        <Outlet />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
