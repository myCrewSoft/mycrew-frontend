import DrivePage from "../../pages/drive/DrivePage";
import DriveTrashPage from "../../pages/drive/DriveTrashPage";
import DriveBookmarkPage from "../../pages/drive/DriveBookmarkPage";
import ProjectDrivePage from "../../pages/drive/ProjectDrivePage";

export const driveRoutes = [
    { path: '/drive', element: <DrivePage /> },
    { path: '/drive/folders/:folderId', element: <DrivePage /> },
    { path: '/drive/trash', element: <DriveTrashPage /> },
    { path: '/drive/bookmark', element: <DriveBookmarkPage />},
    { path: '/drive/project', element: <ProjectDrivePage />}
]