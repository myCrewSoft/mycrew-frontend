import type { AdminDepartmentResponseDTO } from '../../../types/admin';

export interface DepartmentTreeNode {
  department: AdminDepartmentResponseDTO;
  children: DepartmentTreeNode[];
}

const sortDepartmentNodes = (nodes: DepartmentTreeNode[]) => {
  nodes.sort((left, right) =>
    left.department.deptNm.localeCompare(right.department.deptNm, 'ko'),
  );
  nodes.forEach((node) => sortDepartmentNodes(node.children));
  return nodes;
};

export const buildDepartmentTree = (
  departments: AdminDepartmentResponseDTO[],
): DepartmentTreeNode[] => {
  const nodeMap = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];

  departments.forEach((department) => {
    nodeMap.set(department.deptCd, {
      department,
      children: [],
    });
  });

  departments.forEach((department) => {
    const node = nodeMap.get(department.deptCd);

    if (!node) {
      return;
    }

    const parentNode = department.parentDeptCd
      ? nodeMap.get(department.parentDeptCd)
      : null;

    if (parentNode) {
      parentNode.children.push(node);
      return;
    }

    roots.push(node);
  });

  return sortDepartmentNodes(roots);
};
