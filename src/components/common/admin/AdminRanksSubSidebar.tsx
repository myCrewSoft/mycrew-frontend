import { PlusCircle } from 'lucide-react';
import Button from '../button/Button';
import { useOptionalAdminRanks } from '../../../pages/admin/adminRanksHooks';
import { dispatchAdminEvent } from './adminEvents';
import AdminSelectionMark from './AdminSelectionMark';
import {
  getSubNavBadgeClass,
  getSubNavButtonClass,
  subSidebarErrorClass,
  subSidebarListClass,
  subSidebarMessageClass,
  subSidebarSectionClass,
  subSidebarSectionLabelClass,
  subSidebarTitleClass,
} from './adminLayoutStyles';

export default function AdminRanksSubSidebar() {
  const adminRanks = useOptionalAdminRanks();

  if (!adminRanks) {
    return null;
  }

  return (
    <>
      <h2 className={subSidebarTitleClass}>직급</h2>

      <Button
        variant="primary"
        leftIcon={<PlusCircle size={16} />}
        onClick={() => dispatchAdminEvent('admin:open-rank-create')}
        className="mt-5 h-11 rounded-lg text-base shadow-lg shadow-blue-200"
        fullWidth
      >
        직급 생성
      </Button>

      <div className={subSidebarSectionClass}>
        <p className={subSidebarSectionLabelClass}>직급 목록</p>

        <div className={subSidebarListClass}>
          {adminRanks.ranksLoading ? (
            <div className={subSidebarMessageClass}>직급을 불러오는 중</div>
          ) : adminRanks.ranksError ? (
            <div className={subSidebarErrorClass}>
              {adminRanks.ranksError.message}
            </div>
          ) : adminRanks.ranks.length > 0 ? (
            adminRanks.ranks.map((rank) => {
              const active = adminRanks.selectedRankId === rank.rankId;

              return (
                <button
                  key={rank.rankId}
                  type="button"
                  onClick={() => adminRanks.selectRank(rank.rankId)}
                  className={getSubNavButtonClass(active)}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <AdminSelectionMark active={active} />
                    <span className="truncate">{rank.rankName}</span>
                  </span>
                  <span className={getSubNavBadgeClass(active)}>
                    {rank.sortOrder}
                  </span>
                </button>
              );
            })
          ) : (
            <div className={subSidebarMessageClass}>
              등록된 직급이 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
