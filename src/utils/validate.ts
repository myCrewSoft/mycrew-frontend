// src/utils/validate.ts

// ── 타입 정의 ─────────────────────────────────────────────────────

/** 검증 함수 타입. 통과하면 undefined, 실패하면 에러 메시지 반환 */
type ValidateFn = (value: unknown) => string | undefined;

// ── 검증 함수 모음 ────────────────────────────────────────────────

export const validate = {

  // ── 필수 입력 ──────────────────────────────────────────────────

  /**
   * 필수 입력 검증.
   * null, undefined, 빈 문자열, 공백만 있는 문자열 모두 실패 처리.
   *
   * @example
   * validate.required(form.name) // "필수 입력 항목입니다." or undefined
   */
  required: (value: unknown): string | undefined => {
    if (value === null || value === undefined) return '필수 입력 항목입니다.';
    if (typeof value === 'string' && !value.trim()) return '필수 입력 항목입니다.';
    if (Array.isArray(value) && value.length === 0) return '필수 입력 항목입니다.';
    return undefined;
  },

  // ── 문자열 길이 ────────────────────────────────────────────────

  /**
   * 최소 글자수 검증.
   *
   * @example
   * validate.minLength(2)(form.name) // "2자 이상 입력하세요." or undefined
   */
  minLength: (min: number, msg?: string) => (value: string): string | undefined => {
    if (!value) return undefined; // 빈 값은 required 에서 처리
    return value.trim().length >= min
      ? undefined
      : msg ?? `${min}자 이상 입력하세요.`;
  },

  /**
   * 최대 글자수 검증.
   *
   * @example
   * validate.maxLength(50)(form.title) // "50자 이하로 입력하세요." or undefined
   */
  maxLength: (max: number, msg?: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    return value.trim().length <= max
      ? undefined
      : msg ?? `${max}자 이하로 입력하세요.`;
  },

  // ── 형식 검증 ──────────────────────────────────────────────────

  /**
   * 이메일 형식 검증.
   *
   * @example
   * validate.email(form.email) // "이메일 형식이 아닙니다." or undefined
   */
  email: (value: string): string | undefined => {
    if (!value) return undefined;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
      ? undefined
      : '이메일 형식이 아닙니다.';
  },

  /**
   * 비밀번호 형식 검증.
   * 영문 + 숫자 + 특수문자 포함, 8자 이상.
   *
   * @example
   * validate.password(form.password)
   */
  password: (value: string): string | undefined => {
    if (!value) return undefined;
    if (value.length < 8) return '비밀번호는 8자 이상이어야 합니다.';
    if (!/[A-Za-z]/.test(value)) return '영문자를 포함해야 합니다.';
    if (!/[0-9]/.test(value)) return '숫자를 포함해야 합니다.';
    if (!/[!@#$%^&*]/.test(value)) return '특수문자(!@#$%^&*)를 포함해야 합니다.';
    return undefined;
  },

  /**
   * 비밀번호 확인 일치 검증.
   *
   * @example
   * validate.confirmPassword(form.password)(form.passwordConfirm)
   */
  confirmPassword: (password: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    return value === password ? undefined : '비밀번호가 일치하지 않습니다.';
  },

  /**
   * 전화번호 형식 검증. (010-1234-5678)
   *
   * @example
   * validate.phone(form.phone)
   */
  phone: (value: string): string | undefined => {
    if (!value) return undefined;
    return /^01[016789]-?\d{3,4}-?\d{4}$/.test(value.replace(/-/g, '').replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'))
      ? undefined
      : '올바른 전화번호 형식이 아닙니다. (예: 010-1234-5678)';
  },

  /**
   * 숫자만 입력 검증.
   *
   * @example
   * validate.onlyNumber(form.employeeNumber)
   */
  onlyNumber: (value: string): string | undefined => {
    if (!value) return undefined;
    return /^\d+$/.test(value) ? undefined : '숫자만 입력 가능합니다.';
  },

  /**
   * 한글만 입력 검증.
   *
   * @example
   * validate.onlyKorean(form.name)
   */
  onlyKorean: (value: string): string | undefined => {
    if (!value) return undefined;
    return /^[가-힣\s]+$/.test(value) ? undefined : '한글만 입력 가능합니다.';
  },

  // ── 숫자 범위 ──────────────────────────────────────────────────

  /**
   * 최솟값 검증.
   *
   * @example
   * validate.min(1)(form.quantity) // "1 이상 입력하세요." or undefined
   */
  min: (minVal: number, msg?: string) => (value: number | string): string | undefined => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value) >= minVal
      ? undefined
      : msg ?? `${minVal} 이상 입력하세요.`;
  },

  /**
   * 최댓값 검증.
   *
   * @example
   * validate.max(100)(form.percentage)
   */
  max: (maxVal: number, msg?: string) => (value: number | string): string | undefined => {
    if (value === '' || value === null || value === undefined) return undefined;
    return Number(value) <= maxVal
      ? undefined
      : msg ?? `${maxVal} 이하로 입력하세요.`;
  },

  // ── 날짜 ──────────────────────────────────────────────────────

  /**
   * 종료일이 시작일 이후인지 검증.
   *
   * @example
   * validate.dateAfter(form.startDate)(form.endDate)
   */
  dateAfter: (baseDate: string, msg?: string) => (value: string): string | undefined => {
    if (!value || !baseDate) return undefined;
    return new Date(value) >= new Date(baseDate)
      ? undefined
      : msg ?? '시작일 이후 날짜를 선택하세요.';
  },

  /**
   * 오늘 이후 날짜인지 검증.
   *
   * @example
   * validate.futureDate(form.startDate)
   */
  futureDate: (value: string): string | undefined => {
    if (!value) return undefined;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(value) >= today
      ? undefined
      : '오늘 이후 날짜를 선택하세요.';
  },

  // ── 배열 ──────────────────────────────────────────────────────

  /**
   * 배열 최소 선택 개수 검증. (참석자, 체크박스 등)
   *
   * @example
   * validate.minSelect(1)(form.members) // "최소 1개 이상 선택하세요." or undefined
   */
  minSelect: (min: number, msg?: string) => (value: unknown[]): string | undefined => {
    if (!value) return undefined;
    return value.length >= min
      ? undefined
      : msg ?? `최소 ${min}개 이상 선택하세요.`;
  },

  /**
   * 배열 최대 선택 개수 검증.
   *
   * @example
   * validate.maxSelect(10)(form.members)
   */
  maxSelect: (max: number, msg?: string) => (value: unknown[]): string | undefined => {
    if (!value) return undefined;
    return value.length <= max
      ? undefined
      : msg ?? `최대 ${max}개까지 선택 가능합니다.`;
  },

  // ── 파일 ──────────────────────────────────────────────────────

  /**
   * 파일 크기 검증. (MB 단위)
   *
   * @example
   * validate.fileSize(5)(file) // "파일 크기는 5MB 이하여야 합니다." or undefined
   */
  fileSize: (maxMB: number) => (file: File): string | undefined => {
    if (!file) return undefined;
    return file.size <= maxMB * 1024 * 1024
      ? undefined
      : `파일 크기는 ${maxMB}MB 이하여야 합니다.`;
  },

  /**
   * 파일 확장자 검증.
   *
   * @example
   * validate.fileType(['jpg', 'png', 'pdf'])(file)
   */
  fileType: (allowedTypes: string[], msg?: string) => (file: File): string | undefined => {
    if (!file) return undefined;
    const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
    return allowedTypes.includes(ext)
      ? undefined
      : msg ?? `${allowedTypes.join(', ')} 파일만 업로드 가능합니다.`;
  },

  // ── 커스텀 ────────────────────────────────────────────────────

  /**
   * 정규식으로 직접 검증.
   *
   * @example
   * validate.pattern(/^[A-Z]{2}\d{4}$/, '형식: 영문 2자 + 숫자 4자')(form.code)
   */
  pattern: (regex: RegExp, msg: string) => (value: string): string | undefined => {
    if (!value) return undefined;
    return regex.test(value) ? undefined : msg;
  },
};

// ── 여러 검증 묶기 ────────────────────────────────────────────────

/**
 * 여러 검증 함수를 순서대로 실행하고 첫 번째 에러를 반환한다.
 * 모두 통과하면 undefined 반환.
 *
 * @example
 * chain(validate.required, validate.email)(form.email)
 */
export function chain(...fns: ValidateFn[]) {
  return (value: unknown): string | undefined => {
    for (const fn of fns) {
      const err = fn(value);
      if (err) return err;
    }
    return undefined;
  };
}

// ── 폼 전체 검증 ──────────────────────────────────────────────────

/**
 * 폼 전체 필드를 한 번에 검증하고 에러 객체를 반환한다.
 * 에러가 없는 필드는 undefined 로 반환된다.
 *
 * @example
 * const errors = validateForm({
 *   email:    chain(validate.required, validate.email)(form.email),
 *   password: chain(validate.required, validate.password)(form.password),
 * });
 * if (errors.hasError) return;
 */
export function validateForm<T extends Record<string, string | undefined>>(
  errorMap: T
): T & { hasError: boolean } {
  return {
    ...errorMap,
    hasError: Object.values(errorMap).some(Boolean),
  };
}