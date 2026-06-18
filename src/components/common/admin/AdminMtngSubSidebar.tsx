import { Link, useLocation } from 'react-router-dom'
import AdminSelectionMark from './AdminSelectionMark'
import {
    getSubNavLinkClass,
    subSidebarSectionClass,
    subSidebarSectionLabelClass,
    subSidebarTitleClass,
} from './adminLayoutStyles'

const menuItems = [
    { value: 'list', label: '전체 회의', path: '/admin/meeting' },
    { value: 'stats', label: '통계', path: '/admin/meeting/stats' },
]

export default function AdminMtngSubSidebar() {
    const { pathname } = useLocation()
    const selectedType = pathname === '/admin/meeting/stats' ? 'stats' : 'list'

    return (
        <>
            <h2 className={subSidebarTitleClass}>회의 관리</h2>

            <div className={subSidebarSectionClass}>
                <p className={subSidebarSectionLabelClass}>관리 메뉴</p>

                <div className="flex flex-col gap-1.5">
                    {menuItems.map((item) => {
                        const active = selectedType === item.value

                        return (
                            <Link
                                key={item.value}
                                to={item.path}
                                className={getSubNavLinkClass(active)}
                            >
                                <span className="flex min-w-0 items-center gap-2">
                                    <AdminSelectionMark active={active} />
                                    <span className="truncate">{item.label}</span>
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </div>
        </>
    )
}