import type { RouteObject } from 'react-router-dom'
import MeetingPage from '../../pages/meeting/MeetingPage'

export const meetingRoutes: RouteObject[] = [
    { path: '/meeting', element: <MeetingPage /> },
    { path: '/meeting/list', element: <MeetingPage /> },
    { path: '/meeting/scheduled', element: <MeetingPage /> },
    { path: '/meeting/history', element: <MeetingPage /> },
    { path: '/meeting/minutes', element: <MeetingPage /> },
]
