import React from 'react';

// Card 컴포넌트가 사용할 옵션(Props)들을 정의합니다.
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 카드 내부 여백 설정 (기본값: 'md') */
  padding?: 'none' | 'sm' | 'md' | 'lg';
  /** 마우스 오버 시 위로 떠오르는 애니메이션 효과 여부 (위젯용) */
  hoverable?: boolean;
  /** 컴포넌트 내부 내용 */
  children: React.ReactNode;
}