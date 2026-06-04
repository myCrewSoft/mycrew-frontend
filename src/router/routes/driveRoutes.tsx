import DrivePage from "../../pages/drive/DrivePage";
import DriveTrashPage from "../../pages/drive/DriveTrashPage";

export const driveRoutes = [
    { path: '/drive', element: <DrivePage /> },
    { path: '/drive/folders/:folderId', element: <DrivePage /> },
    { path: '/drive/trash', element: <DriveTrashPage /> },
    //휴지통 추가
]