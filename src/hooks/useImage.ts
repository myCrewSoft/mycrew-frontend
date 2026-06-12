import { useEffect, useState } from 'react'
import { getImage } from '../api/fileApi'

// 인증(JWT)이 필요한 이미지 엔드포인트를 axios(blob)로 받아 objectURL로 변환한다.
// id가 없거나(0/null) 조회에 실패하면 null을 반환해 호출 측이 폴백을 보여줄 수 있게 한다.
const useImage = (atchFileDtlId?: number | null) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!atchFileDtlId) {
            setImageSrc(null);
            return;
        }

        let objectUrl: string;
        let active = true;

        getImage(atchFileDtlId)
            .then(res => {
                if (!active) return;
                objectUrl = URL.createObjectURL(res.data);
                setImageSrc(objectUrl);
            })
            .catch(() => {
                if (active) setImageSrc(null);
            });

        return () => {
            active = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl); // 클로저 문제 해결
        };
    }, [atchFileDtlId]);

        objectUrl = URL.createObjectURL(response.data)
        setImageSrc(objectUrl)
      })
      .catch(() => {
        if (active) setImageSrc(null)
      })

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [atchFileDtlId])

  return atchFileDtlId ? imageSrc : null
}

export default useImage;
