import { useCallback } from 'react'

/**
 * 다음(카카오) 우편번호 서비스 검색 결과 데이터.
 * 전체 필드 중 실제로 사용하는 것만 선언한다. (전체 스펙은 공식 문서 참고)
 */
export interface DaumPostcodeData {
  /** 국가기초구역번호(새 우편번호) */
  zonecode: string
  /** 기본 주소(검색어 타입에 따라 도로명/지번) */
  address: string
  /** 도로명 주소 */
  roadAddress: string
  /** 지번 주소 */
  jibunAddress: string
  /** 건물명 */
  buildingName: string
  /** 공동주택 여부 (Y/N) */
  apartment: string
  /** 사용자가 선택한 주소 타입 (R: 도로명, J: 지번) */
  userSelectedType: string
}

type DaumPostcodeInstance = {
  open: () => void
  embed: (element: HTMLElement) => void
}

type DaumPostcodeConstructor = new (options: {
  oncomplete: (data: DaumPostcodeData) => void
  onclose?: (state: string) => void
  width?: string | number
  height?: string | number
}) => DaumPostcodeInstance

declare global {
  interface Window {
    daum?: { Postcode?: DaumPostcodeConstructor }
    kakao?: { Postcode?: DaumPostcodeConstructor }
  }
}

const SCRIPT_SRC =
  'https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'

let scriptPromise: Promise<void> | null = null

const getPostcode = (): DaumPostcodeConstructor | undefined =>
  window.daum?.Postcode ?? window.kakao?.Postcode

/** postcode.v2.js 스크립트를 한 번만 동적 로드한다. */
const loadScript = (): Promise<void> => {
  if (getPostcode()) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_SRC}"]`,
    )
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('우편번호 서비스를 불러오지 못했습니다.')))
      return
    }

    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => {
      scriptPromise = null
      reject(new Error('우편번호 서비스를 불러오지 못했습니다.'))
    }
    document.head.appendChild(script)
  })

  return scriptPromise
}

/**
 * 다음 우편번호 검색 팝업을 여는 훅.
 * `open(onComplete)` 호출 시 스크립트를 로드(최초 1회)한 뒤 팝업을 띄우고,
 * 사용자가 주소를 선택하면 onComplete 콜백으로 결과를 전달한다.
 */
export function useDaumPostcode() {
  const open = useCallback(
    async (onComplete: (data: DaumPostcodeData) => void) => {
      await loadScript()
      const Postcode = getPostcode()
      if (!Postcode) {
        throw new Error('우편번호 서비스를 불러오지 못했습니다.')
      }
      new Postcode({
        oncomplete: (data) => onComplete(data),
      }).open()
    },
    [],
  )

  return { open }
}
