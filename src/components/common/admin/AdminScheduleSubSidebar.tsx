import { Link, useLocation } from 'react-router-dom'
import AdminSelectionMark from './AdminSelectionMark'
import {
    getSubNavLinkClass,
    subSidebarSectionClass,
    subSidebarSectionLabelClass,
    subSidebarTitleClass,
} from './adminLayoutStyles'

const menuItems = [
    { value: 'org',      label: '조직 일정 관리',     path: '/admin/schedule/org' },
    { value: 'auto',     label: '자동 생성 일정 조회', path: '/admin/schedule/auto' },
    { value: 'holiday',  label: '공휴일/API 연동',     path: '/admin/schedule/holiday' },
    { value: 'category', label: '일정 분류 관리',      path: '/admin/schedule/category' },
]

export default function AdminScheduleSubSidebar() {
    const { pathname } = useLocation()

    const getSelectedValue = () => {
        if (pathname.includes('/admin/schedule/auto'))     return 'auto'
        if (pathname.includes('/admin/schedule/holiday'))  return 'holiday'
        if (pathname.includes('/admin/schedule/category')) return 'category'
        return 'org'
    }

    const selectedValue = getSelectedValue()

    return (
        <>
            <h2 className={subSidebarTitleClass}>일정 관리</h2>

            <div className={subSidebarSectionClass}>
                <p className={subSidebarSectionLabelClass}>관리 메뉴</p>

                <div className="flex flex-col gap-1.5">
                    {menuItems.map((item) => {
                        const active = selectedValue === item.value

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