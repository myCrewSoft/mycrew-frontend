import React, { useState, useEffect } from 'react'
import {
    Building2,
    CheckCircle2,
    TrendingUp,
    XCircle,
    SlidersHorizontal,
    Download,
    Edit3,
    X,
    ChevronLeft,
    ChevronRight,
    Search,
} from 'lucide-react'
import type { ConfRmListItem } from '../../../types'
import { useApi } from '../../../hooks/useApi'
import { confRmAdminApi } from '../../../api/adminRoomApi'
import { roomApi } from '../../../api/roomApi'
import { ApiError } from '../../../api/axiosInstance'
import Badge from '../../../components/common/dataDisplay/badge/Badge'
import ProfileAvatar from '../../../components/common/avatar/ProfileAvatar'
import EmployeeSearchPicker from '../../../components/common/employeeSearch/EmployeeSearchPicker'

const PAGE_SIZE = 10

export default function RoomManagementPage() {
    const [page, setPage] = useState<number>(0)
    const [search, setSearch] = useState<string>('')
    const [isRegisterOpen, setIsRegisterOpen] = useState<boolean>(false)
    const [isEditOpen, setIsEditOpen] = useState<boolean>(false)
    const [selectedRoom, setSelectedRoom] = useState<ConfRmListItem | null>(null)

    const [roomName, setRoomName] = useState('')
    const [floor, setFloor] = useState('1')
    const [roomNumber, setRoomNumber] = useState('')
    const [colorCode, setColorCode] = useState('#005cad')
    const [isActive, setIsActive] = useState(true)
    const [mngrId, setMngrId] = useState<number>(0)
    const [mngrSelectedIds, setMngrSelectedIds] = useState<Array<string | number>>([])

    const handleMngrChange = (ids: Array<string | number>) => {
        if (ids.length === 0) {
            setMngrSelectedIds([])
            setMngrId(0)
        } else {
            const latest = ids[ids.length - 1]
            setMngrSelectedIds([latest])
            setMngrId(Number(latest))
        }
    }

    const {
        data: stats,
        loading: statsLoading,
        execute: fetchStats,
    } = useApi(confRmAdminApi.getConfRmStats, { immediate: false })

    const {
        data: allRooms,
        loading: listLoading,
        error: listError,
        execute: fetchRooms,
    } = useApi(confRmAdminApi.getConfRmList, { immediate: false })

    const { execute: createRoom, loading: createLoading } = useApi(
        roomApi.createRoom,
        { immediate: false }
    )
    const { execute: updateRoom, loading: updateLoading } = useApi(
        roomApi.updateRoom,
        { immediate: false }
    )
    const { execute: deleteRoom, loading: deleteLoading } = useApi(
        roomApi.deleteRoom,
        { immediate: false }
    )

    useEffect(() => {
        void fetchStats()
        void fetchRooms()
    }, [fetchStats, fetchRooms])

    const filteredRooms = (allRooms ?? []).filter((room) =>
        room.confRmNm?.includes(search)
    )

    const totalPages = Math.ceil(filteredRooms.length / PAGE_SIZE)
    const pagedRooms = filteredRooms.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

    const openEditModal = (room: ConfRmListItem) => {
        setSelectedRoom(room)
        setRoomName(room.confRmNm ?? '')
        setColorCode(room.confRmColor ?? '#005cad')
        setFloor(String(room.confRmFlr ?? '1'))
        setRoomNumber(room.confRmHo ?? '')
        setIsActive(room.useYn === 'Y')
        setMngrId(0)
        setMngrSelectedIds([])
        setIsEditOpen(true)
    }

    const resetForm = () => {
        setRoomName('')
        setFloor('1')
        setRoomNumber('')
        setColorCode('#005cad')
        setIsActive(true)
        setMngrId(0)
        setMngrSelectedIds([])
    }

    const handleCreateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await createRoom({
              confRmNm: roomName,
              confRmHo: roomNumber,
              confRmFlr: Number(floor),
              confRmMngrId: mngrId,
              useYn: 'Y',
              confRmColor: colorCode,
            })
            setIsRegisterOpen(false)
            resetForm()
            void fetchRooms()
            void fetchStats()
        } catch (err) {
            if (err instanceof ApiError) alert(err.message)
        }
    }

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedRoom?.confRmId) return
        try {
            await updateRoom(selectedRoom.confRmId!, {
              confRmId: selectedRoom.confRmId!,
              confRmNm: roomName,
              confRmHo: roomNumber,
              confRmFlr: Number(floor),
              confRmMngrId: mngrId,
              useYn: isActive ? 'Y' : 'N',
              confRmColor: colorCode,
            })
            setIsEditOpen(false)
            void fetchRooms()
            void fetchStats()
        } catch (err) {
            if (err instanceof ApiError) alert(err.message)
        }
    }

    const handleDelete = async () => {
        if (!selectedRoom?.confRmId) return
        if (!window.confirm('정말 이 회의실을 삭제하시겠습니까?')) return
        try {
            await deleteRoom(selectedRoom.confRmId)
            setIsEditOpen(false)
            void fetchRooms()
            void fetchStats()
        } catch (err) {
            if (err instanceof ApiError) alert(err.message)
        }
    }

    return (
        <div className="bg-[#f7f9fb] text-[#191c1e] min-h-screen p-6 font-sans">
            <main className="max-w-7xl mx-auto">

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">회의실 관리</h1>
                        <p className="text-sm text-[#414753] mt-1">
                            사내 회의실 인프라 정보를 등록하고 운영 상태를 관리합니다.
                        </p>
                    </div>
                    <button
                        onClick={() => { resetForm(); setIsRegisterOpen(true) }}
                        className="px-4 py-2 bg-[#005cad] hover:bg-[#0074d9] text-white text-sm font-semibold rounded-lg transition-all"
                    >
                        새 회의실 등록
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-[#c0c6d5] p-5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[#414753] text-xs font-medium">전체 회의실</p>
                            <h3 className="text-2xl font-bold text-[#005cad] mt-1">
                                {statsLoading ? '-' : (stats?.totalCount ?? 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#005cad]/10 rounded-lg text-[#005cad]">
                            <Building2 size={24} />
                        </div>
                    </div>
                    <div className="bg-white border border-[#c0c6d5] p-5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[#414753] text-xs font-medium">사용 중</p>
                            <h3 className="text-2xl font-bold text-[#004788] mt-1">
                                {statsLoading ? '-' : (stats?.inUseCount ?? 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#dae2fd] rounded-lg text-[#565e74]">
                            <CheckCircle2 size={24} />
                        </div>
                    </div>
                    <div className="bg-white border border-[#c0c6d5] p-5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[#414753] text-xs font-medium">예약 가능</p>
                            <h3 className="text-2xl font-bold text-[#4e5e68] mt-1">
                                {statsLoading ? '-' : (stats?.availableCount ?? 0)}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#d3e5f1] rounded-lg text-[#4e5e68]">
                            <XCircle size={24} />
                        </div>
                    </div>
                    <div className="bg-white border border-[#c0c6d5] p-5 rounded-xl flex items-center justify-between shadow-sm">
                        <div>
                            <p className="text-[#414753] text-xs font-medium">평균 점유율</p>
                            <h3 className="text-2xl font-bold text-[#565e74] mt-1">
                                {statsLoading ? '-' : `${stats?.avgOccupancyRate ?? 0}%`}
                            </h3>
                        </div>
                        <div className="p-3 bg-[#dae2fd] rounded-lg text-[#565e74]">
                            <TrendingUp size={24} />
                        </div>
                    </div>
                </div>

                <div className="bg-white border border-[#c0c6d5] rounded-xl overflow-hidden shadow-sm">
                    <div className="px-5 py-4 border-b border-[#c0c6d5] flex flex-col sm:flex-row gap-3 justify-between items-center bg-white">
                        <div className="relative w-full sm:w-72">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#414753]">
                                <Search size={18} />
                            </span>
                            <input
                                type="text"
                                placeholder="회의실 검색..."
                                value={search}
                                onChange={(e) => { setSearch(e.target.value); setPage(0) }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] focus:border-[#005cad] outline-none transition-all"
                            />
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto justify-end">
                            <button className="px-4 py-2 text-xs font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg flex items-center gap-2 hover:bg-[#f2f4f6] transition-all">
                                <SlidersHorizontal size={16} /> 필터
                            </button>
                            <button className="px-4 py-2 text-xs font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg flex items-center gap-2 hover:bg-[#f2f4f6] transition-all">
                                <Download size={16} /> 내보내기
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        {listLoading ? (
                            <div className="p-10 text-center text-sm text-[#414753]">데이터 로딩 중...</div>
                        ) : listError ? (
                            <div className="p-10 text-center text-sm text-red-500">{listError.message}</div>
                        ) : (
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-[#f2f4f6]/50 text-xs font-semibold text-[#717785] tracking-wider uppercase border-b border-[#c0c6d5]">
                                        <th className="px-6 py-4">회의실명</th>
                                        <th className="px-6 py-4">위치</th>
                                        <th className="px-6 py-4 text-center">지정 색상</th>
                                        <th className="px-6 py-4">상태</th>
                                        <th className="px-6 py-4">관리자</th>
                                        <th className="px-6 py-4 text-right">관리</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#c0c6d5] text-sm">
                                    {pagedRooms.length > 0 ? (
                                        pagedRooms.map((room) => (
                                            <tr key={room.confRmId} className="hover:bg-[#f2f4f6] transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className="w-1.5 h-6 rounded-full"
                                                            style={{ backgroundColor: room.confRmColor ?? '#c0c6d5' }}
                                                        />
                                                        <span className="font-semibold text-[#191c1e]">{room.confRmNm}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-[#414753]">
                                                    {room.confRmFlr}층 / {room.confRmHo}호
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center">
                                                        <div
                                                            className="w-5 h-5 rounded-full border border-[#c0c6d5]"
                                                            style={{ backgroundColor: room.confRmColor ?? '#c0c6d5' }}
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Badge variant={room.useYn === 'Y' ? 'primary' : 'neutral'}>
                                                        {room.useYn === 'Y' ? '활성' : '비활성'}
                                                    </Badge>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <ProfileAvatar
                                                            fileId={room.mngrPrflImgFileId}
                                                            name={room.mngrNm}
                                                            size={28}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span className="text-[#191c1e] text-sm font-semibold">
                                                                {room.mngrNm}
                                                            </span>
                                                            <span className="text-[#717785] text-xs">
                                                                {room.mngrDeptNm} · {room.mngrJobGrdNm}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => openEditModal(room)}
                                                        className="text-[#005cad] hover:bg-[#005cad]/10 p-2 rounded-lg transition-all"
                                                        title="수정"
                                                    >
                                                        <Edit3 size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={6} className="text-center p-10 text-sm text-[#414753]">
                                                등록된 회의실이 존재하지 않습니다.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}
                    </div>

                    <div className="px-5 py-4 border-t border-[#c0c6d5] flex justify-between items-center bg-white text-xs text-[#414753]">
                        <span>
                            전체 {filteredRooms.length}개 중 {pagedRooms.length}개 표시 중
                        </span>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((prev) => Math.max(0, prev - 1))}
                                disabled={page === 0}
                                className="p-1 hover:bg-[#f2f4f6] rounded-lg transition-all disabled:opacity-30"
                            >
                                <ChevronLeft size={18} />
                            </button>
                            {Array.from({ length: totalPages }).map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setPage(idx)}
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg font-bold transition-all ${
                                        page === idx ? 'bg-[#005cad] text-white' : 'hover:bg-[#f2f4f6]'
                                    }`}
                                >
                                    {idx + 1}
                                </button>
                            ))}
                            <button
                                onClick={() => setPage((prev) => Math.min(totalPages - 1, prev + 1))}
                                disabled={page === totalPages - 1}
                                className="p-1 hover:bg-[#f2f4f6] rounded-lg transition-all disabled:opacity-30"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {isRegisterOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div
                            className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
                            onClick={() => setIsRegisterOpen(false)}
                        />
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#c0c6d5]">
                            <div className="p-5 border-b border-[#c0c6d5] flex justify-between items-center">
                                <h3 className="text-lg font-bold">새 회의실 등록</h3>
                                <button
                                    className="p-1 hover:bg-[#f2f4f6] rounded-full"
                                    onClick={() => setIsRegisterOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleCreateSubmit} className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">회의실명</label>
                                        <input
                                            type="text"
                                            required
                                            value={roomName}
                                            onChange={(e) => setRoomName(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                                            placeholder="예: 혁신 허브"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">층수</label>
                                        <input
                                            type="number"
                                            required
                                            value={floor}
                                            onChange={(e) => setFloor(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                                            placeholder="3"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">호수</label>
                                        <input
                                            type="text"
                                            required
                                            value={roomNumber}
                                            onChange={(e) => setRoomNumber(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                                            placeholder="301"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">지정 색상</label>
                                        <div className="flex gap-3 mt-1">
                                            {['#005cad', '#565e74', '#ba1a1a', '#4e5e68'].map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setColorCode(color)}
                                                    className={`w-8 h-8 rounded-full border border-gray-300 transition-transform ${
                                                        colorCode === color
                                                            ? 'scale-110 ring-2 ring-offset-2 ring-[#005cad]'
                                                            : ''
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">관리 담당자</label>
                                        <EmployeeSearchPicker
                                            variant="compact"
                                            remoteSearch
                                            selectedEmployeeIds={mngrSelectedIds}
                                            onChange={handleMngrChange}
                                            emptyText="이름을 검색하세요."
                                        />
                                    </div>
                                </div>
                                <div className="pt-4 flex gap-3 justify-end border-t border-[#c0c6d5]">
                                    <button
                                        type="button"
                                        onClick={() => setIsRegisterOpen(false)}
                                        className="px-5 py-2 text-sm font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6]"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createLoading}
                                        className="px-5 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg"
                                    >
                                        {createLoading ? '등록 중...' : '회의실 생성'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {isEditOpen && selectedRoom && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen p-4">
                        <div
                            className="fixed inset-0 bg-[#2d3133]/40 backdrop-blur-sm"
                            onClick={() => setIsEditOpen(false)}
                        />
                        <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-[#c0c6d5]">
                            <div className="p-5 border-b border-[#c0c6d5] flex justify-between items-center bg-gray-50">
                                <h3 className="text-lg font-bold text-[#191c1e]">회의실 상세 수정</h3>
                                <button
                                    className="p-1 hover:bg-[#f2f4f6] rounded-full"
                                    onClick={() => setIsEditOpen(false)}
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <form onSubmit={handleUpdateSubmit} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-[#414753]">회의실명</label>
                                    <input
                                        type="text"
                                        required
                                        value={roomName}
                                        onChange={(e) => setRoomName(e.target.value)}
                                        className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">운영 상태</label>
                                        <select
                                            value={isActive ? 'Y' : 'N'}
                                            onChange={(e) => setIsActive(e.target.value === 'Y')}
                                            className="w-full px-4 py-2 bg-white border border-[#c0c6d5] rounded-lg text-sm focus:ring-2 focus:ring-[#005cad] outline-none"
                                        >
                                            <option value="Y">활성</option>
                                            <option value="N">비활성</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold mb-1 text-[#414753]">지정 색상</label>
                                        <div className="flex gap-2 mt-1">
                                            {['#005cad', '#565e74', '#ba1a1a', '#4e5e68'].map((color) => (
                                                <button
                                                    key={color}
                                                    type="button"
                                                    onClick={() => setColorCode(color)}
                                                    className={`w-8 h-8 rounded-full border border-gray-300 transition-transform ${
                                                        colorCode === color
                                                            ? 'scale-110 ring-2 ring-offset-2 ring-[#005cad]'
                                                            : ''
                                                    }`}
                                                    style={{ backgroundColor: color }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold mb-1 text-[#414753]">관리 담당자</label>
                                    <EmployeeSearchPicker
                                        variant="compact"
                                        remoteSearch
                                        selectedEmployeeIds={mngrSelectedIds}
                                        onChange={handleMngrChange}
                                        emptyText="이름을 검색하세요."
                                    />
                                </div>
                                <div className="pt-4 flex gap-3 justify-end border-t border-[#c0c6d5] items-center">
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                        className="px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                                    >
                                        {deleteLoading ? '삭제 중...' : '회의실 삭제'}
                                    </button>
                                    <div className="flex-1" />
                                    <button
                                        type="button"
                                        onClick={() => setIsEditOpen(false)}
                                        className="px-5 py-2 text-sm font-semibold text-[#414753] border border-[#c0c6d5] rounded-lg hover:bg-[#f2f4f6]"
                                    >
                                        취소
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={updateLoading}
                                        className="px-5 py-2 text-sm font-semibold bg-[#005cad] hover:bg-[#004788] text-white rounded-lg"
                                    >
                                        {updateLoading ? '저장 중...' : '변경사항 저장'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}