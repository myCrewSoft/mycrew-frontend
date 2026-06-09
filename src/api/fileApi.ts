import axiosInstance from "./axiosInstance";

export const getImage = (atchFileDtlId : number) =>
    axiosInstance.get(`/api/files/images/${atchFileDtlId}`, {responseType : "blob"})