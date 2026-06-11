import { useEffect, useState } from "react"
import { getImage } from "../api/fileApi";

const useImage = (atchFileDtlId: number) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string;

        getImage(atchFileDtlId)
            .then(res => {
                objectUrl = URL.createObjectURL(res.data);
                setImageSrc(objectUrl);
            });

        return () => {
            if (objectUrl) URL.revokeObjectURL(objectUrl); // 클로저 문제 해결
        };
    }, [atchFileDtlId]);

    return imageSrc;
}

export default useImage;