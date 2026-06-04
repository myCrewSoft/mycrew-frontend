import DrivePage from "../../pages/drive/DrivePage";

export const driveRoutes = [
    {path: '/drive', element: <DrivePage />},
    { path: '/drive/folders/:folderId', element: <DrivePage /> },
]