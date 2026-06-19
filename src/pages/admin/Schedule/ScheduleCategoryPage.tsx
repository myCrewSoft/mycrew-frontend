import { useState } from 'react'
import { scheduleTypeColorTokenMap, scheduleTypeLabelMap } from '../../../types/calendar'
import type { ScheduleTypeCode } from '../../../types/calendar'

const CATEGORY_CODES: ScheduleTypeCode[] = [
  'C001', 'C002', 'C003', 'C004', 'C005', 'C006', 'C007', 'C008',
]

const GEN_TYPE_MAP: Record<ScheduleTypeCode, string> = {
  C001: 'Manual',
  C002: 'Manual',
  C003: 'Auto',
  C004: 'Manual',
  C005: 'Auto',
  C006: 'Auto',
  C007: 'Auto',
  C008: 'Auto',
}

const PRIVACY_MAP: Record<ScheduleTypeCode, string> = {
  C001: '전사 공개',
  C002: '본인만',
  C003: '부서 공개',
  C004: '간부 공개',
  C005: '프로젝트 참여자',
  C006: '프로젝트 참여자',
  C007: '회의 참여자',
  C008: '전사 공개',
}

export default function ScheduleCategoryPage() {
  const [previewCode, setPreviewCode] = useState<ScheduleTypeCode | null>(null)

  const previewColor = previewCode ? scheduleTypeColorTokenMap[previewCode] : null

  return (
    <div className="bg-[#f7f9fb] min-h-screen p-6 font-sans text-[#191c1e]">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">

        <div>
          <p className="text-xs text-[#717785] mb-1">관리자 &gt; 일정 관리</p>
          <h1 className="text-2xl font-bold tracking-tight">일정 분류 관리</h1>
          <p className="mt-1 text-sm text-[#414753]">
            일정 유형별 표시 색상과 사용 여부를 관리합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">전체 분류</p>
            <p className="text-2xl font-bold text-[#005cad] mt-1">{CATEGORY_CODES.length}</p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">활성 분류</p>
            <p className="text-2xl font-bold text-[#34A853] mt-1">{CATEGORY_CODES.length}</p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">자동 생성</p>
            <p className="text-2xl font-bold text-[#565e74] mt-1">
              {CATEGORY_CODES.filter((cd) => GEN_TYPE_MAP[cd] === 'Auto').length}
            </p>
          </div>
          <div className="bg-white border border-[#c0c6d5] rounded-xl p-4 shadow-sm">
            <p className="text-xs text-[#717785] font-medium">API 연동</p>
            <p className="text-2xl font-bold text-[#005cad] mt-1">1</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-[#c0c6d5]">
              <h3 className="text-sm font-bold text-[#191c1e]">일정 분류 목록</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="bg-[#f2f4f6] text-xs font-semibold text-[#717785] uppercase tracking-wider border-b border-[#c0c6d5]">
                    <th className="px-4 py-3">분류명</th>
                    <th className="px-4 py-3">코드</th>
                    <th className="px-4 py-3">색상</th>
                    <th className="px-4 py-3">공개 범위</th>
                    <th className="px-4 py-3">생성 방식</th>
                    <th className="px-4 py-3">사용 여부</th>
                    <th className="px-4 py-3 text-right">미리보기</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#c0c6d5]">
                  {CATEGORY_CODES.map((cd) => {
                    const color = scheduleTypeColorTokenMap[cd]
                    const label = scheduleTypeLabelMap[cd]
                    return (
                      <tr
                        key={cd}
                        className={`transition-colors ${
                          previewCode === cd ? 'bg-[#f0f6ff]' : 'hover:bg-[#f7f9fb]'
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-[#191c1e]">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: color.border }}
                            />
                            {label}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#717785] font-mono text-xs">{cd}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-5 h-5 rounded-full border border-[#c0c6d5]"
                              style={{ backgroundColor: color.border }}
                            />
                            <span className="text-xs text-[#717785] font-mono">
                              {color.border}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-[#414753] text-xs">
                          {PRIVACY_MAP[cd]}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                              GEN_TYPE_MAP[cd] === 'Auto'
                                ? 'bg-[#E0F7FA] text-[#00838F]'
                                : 'bg-[#f1f3f4] text-[#565e74]'
                            }`}
                          >
                            {GEN_TYPE_MAP[cd]}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="w-8 h-4 bg-[#005cad] rounded-full flex items-center justify-end pr-0.5">
                              <div className="w-3 h-3 bg-white rounded-full" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() =>
                              setPreviewCode((prev) => (prev === cd ? null : cd))
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                              previewCode === cd
                                ? 'bg-[#005cad] text-white border-[#005cad]'
                                : 'border-[#c0c6d5] text-[#414753] hover:bg-[#f2f4f6]'
                            }`}
                          >
                            {previewCode === cd ? '닫기' : '미리보기'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex flex-col gap-4">

            {previewCode && previewColor ? (
              <div className="bg-white border border-[#c0c6d5] rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#c0c6d5]">
                  <h3 className="text-sm font-bold text-[#191c1e]">색상 미리보기</h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-[#717785] mb-2">캘린더 이벤트</p>
                    <div
                      className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border"
                      style={{
                        backgroundColor: previewColor.background,
                        borderColor: previewColor.border,
                        color: previewColor.text,
                      }}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: previewColor.border }}
                      />
                      {scheduleTypeLabelMap[previewCode]} 예시 일정
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#717785] mb-2">뱃지 미리보기</p>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        backgroundColor: previewColor.background,
                        color: previewColor.text,
                      }}
                    >
                      {scheduleTypeLabelMap[previewCode]}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-[#717785] mb-2">색상 정보</p>
                    <div className="flex flex-col gap-2">
                      {(['background', 'border', 'text'] as const).map((key) => (
                        <div key={key} className="flex items-center justify-between text-xs">
                          <span className="text-[#717785] capitalize">{key}</span>
                          <div className="flex items-center gap-2">
                            <div
                              className="w-4 h-4 rounded border border-[#c0c6d5]"
                              style={{ backgroundColor: previewColor[key] }}
                            />
                            <span className="font-mono text-[#414753]">
                              {previewColor[key]}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[#717785] mb-2">목록 구분선</p>
                    <div className="flex items-center gap-2 p-2 bg-[#f7f9fb] rounded-lg">
                      <span
                        className="w-1.5 h-8 rounded-full flex-shrink-0"
                        style={{ backgroundColor: previewColor.border }}
                      />
                      <div>
                        <p className="text-xs font-semibold text-[#191c1e]">
                          {scheduleTypeLabelMap[previewCode]} 예시 일정
                        </p>
                        <p className="text-[10px] text-[#717785]">2026-06-18 10:00 ~ 18:00</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#c0c6d5] rounded-xl shadow-sm p-8 flex flex-col items-center justify-center text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                  <span className="text-2xl">🎨</span>
                </div>
                <p className="text-sm font-semibold text-[#414753]">
                  분류를 선택하면 색상 미리보기가 표시됩니다.
                </p>
              </div>
            )}

            <div className="bg-white border border-[#c0c6d5] rounded-xl shadow-sm p-5">
              <h3 className="text-sm font-bold text-[#191c1e] mb-3">색상 범례</h3>
              <div className="flex flex-col gap-2">
                {CATEGORY_CODES.map((cd) => {
                  const color = scheduleTypeColorTokenMap[cd]
                  return (
                    <div key={cd} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: color.border }}
                      />
                      <span className="text-xs text-[#414753]">
                        {scheduleTypeLabelMap[cd]}
                      </span>
                      <span className="ml-auto text-[10px] font-mono text-[#717785]">
                        {color.border}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>
        </div>

        <div className="bg-[#FFF8E1] border border-[#FFD54F] rounded-xl p-4 text-sm text-[#7B5800]">
          <p className="font-semibold mb-1">일정 분류 색상 안내</p>
          <p>
            색상은 <code className="bg-[#FFD54F]/30 px-1 rounded">calendar.ts</code>의{' '}
            <code className="bg-[#FFD54F]/30 px-1 rounded">scheduleTypeColorTokenMap</code>에서
            관리됩니다. 색상 변경이 필요하면 해당 파일을 수정하세요.
          </p>
        </div>

      </div>
    </div>
  )
}