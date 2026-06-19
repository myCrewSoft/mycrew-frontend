# 🌐 MyCrew Frontend

> **MyCrewSoft** — 통합 그룹웨어 플랫폼 프론트엔드 레포지토리  
> React · TypeScript · Tailwind CSS · Vite

---

## 📌 프로젝트 개요

사내에 분산된 커뮤니케이션, 일정, 문서 공유, 예약, 회의, 메일 기능을 하나의 플랫폼으로 통합한 엔터프라이즈 그룹웨어입니다.  
React + TypeScript 기반 SPA로 구성되며, OpenAPI 타입 자동 생성으로 백엔드 DTO 변경을 빌드 단계에서 즉시 감지합니다.

---

## 👥 팀 구성

| 역할 | 이름 | 담당 도메인 |
|------|------|------------|
| PL | 임원호 | 전자결재, 프로젝트 관리, 게시판, 조직도 |
| DA | 노윤하 | DB 설계, ERD |
| UA | 박비주 | UI/UX, 화면 설계 |
| AA | 한재훈 | 공통 구조 전체, 화상회의/회의, 메신저, 알림, 대시보드, 통합검색, 업무, 일정, 회의실 예약, LLM 챗봇, 관리자 페이지 |

---

## 🛠️ 기술 스택

| 분류 | 기술 |
|------|------|
| Language | TypeScript |
| Framework | React |
| Bundler | Vite |
| Style | Tailwind CSS |
| Routing | React Router v6 |
| HTTP | Axios |
| 타입 자동생성 | openapi-typescript (Swagger 스펙 기반) |
| 차트 | Recharts |
| 캘린더 | FullCalendar |
| 실시간 | EventSource (SSE), STOMP/WebSocket |
| 화상회의 | LiveKit Client SDK |

---

## 📁 프로젝트 구조

```
src/
├── main.tsx
├── App.tsx
├── api/
│   ├── axiosInstance.ts          # Axios 인스턴스 + 토큰 자동 갱신 인터셉터
│   ├── meetingApi.ts             # 도메인별 API 함수
│   ├── scheduleApi.ts
│   └── ...
├── components/
│   ├── ProtectedRoute.tsx        # 인증·권한 라우트 보호
│   ├── layouts/
│   │   ├── AuthLayout.tsx        # 로그인/회원가입용 레이아웃
│   │   └── MainLayout.tsx        # 일반 페이지 레이아웃
│   └── common/
│       └── EmployeeSearchPicker.tsx  # 공통 사원 검색 컴포넌트
├── pages/                        # 라우트 단위 페이지
├── hooks/
│   ├── useApi.ts                 # 단건 API 훅
│   └── useApiList.ts             # 목록 + 페이지네이션 훅
├── store/
│   ├── authStore.ts              # JWT 디코딩·상태 계산
│   └── AuthContext.tsx           # 인증 상태 Context
├── types/
│   ├── generated.ts              # 자동 생성 (수정 금지)
│   └── index.ts                  # 타입 별칭 정의
├── utils/
│   └── validate.ts               # 폼 검증 유틸
└── router/
    └── index.tsx                 # React Router 설정
```

---

## ⚙️ 환경 설정

### 필수 환경 변수 (`.env.development`)

```env
VITE_API_URL=http://localhost:80
```

### 설치 및 실행

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 백엔드 실행 중일 때 타입 자동 생성
npm run generate-api

# 빌드
npm run build
```

---

## 🏗️ 핵심 설계

### 1. Axios 인스턴스 — 토큰 자동 갱신

`axiosInstance.ts` 에서 401 응답 시 Refresh Token으로 자동 재발급 후 원래 요청을 재시도합니다. 동시에 여러 요청이 401을 받아도 재발급은 한 번만 수행됩니다.

```typescript
// 직접 axios import 금지 — 반드시 axiosInstance 사용
import axiosInstance from '../api/axiosInstance';
```

### 2. useApi / useApiList 훅

loading·error·data 상태를 자동 관리합니다. 언마운트 안전 처리와 execute 참조 고정이 내장되어 있습니다.

```typescript
// 마운트 시 자동 호출
const { data, loading, error } = useApi(meetingApi.getMeetings);

