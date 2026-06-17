import axiosInstance from './axiosInstance'
import type { AxiosResponse } from 'axios'
import type { ApiResponse } from './axiosInstance'
import type { RoomCreateRequest, RoomResponse, RoomUpdateRequest } from '../types'

const ROOM_PREFIX = 'api/meeting-rooms'

export const roomApi = {

    getRoom: (confRmId: number): Promise<AxiosResponse<ApiResponse<RoomResponse>>> => {
        return axiosInstance.get(`${ROOM_PREFIX}/${confRmId}`)
    },

    getRoomList: (): Promise<AxiosResponse<ApiResponse<RoomResponse[]>>> => {
        return axiosInstance.get(ROOM_PREFIX)
    },

    createRoom: (data: RoomCreateRequest): Promise<AxiosResponse<ApiResponse<number>>> => {
        return axiosInstance.post(ROOM_PREFIX, data)
    },

    updateRoom: (confRmId: number, data: RoomUpdateRequest): Promise<AxiosResponse<ApiResponse<void>>> => {
        return axiosInstance.put(`${ROOM_PREFIX}/${confRmId}`, data)
    },

    deleteRoom: (confRmId: number): Promise<AxiosResponse<ApiResponse<void>>> => {
        return axiosInstance.delete(`${ROOM_PREFIX}/${confRmId}`)
    },
}