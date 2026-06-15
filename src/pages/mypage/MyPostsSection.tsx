import { FileText } from 'lucide-react';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';

export default function MyPostsSection() {
  return (
    <ContentCard
      title="내 게시글"
      description="내가 작성한 게시글을 모아 봅니다."
    >
      {/*
        '내 게시글' 목록은 작성자 기준 조회 API(예: GET /api/boards/mine)가
        백엔드에 추가되면 이 영역에서 연결한다. 현재는 해당 엔드포인트가 없어
        안내 상태로 둔다.
      */}
      <EmptyState
        icon={<FileText size={22} />}
        title="내 게시글 목록을 준비 중입니다."
        description="작성자 기준 게시글 조회 API가 연동되면 여기에서 내가 쓴 글을 확인할 수 있습니다."
      />
    </ContentCard>
  );
}
