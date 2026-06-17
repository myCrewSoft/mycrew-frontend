import { Link } from 'react-router-dom'
import AdminSelectionMark from './AdminSelectionMark'
import {
    getSubNavLinkClass,
    subSidebarSectionClass,
    subSidebarSectionLabelClass,
    subSidebarTitleClass,
} from './adminLayoutStyles'

const menuItems = [
    { value: 'rooms', label: '회의실 관리', path: '/admin/reservations?view=rooms' },
    { value: 'reservations', label: '예약 관리', path: '/admin/reservations?view=reservations' }
]

interface AdminReservationSubSidebarProps {
    selectedType: string
}

export default function AdminReservationSubSidebar({
    selectedType,
}: AdminReservationSubSidebarProps) {
    return (
        <>
            <h2 className={subSidebarTitleClass}>회의실</h2>

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