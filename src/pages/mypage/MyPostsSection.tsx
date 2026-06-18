import { type FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Eye, FileText, Search } from 'lucide-react';
import { boardApi } from '../../api/boardApi';
import { ApiError } from '../../api/axiosInstance';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import Pagination from '../../components/common/dataDisplay/pagination/Pagination';
import type { BoardResponse } from '../../types';

type BadgeTone = 'blue' | 'emerald' | 'violet' | 'amber' | 'slate';

const typeMeta: Record<string, { label: string; tone: BadgeTone }> = {
  NOTICE: { label: '공지', tone: 'blue' },
  FREE: { label: '자유', tone: 'emerald' },
  ANON: { label: '익명', tone: 'violet' },
  DEPT: { label: '부서', tone: 'amber' },
  PROJ: { label: '프로젝트', tone: 'slate' },
};

const toneClass: Record<BadgeTone, string> = {
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  slate: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const getTypeMeta = (boardTypeCd?: string | null) =>
  (boardTypeCd && typeMeta[boardTypeCd]) || { label: boardTypeCd ?? '기타', tone: 'slate' as BadgeTone };

const formatDate = (value?: string | null) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(
    date.getDate(),
  ).padStart(2, '0')}`;
};

// 게시글 유형/소속에 따라 상세 페이지 경로를 만든다. 이동이 불가한 유형은 null.
const getDetailPath = (post: BoardResponse): string | null => {
  const id = post.boardId;
  if (id == null) return null;
  switch (post.boardTypeCd) {
    case 'NOTICE':
      return `/boards/notices/${id}`;
    case 'FREE':
      return `/boards/free/${id}`;
    case 'ANON':
      return `/boards/anonymous/${id}`;
    case 'DEPT':
      return post.deptCd
        ? `/boards/dept/${encodeURIComponent(post.deptCd.trim())}/${id}`
        : `/boards/departments/${id}`;
    default:
      return null;
  }
};

export default function MyPostsSection() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BoardResponse[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const fetchPosts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await boardApi.getMyPosts(page, keyword);
        if (!active) return;

        const pageData = response.data.data;
        const content = pageData?.content ?? [];
        const nextTotalPages = Math.max(pageData?.totalPages ?? 1, 1);

        setPosts(content);
        setTotalPages(nextTotalPages);
        setTotalCount(pageData?.totalElements ?? content.length);

        // 마지막 페이지가 줄어들어 현재 페이지가 비는 경우 보정
        if (content.length === 0 && page > nextTotalPages) {
          setPage(nextTotalPages);
        }
      } catch (err) {
        if (!active) return;
        const message =
          err instanceof ApiError ? err.message : '내 게시글을 불러오지 못했습니다.';
        setError(message);
        setPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchPosts();
    return () => {
      active = false;
    };
  }, [page, keyword]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setKeyword(searchInput.trim());
  };

  const handleOpen = (post: BoardResponse) => {
    const path = getDetailPath(post);
    if (path) navigate(path);
  };

  return (
    <ContentCard
      title="내 게시글"
      description={
        totalCount > 0
          ? `내가 작성한 게시글 ${totalCount}건을 모아 봅니다.`
          : '내가 작성한 게시글을 모아 봅니다.'
      }
      actions={
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="제목·내용 검색"
              className="h-9 w-48 rounded-xl border border-slate-300 pl-9 pr-3 text-sm font-medium outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </form>
      }
    >
      {loading ? (
        <div className="py-12 text-center text-sm font-semibold text-slate-500">
          내 게시글을 불러오는 중입니다.
        </div>
      ) : error ? (
        <EmptyState title="내 게시글을 불러오지 못했습니다." description={error} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon={<FileText size={22} />}
          title={keyword ? '검색 결과가 없습니다.' : '작성한 게시글이 없습니다.'}
          description={
            keyword
              ? '다른 검색어로 다시 시도해 보세요.'
              : '게시판에서 글을 작성하면 여기에 모아서 보여드립니다.'
          }
        />
      ) : (
        <div className="flex flex-col gap-5">
          <ul className="flex flex-col divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-100">
            {posts.map((post) => {
              const meta = getTypeMeta(post.boardTypeCd);
              const clickable = getDetailPath(post) !== null;
              return (
                <li key={post.boardId}>
                  <button
                    type="button"
                    onClick={() => handleOpen(post)}
                    disabled={!clickable}
                    className="group flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-slate-50 disabled:cursor-default disabled:hover:bg-transparent"
                  >
                    <span
                      className={`flex-shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${toneClass[meta.tone]}`}
                    >
                      {meta.label}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-1.5 truncate text-sm font-bold text-slate-900">
                        {post.imprtntYn === 'Y' && (
                          <span className="flex-shrink-0 rounded bg-rose-50 px-1.5 py-0.5 text-[10px] font-black text-rose-600">
                            중요
                          </span>
                        )}
                        <span className="truncate">{post.boardSj || '제목 없음'}</span>
                      </p>
                      <p className="mt-1 flex items-center gap-2 text-[12px] font-medium text-slate-500">
                        <span>{formatDate(post.frstRegDt)}</span>
                        {post.projNm && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className="truncate">{post.projNm}</span>
                          </>
                        )}
                        <span className="inline-flex items-center gap-1 text-slate-400">
                          <Eye size={13} />
                          {post.viewCnt ?? 0}
                        </span>
                      </p>
                    </div>

                    {clickable && (
                      <ChevronRight
                        size={16}
                        className="flex-shrink-0 text-slate-300 transition-colors group-hover:text-blue-600"
                      />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          )}
        </div>
      )}
    </ContentCard>
  );
}
