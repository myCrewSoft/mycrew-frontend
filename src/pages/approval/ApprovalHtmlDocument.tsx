import { useRef, useState } from 'react'
import './ApprovalPage.css'

type Props = {
  html: string
  minHeight?: number
}

const EMPTY_HTML = `<p style="color:#94a3b8;font-family:sans-serif;margin:1rem 0">내용이 없습니다.</p>`

/**
 * 결재 문서 HTML 뷰어
 *
 * dangerouslySetInnerHTML 대신 iframe srcdoc을 사용하여
 * 템플릿 내부의 <style>, <body> 등이 부모 페이지 UI에
 * 영향을 주지 않도록 완전히 격리합니다.
 */
export default function ApprovalHtmlDocument({ html, minHeight = 200 }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState(minHeight)

  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument
    if (!doc) return
    // 콘텐츠 높이를 읽어 iframe 높이를 자동 조절
    const scrollHeight =
      doc.documentElement.scrollHeight || doc.body?.scrollHeight || minHeight
    setHeight(Math.max(scrollHeight, minHeight))
  }

  return (
    <div className="approval-page__document-viewer">
      <iframe
        ref={iframeRef}
        srcDoc={html || EMPTY_HTML}
        onLoad={handleLoad}
        style={{ width: '100%', height, display: 'block', border: 'none' }}
        title="결재 문서"
        // allow-same-origin: 높이 자동 조절을 위해 contentDocument 접근 허용
        // allow-scripts 제외: 템플릿 내 스크립트 실행 차단
        sandbox="allow-same-origin"
      />
    </div>
  )
}
