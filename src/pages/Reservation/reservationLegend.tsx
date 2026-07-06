const ReservationLegend = () => {
  return (
    <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-600">
      <div className="flex items-center gap-2">
        <span className="h-3 w-7 rounded border border-blue-300 bg-blue-100" />
        <span>내 예약</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-7 rounded border border-slate-300 bg-stone-50" />
        <span>다른 사람 예약</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="h-3 w-7 rounded border border-dashed border-slate-300 bg-white" />
        <span>예약 가능</span>
      </div>
    </div>
  )
}

export default ReservationLegend
