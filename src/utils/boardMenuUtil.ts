/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * 백엔드가 제공한 완벽한 계층형 메뉴(boardMenuItems)를 
 * 공통 사이드바의 첫 번째 섹션 아이템으로 통째로 결합합니다.
 */
const mergeBoardSections = (
  baseSections: any[],
  boardMenuItems: any[],
): any[] => {
  if (!baseSections) return [];

  // 기존 구조 얕은 복사
  const clonedSections = baseSections.map(section => ({
    ...section,
    items: section.items ? [...section.items] : []
  }));

  if (!boardMenuItems || boardMenuItems.length === 0) {
    return clonedSections;
  }

  // 🎯 임의의 필터링이나 하드코딩 없이, 완성된 계층 데이터를 통째로 주입합니다.
  for (const section of clonedSections) {
    if (section.items) {
      section.items = boardMenuItems;
      break;
    }
  }

  return clonedSections;
};
export default mergeBoardSections
