import ProjectDetailPage from "../../pages/project/projectDetailPage";
import ProjectListPage from "../../pages/project/ProjectListPage";

export const projectRoutes = [
    { path: '/project', element: <ProjectListPage /> },
    { path: '/project/:id', element: <ProjectDetailPage /> },
]