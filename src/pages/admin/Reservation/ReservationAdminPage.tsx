
import { useEffect, useMemo, useState } from 'react'
import type { PopularRmItem, RsrvListItem, RsrvSearchRequest, RsrvStatsSummary } from '../../../types'
import type { AdminEmployeeListItem } from '../../../types/adminEmployee'
import { useApi } from '../../../hooks/useApi'
import { cancelReservation, getReservationList, getReservationStats } from '../../../api/ReservationAdminApi'
import { adminApi } from '../../../api/adminApi'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'


export default function ReservationAdminPage() {
    const [params, setParams] = useState<RsrvSearchRequest>({
        searchDt: new Date().toISOString().slice(0, 10),
    })
    const [selectedRsrv, setSelectedRsrv] = useState<RsrvListItem | null>(null)

    const { data: stats, loading: statsLoading } = useApi(getReservationStats)

    const {
        data: rsrvList,
        loading: listLoading,
        execute: fetchList,
    } = useApi(getReservationList, { immediate: false })

    const { data: employees, execute: fetchEmployees } = useApi(
        adminApi.getEmployees,
        { immediate: false },
    )

    useEffect(() => {
        void fetchList(params)
    }, [params, fetchList])

    useEffect(() => {
        void fetchEmployees({ page: 0, size: 1000 }).catch(() => undefined)
    }, [fetchEmployees])

    const employeesByName = useMemo(() => {
        const directory = new Map<string, AdminEmployeeListItem>()
        for (const employee of employees ?? []) {
            const name = employee.empNm.trim()
            if (name && !directory.has(name)) directory.set(name, employee)
        }
        return directory
    }, [employees])

    const handleCancel = async (rsrvId: number) => {
        if (!confirm('해당 예약을 강제 취소하시겠습니까?')) return
        try {
            await cancelReservation(rsrvId)
            setSelectedRsrv(null)
            void fetchList(params)
        } catch {
            alert('취소 처리 중 오류가 발생했습니다.')
        }
    }

    return (
        <section className="flex h-full gap-6">
            <div className="flex min-w-0 flex-1 flex-col gap-6">

                <section className="grid grid-cols-4 gap-4">
                    {statsLoading || !stats ? (
                        <div className="col-span-4 text-sm font-semibold text-slate-400">
                            운영 현황을 불러오는 중입니다.
                        </div>
                    ) : (
                        <>
                            <StatCard label="오늘 예약 수" value={`${stats.todayRsrvCount}건`} />
                            <StatCard label="이번 주 예약 수" value={`${stats.weekRsrvCount}건`} />
                            <StatCard label="예약 가능 회의실" value={`${stats.availableRmCount}개`} />
                            <PopularRmCard stats={stats} />
                        </>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex flex-wrap gap-3">
                        <input
                            type="date"
                            value={params.searchDt ?? ''}
                            onChange={(e) =>
                                setParams((prev) => ({ ...prev, searchDt: e.target.value }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        />
                        <input
                            type="number"
                            placeholder="층 입력"
                            value={params.confRmFlr ?? ''}
                            onChange={(e) =>
                                setParams((prev) => ({
                                    ...prev,
                                    confRmFlr: e.target.value ? Number(e.target.value) : undefined,
                                }))
                            }
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        />
                        <input
                            type="text"
                            placeholder="예약자 검색"
                            value={params.rsrvEmpNm ?? ''}
                            onChange={(e) =>
                                setParams((prev) => ({ ...prev, rsrvEmpNm: e.target.value }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        />
                        <select
                            value={params.intgRsrvYn ?? ''}
                            onChange={(e) =>
                                setParams((prev) => ({ ...prev, intgRsrvYn: e.target.value }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                            <option value="">종일 예약 전체</option>
                            <option value="Y">종일</option>
                            <option value="N">일반</option>
                        </select>
                        <select
                            value={params.useYn ?? ''}
                            onChange={(e) =>
                                setParams((prev) => ({ ...prev, useYn: e.target.value }))
                            }
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                            <option value="">사용 여부 전체</option>
                            <option value="Y">활성</option>
                            <option value="N">비활성</option>
                        </select>
                    </div>

                    {listLoading ? (
                        <p className="py-8 text-center text-sm font-semibold text-slate-400">
                            예약 목록을 불러오는 중입니다.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                        <table className="w-full min-w-[1180px] text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 text-left text-xs font-bold text-slate-500">
                                    <th className="pb-3 pr-4">회의실명</th>
                                    <th className="pb-3 pr-4">위치</th>
                                    <th className="pb-3 pr-4">예약 목적</th>
                                    <th className="min-w-56 pb-3 pr-4">예약자</th>
                                    <th className="pb-3 pr-4">시작 일시</th>
                                    <th className="pb-3 pr-4">종료 일시</th>
                                    <th className="pb-3 pr-4">종일</th>
                                    <th className="pb-3">관리</th>
                                </tr>
                            </thead>
                            <tbody>
                                {!rsrvList || rsrvList.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-8 text-center font-semibold text-slate-400"
                                        >
                                            예약 내역이 없습니다.
                                        </td>
                                    </tr>
                                ) : (
                                    rsrvList.map((rsrv:RsrvListItem) => {
                                        const reserver = rsrv.rsrvEmpNm
                                            ? employeesByName.get(rsrv.rsrvEmpNm.trim())
                                            : undefined

                                        return (
                                        <tr
                                            key={rsrv.rsrvId}
                                            onClick={() => setSelectedRsrv(rsrv)}
                                            className={`cursor-pointer border-b border-slate-100 hover:bg-slate-50 ${
                                                selectedRsrv?.rsrvId === rsrv.rsrvId
                                                    ? 'bg-blue-50'
                                                    : ''
                                            }`}
                                        >
                                            <td className="py-3 pr-4 font-semibold text-slate-900">
                                                {rsrv.confRmNm}
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">
                                                {rsrv.confRmFlr}층 / {rsrv.confRmHo}호
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">
                                                {rsrv.rsrvPurps || '-'}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <EmployeeIdentity
                                                    employee={reserver}
                                                    fallbackName={rsrv.rsrvEmpNm}
                                                />
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">
                                                {rsrv.beginDt?.replace('T', ' ').slice(0, 16)}
                                            </td>
                                            <td className="py-3 pr-4 text-slate-600">
                                                {rsrv.endDt?.replace('T', ' ').slice(0, 16)}
                                            </td>
                                            <td className="py-3 pr-4">
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                                        rsrv.intgRsrvYn === 'Y'
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                >
                                                    {rsrv.intgRsrvYn === 'Y' ? '종일' : '일반'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                {rsrv.delYn === 'N' ? (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            void handleCancel(rsrv.rsrvId!)
                                                        }}
                                                        className="rounded-lg bg-red-50 px-3 py-1 text-xs font-bold text-red-600 hover:bg-red-100"
                                                    >
                                                        강제 취소
                                                    </button>
                                                ) : (
                                                    <span className="text-xs font-semibold text-slate-400">
                                                        취소됨
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                        )
                                    })
                                )}
                            </tbody>
                        </table>
                        </div>
                    )}
                </section>
            </div>

            {selectedRsrv && (
                <aside className="flex w-80 flex-shrink-0 flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-950">예약 상세</h2>
                        <button
                            onClick={() => setSelectedRsrv(null)}
                            className="text-sm font-semibold text-slate-400 hover:text-slate-700"
                        >
                            닫기
                        </button>
                    </div>

                    <div className="flex flex-col gap-3 text-sm">
                        <DetailRow label="회의실" value={selectedRsrv.confRmNm ?? '-'} />
                        <DetailRow
                            label="위치"
                            value={`${selectedRsrv.confRmFlr ?? '-'}층 / ${selectedRsrv.confRmHo ?? '-'}호`}
                        />
                        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                            <p className="mb-2 text-xs font-bold text-slate-500">예약자</p>
                            <EmployeeIdentity
                                employee={
                                    selectedRsrv.rsrvEmpNm
                                        ? employeesByName.get(selectedRsrv.rsrvEmpNm.trim())
                                        : undefined
                                }
                                fallbackName={selectedRsrv.rsrvEmpNm}
                                avatarSize={40}
                            />
                        </div>
                        <DetailRow label="예약 목적" value={selectedRsrv.rsrvPurps || '-'} />
                        <DetailRow
                            label="시작 일시"
                            value={selectedRsrv.beginDt?.replace('T', ' ').slice(0, 16) ?? '-'}
                        />
                        <DetailRow
                            label="종료 일시"
                            value={selectedRsrv.endDt?.replace('T', ' ').slice(0, 16) ?? '-'}
                        />
                        <DetailRow
                            label="종일 예약"
                            value={selectedRsrv.intgRsrvYn === 'Y' ? '종일' : '일반'}
                        />
                        <DetailRow
                            label="상태"
                            value={selectedRsrv.delYn === 'Y' ? '취소됨' : '정상'}
                        />
                    </div>

                    {selectedRsrv.delYn === 'N' && (
                        <button
                            onClick={() => void handleCancel(selectedRsrv.rsrvId!)}
                            className="mt-auto rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white hover:bg-red-600"
                        >
                            강제 취소
                        </button>
                    )}
                </aside>
            )}
        </section>
    )
}

function StatCard({ label, value }: { label: string; value: string }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
        </div>
    )
}

function PopularRmCard({ stats }: { stats: RsrvStatsSummary }) {
    const maxCount = stats.popularRmList?.[0]?.rsrvCount ?? 1
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-bold text-slate-500">가장 많이 예약된 회의실</p>
            {!stats.popularRmList || stats.popularRmList.length === 0 ? (
                <p className="text-sm font-semibold text-slate-400">데이터가 없습니다.</p>
            ) : (
                stats.popularRmList.map((rm: PopularRmItem) => (
                    <div key={rm.confRmNm} className="mb-2">
                        <div className="mb-1 flex justify-between text-xs font-semibold text-slate-700">
                            <span>{rm.confRmNm}</span>
                            <span>{rm.rsrvCount}건</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100">
                            <div
                                className="h-2 rounded-full bg-blue-500"
                                style={{
                                    width: `${Math.min((rm.rsrvCount! / maxCount) * 100, 100)}%`,
                                }}
                            />
                        </div>
                    </div>
                ))
            )}
        </div>
    )
}

function EmployeeIdentity({
    employee,
    fallbackName,
    avatarSize = 36,
}: {
    employee?: AdminEmployeeListItem
    fallbackName?: string
    avatarSize?: number
}) {
    const name = employee?.empNm ?? fallbackName ?? '알 수 없음'
    const position = employee?.jobGrade?.jobGrdNm ?? employee?.jobPosition?.jobPstnNm
    const department = employee?.department?.deptNm
    const meta =
        position && department
            ? `${position} · ${department}`
            : position ?? department ?? '직급/부서 정보 없음'

    return (
        <div className="flex min-w-0 items-center gap-3">
            <ProfileAvatar
                fileId={employee?.prflImgFileId}
                name={name}
                size={avatarSize}
                rounded="xl"
                className="ring-1 ring-slate-200"
            />
            <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">{name}</p>
                <p className="mt-0.5 truncate text-xs font-semibold text-slate-500">{meta}</p>
            </div>
        </div>
    )
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between gap-2">
            <span className="font-semibold text-slate-500">{label}</span>
            <span className="text-right font-semibold text-slate-900">{value}</span>
        </div>
    )
}
