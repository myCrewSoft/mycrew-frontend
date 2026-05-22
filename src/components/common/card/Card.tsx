import React from 'react';
// verbatimModuleSyntax 대응을 위해 type 키워드를 추가했습니다.
import type { CardProps } from './Card.types'; 

export default function Card({
  padding = 'md',
  hoverable = false,
  children,
  className = '',
  ...props
}: CardProps) {
  
  // 1. 패딩 스타일 매핑
  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4 md:p-6', 
    lg: 'p-6 md:p-8', 
  };

  // 2. 마우스 오버 효과 스타일
  const hoverStyles = hoverable
    ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all duration-200 ease-in-out select-none'
    : '';

  return (
    <div
      className={`bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props} 
    >
      {children}
    </div>
  );
}