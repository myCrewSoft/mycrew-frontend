interface BoardDisplayNumberParams {
  totalElements: number
  page: number
  pageSize: number
  rowIndex: number
}

export const getBoardDisplayNumber = ({
  totalElements,
  page,
  pageSize,
  rowIndex,
}: BoardDisplayNumberParams) => (
  Math.max(totalElements - (page - 1) * pageSize - rowIndex, 1)
)
