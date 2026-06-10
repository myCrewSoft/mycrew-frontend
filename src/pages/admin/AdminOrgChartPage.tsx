import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';
import type { Edge, Node, NodeProps } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  Drawer,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Typography,
} from '@mui/material';
import {
  Building2,
  GitBranch,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { ApiError } from '../../api/axiosInstance';
import Button from '../../components/common/button/Button';
import Badge from '../../components/common/dataDisplay/badge/Badge';
import ContentCard from '../../components/common/dataDisplay/card/ContentCard';
import EmptyState from '../../components/common/dataDisplay/emptyState/EmptyState';
import type {
  AdminDepartmentMemberResponseDTO,
  AdminDepartmentResponseDTO,
} from '../../types/admin';

interface OrgNodeData extends Record<string, unknown> {
  department: AdminDepartmentResponseDTO;
  depth: number;
}

type DepartmentNode = Node<OrgNodeData, 'department'>;

interface DepartmentTreeNode {
  department: AdminDepartmentResponseDTO;
  children: DepartmentTreeNode[];
}

const nodeWidth = 230;
const nodeHeight = 118;
const horizontalGap = 70;
const verticalGap = 150;

const toApiError = (err: unknown) =>
  err instanceof ApiError
    ? err
    : new ApiError((err as Error).message, 'UNKNOWN', 0);

const buildDepartmentTree = (
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

  const sortNodes = (nodes: DepartmentTreeNode[]) => {
    nodes.sort((left, right) =>
      left.department.deptNm.localeCompare(right.department.deptNm, 'ko'),
    );
    nodes.forEach((node) => sortNodes(node.children));
  };

  sortNodes(roots);
  return roots;
};

const countLeaves = (node: DepartmentTreeNode): number => {
  if (node.children.length === 0) {
    return 1;
  }

  return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
};

const layoutTree = (
  roots: DepartmentTreeNode[],
): { nodes: DepartmentNode[]; edges: Edge[] } => {
  const nodes: DepartmentNode[] = [];
  const edges: Edge[] = [];
  let nextX = 0;

  const visit = (node: DepartmentTreeNode, depth: number, parentId?: string) => {
    const leafCount = countLeaves(node);
    const subtreeWidth =
      leafCount * nodeWidth + Math.max(0, leafCount - 1) * horizontalGap;
    const startX = nextX;

    node.children.forEach((child) => visit(child, depth + 1, node.department.deptCd));

    const x =
      node.children.length === 0
        ? nextX
        : startX + subtreeWidth / 2 - nodeWidth / 2;

    if (node.children.length === 0) {
      nextX += nodeWidth + horizontalGap;
    }

    nodes.push({
      id: node.department.deptCd,
      type: 'department',
      position: {
        x,
        y: depth * verticalGap,
      },
      data: {
        department: node.department,
        depth,
      },
    });

    if (parentId) {
      edges.push({
        id: `${parentId}-${node.department.deptCd}`,
        source: parentId,
        target: node.department.deptCd,
        type: 'smoothstep',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
        },
        style: {
          stroke: '#94a3b8',
          strokeWidth: 2,
        },
      });
    }
  };

  roots.forEach((root, index) => {
    if (index > 0) {
      nextX += horizontalGap;
    }
    visit(root, 0);
  });

  return { nodes, edges };
};

const DepartmentNodeCard = ({ data }: NodeProps<DepartmentNode>) => {
  const { department, depth } = data;

  return (
    <div className="min-h-[118px] w-[230px] rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:shadow-md">
      <Handle
        type="target"
        position={Position.Top}
        className="!h-2 !w-2 !border-0 !bg-blue-500"
      />
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
            <Building2 size={20} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-black text-slate-950">
              {department.deptNm}
            </p>
            <p className="mt-1 truncate text-xs font-bold text-slate-400">
              {department.deptCd}
            </p>
          </div>
        </div>
        <Badge variant={department.useYn === 'Y' ? 'success' : 'danger'}>
          {department.useYn === 'Y' ? '사용' : '중지'}
        </Badge>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
        <span className="flex items-center gap-1">
          <Users size={14} />
          {department.memberCount}명
        </span>
        <span>Level {depth + 1}</span>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-2 !w-2 !border-0 !bg-blue-500"
      />
    </div>
  );
};

const nodeTypes = {
  department: DepartmentNodeCard,
};

const drawerPaperStyle: CSSProperties = {
  width: 420,
  maxWidth: '100vw',
};

