import { useEffect, useState } from 'react'
import { getImage } from '../api/fileApi'

const useImage = (atchFileDtlId?: number | null) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null)

  useEffect(() => {
    if (!atchFileDtlId) return

    let active = true
    let objectUrl: string | null = null

    getImage(atchFileDtlId)
      .then((response) => {
        if (!active) return

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

export default useImage