// 수동 호출 (버튼, 폼 제출 등)
const { execute: createMeeting, loading } = useApi(meetingApi.createMeeting, {
  immediate: false
});

// 목록 + 페이지네이션
const { data: meetings, pagination, execute } = useApiList(meetingApi.getMeetings);
```

### 3. AuthContext — 인증 상태 관리

JWT를 디코딩해 `payload`, `isExpired`, `roles` 상태를 제공합니다. `axiosInstance`가 토큰 갱신 시 `token-refreshed` 이벤트를 발행하면 Context가 자동으로 상태를 재계산합니다.

```typescript
const { auth, clearAuth } = useAuth();
// auth.roles → ['ROLE_ADMIN', ...]
// auth.isExpired → 만료 여부
```

### 4. ProtectedRoute — 라우트 보호

```typescript
// 로그인 필요
<ProtectedRoute><MainLayout /></ProtectedRoute>

// 관리자 전용
<ProtectedRoute role="ROLE_ADMIN"><AdminPage /></ProtectedRoute>
```

### 5. OpenAPI 타입 자동 생성

백엔드 DTO 변경 시 아래 명령어 한 줄로 프론트 타입이 동기화됩니다.

```bash
npm run generate-api
# → src/types/generated.ts 자동 갱신
```

`generated.ts`는 수정 금지. `src/types/index.ts`에서 별칭으로 export해서 사용합니다.

```typescript
// ❌ generated.ts 직접 import 금지
// ✅ index.ts 에서만 import
import { MeetingResponseDto } from '../types';
```

### 6. 폼 검증 유틸

```typescript
import { validate, chain, validateForm } from '../utils/validate';

const errors = validateForm({
  email:    chain(validate.required, validate.email)(form.email),
  password: chain(validate.required, validate.minLength(8))(form.password),
});
if (errors.hasError) return;
```

---

## 🔌 실시간 기능

### SSE 알림

```typescript
// axios 사용 불가 — 반드시 EventSource 사용
const eventSource = new EventSource('/api/v1/notifications/subscribe');
eventSource.onmessage = (e) => { ... };
```

### WebSocket 메신저

STOMP 프로토콜 사용. CONNECT 시 JWT 토큰을 헤더에 포함합니다.

```typescript
const client = new Client({
  connectHeaders: { Authorization: `Bearer ${token}` },
  ...
});
```

---

## 🌿 Git 브랜치 전략

```
main      ← 배포 브랜치 (직접 커밋 금지)
  └── develop   ← 통합 브랜치
        ├── feature/{기능명}
        └── hotfix/{버그명}
```

### 커밋 메시지 형식

```
feat: 대시보드 위젯 레이아웃 저장 기능 추가
fix: 캘린더 날짜 범위 필터 오류 수정
refactor: useApi 훅 언마운트 안전 처리 개선
style: Tailwind 클래스 정리
```

### PR 규칙

- PR 방향: `feature` → `develop`
- 제목 형식: `[feat] 통합 검색 명령 팔레트 UI 구현`
- 팀원 2명 이상 Approve 후 AA/PL이 머지

---

## 📋 개발 컨벤션

### 파일 확장자

| 파일 종류 | 확장자 |
|-----------|--------|
| 페이지 · UI 컴포넌트 · Context Provider | `.tsx` |
| 커스텀 훅 · API 함수 · 타입 정의 · 유틸 | `.ts` |

### 페이지 파일명

```
PascalCase + Page  예) MeetingPage.tsx, DashboardPage.tsx
```

### API 함수 작성 규칙

```typescript
// AxiosResponse 를 그대로 반환 (useApi 훅이 data 언래핑)
export const getMeetings = () =>
  axiosInstance.get<ApiResponse<MeetingResponseDto[]>>('/api/v1/meetings');
```

### 라우터 추가 방법

1. `src/pages/` 에 페이지 컴포넌트 작성
2. `src/router/` 에 도메인별 라우트 파일 추가
3. `src/router/index.tsx` 에 등록 (AA에게 요청)

---

## 📅 프로젝트 기간

**2025.12.01 ~ 2026.07.06** (대덕인재개발원 전자정부 표준 프레임워크 & React 기반 풀스택 개발자 양성과정 14기)