export default function AdminOrgChartPage() {
  const [departments, setDepartments] = useState<AdminDepartmentResponseDTO[]>(
    [],
  );
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState<string | null>(null);
  const [selectedDepartment, setSelectedDepartment] =
    useState<AdminDepartmentResponseDTO | null>(null);
  const [members, setMembers] = useState<AdminDepartmentMemberResponseDTO[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);
  const [layoutError, setLayoutError] = useState<string | null>(null);
  const [layoutUpdating, setLayoutUpdating] = useState(false);
  const [nodes, setNodes, onNodesChange] = useNodesState<DepartmentNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  const memberCount = departments.reduce(
    (sum, department) => sum + department.memberCount,
    0,
  );

  const rootCount = useMemo(
    () =>
      departments.filter((department) => {
        if (!department.parentDeptCd) {
          return true;
        }

        return !departments.some(
          (candidate) => candidate.deptCd === department.parentDeptCd,
        );
      }).length,
    [departments],
  );

  const loadDepartments = useCallback(async () => {
    setDepartmentsLoading(true);
    setDepartmentsError(null);

    try {
      const response = await adminApi.getDepartments();
      const nextDepartments = response.data.data ?? [];
      const tree = buildDepartmentTree(nextDepartments);
      const graph = layoutTree(tree);

      setDepartments(nextDepartments);
      setNodes(graph.nodes);
      setEdges(graph.edges);
    } catch (err) {
      const apiError = toApiError(err);

      setDepartments([]);
      setNodes([]);
      setEdges([]);
      setDepartmentsError(apiError.message);
    } finally {
      setDepartmentsLoading(false);
    }
  }, [setEdges, setNodes]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadDepartments();
    });
  }, [loadDepartments]);

  const loadMembers = async (department: AdminDepartmentResponseDTO) => {
    setSelectedDepartment(department);
    setMembersLoading(true);
    setMembersError(null);

    try {
      const response = await adminApi.getDepartmentMembers(department.deptCd);
      setMembers(response.data.data ?? []);
    } catch (err) {
      const apiError = toApiError(err);

      setMembers([]);
      setMembersError(apiError.message);
    } finally {
      setMembersLoading(false);
    }
  };

  const findDropTarget = (
    draggedNode: DepartmentNode,
    currentNodes: DepartmentNode[],
  ) => {
    const centerX = draggedNode.position.x + nodeWidth / 2;
    const centerY = draggedNode.position.y + nodeHeight / 2;

    return currentNodes.find((node) => {
      if (node.id === draggedNode.id) {
        return false;
      }

      const left = node.position.x;
      const right = left + nodeWidth;
      const top = node.position.y;
      const bottom = top + nodeHeight;

      return centerX >= left && centerX <= right && centerY >= top && centerY <= bottom;
    });
  };

  const changeDepartmentParent = async (draggedNode: DepartmentNode) => {
    const targetNode = findDropTarget(draggedNode, nodes);

    if (!targetNode) {
      return;
    }

    const department = draggedNode.data.department;
    const targetDepartment = targetNode.data.department;

    if (department.parentDeptCd === targetDepartment.deptCd) {
      return;
    }

    setLayoutUpdating(true);
    setLayoutError(null);

    try {
      await adminApi.updateDepartment(department.deptCd, {
        deptNm: department.deptNm,
        parentDeptCd: targetDepartment.deptCd,
      });
      await loadDepartments();
    } catch (err) {
      const apiError = toApiError(err);

      setLayoutError(apiError.message);
      await loadDepartments();
    } finally {
      setLayoutUpdating(false);
    }
  };

  const closeDrawer = () => {
    setSelectedDepartment(null);
    setMembers([]);
    setMembersError(null);
  };

  return (
    <section className="flex min-h-full w-full flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <h2 className="text-2xl font-bold tracking-tight text-slate-950">
            조직도
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500">
            부서 API를 기반으로 조직 구조를 시각화하고, 카드를 드래그해 배치를 조정합니다.
          </p>
        </div>
        <Button
          variant="outline"
          leftIcon={<RefreshCw size={17} />}
          loading={departmentsLoading}
          onClick={() => void loadDepartments()}
        >
          새로고침
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <ContentCard title="전체 부서">
          <div className="flex items-end justify-between gap-4">
            <div className="text-3xl font-bold tracking-tight text-slate-950">
              {departments.length}
            </div>
            <Building2 size={26} className="text-blue-600" />
          </div>
        </ContentCard>
        <ContentCard title="루트 부서">
          <div className="flex items-end justify-between gap-4">
            <div className="text-3xl font-bold tracking-tight text-slate-950">
              {rootCount}
            </div>
            <GitBranch size={26} className="text-violet-600" />
          </div>
        </ContentCard>
        <ContentCard title="소속 인원">
          <div className="flex items-end justify-between gap-4">
            <div className="text-3xl font-bold tracking-tight text-slate-950">
              {memberCount}
            </div>
            <Users size={26} className="text-emerald-600" />
          </div>
        </ContentCard>
      </div>

      <ContentCard
        title="조직도 편집"
        description="부서 카드를 드래그해 보기 좋은 위치로 자유롭게 재배치할 수 있습니다. 부서를 클릭하면 오른쪽에서 소속 사원을 확인합니다."
      >
        {departmentsError ? (
          <EmptyState
            icon={<Building2 size={24} />}
            title="조직도를 불러오지 못했습니다."
            description={departmentsError}
            actions={
              <Button variant="outline" onClick={() => void loadDepartments()}>
                다시 시도
              </Button>
            }
          />
        ) : departments.length === 0 && !departmentsLoading ? (
          <EmptyState
            icon={<Building2 size={24} />}
            title="표시할 부서가 없습니다."
            description="부서 관리에서 부서를 생성하면 조직도에 표시됩니다."
          />
        ) : (
          <div className="h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
            <ReactFlowProvider>
              <ReactFlow<DepartmentNode, Edge>
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeDragStart={() => setLayoutError(null)}
                onNodeDragStop={(_, node) =>
                  void changeDepartmentParent(node as DepartmentNode)
                }
                onNodeClick={(_, node) => void loadMembers(node.data.department)}
                fitView
                minZoom={0.35}
                maxZoom={1.4}
                nodesDraggable
                nodesConnectable={false}
                elementsSelectable
              >
                <Background color="#cbd5e1" gap={22} />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) =>
                    node.id === selectedDepartment?.deptCd ? '#2563eb' : '#94a3b8'
                  }
                />
                <Controls position="bottom-right" />
              </ReactFlow>
            </ReactFlowProvider>
          </div>
        )}
        {layoutUpdating && (
          <p className="mt-3 rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-600">
            조직도 변경사항을 저장하는 중입니다.
          </p>
        )}
        {layoutError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">
            {layoutError}
          </p>
        )}
      </ContentCard>

      <Drawer
        anchor="right"
        open={selectedDepartment !== null}
        onClose={closeDrawer}
        PaperProps={{ style: drawerPaperStyle }}
      >
        <Box sx={{ p: 3 }}>
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box minWidth={0}>
              <Typography variant="h6" fontWeight={800} color="text.primary">
                {selectedDepartment?.deptNm ?? '부서'}
              </Typography>
              <Typography variant="body2" color="text.secondary" noWrap>
                {selectedDepartment?.deptCd ?? '-'}
              </Typography>
            </Box>
            <button
              type="button"
              onClick={closeDrawer}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50"
              aria-label="닫기"
            >
              <X size={18} />
            </button>
          </Box>

          <Box mt={2} display="flex" gap={1} flexWrap="wrap">
            <Chip
              size="small"
              label={`소속 ${selectedDepartment?.memberCount ?? 0}명`}
              color="primary"
              variant="outlined"
            />
            <Chip
              size="small"
              label={selectedDepartment?.parentDeptNm ?? '상위 부서 없음'}
              variant="outlined"
            />
          </Box>

          <Divider sx={{ my: 2.5 }} />

          {membersError ? (
            <Typography variant="body2" color="error" fontWeight={700}>
              {membersError}
            </Typography>
          ) : membersLoading ? (
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              사원 목록을 불러오는 중입니다.
            </Typography>
          ) : members.length > 0 ? (
            <List disablePadding>
              {members.map((member) => (
                <ListItem
                  key={member.empId}
                  disableGutters
                  sx={{
                    py: 1.25,
                    borderBottom: '1px solid #e2e8f0',
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: '#2563eb', fontWeight: 800 }}>
                      {member.empNm.slice(0, 1)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography fontWeight={800} color="text.primary">
                        {member.empNm}
                      </Typography>
                    }
                    secondary={[
                      `EMP-${member.empId}`,
                      member.jobGrdNm ?? member.jobGrdCd,
                      member.jobPstnNm ?? member.jobPstnCd,
                      member.empStatNm ?? member.empStatCd,
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  />
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography variant="body2" color="text.secondary" fontWeight={700}>
              이 부서에 소속된 사원이 없습니다.
            </Typography>
          )}
        </Box>
      </Drawer>
    </section>
  );
}
