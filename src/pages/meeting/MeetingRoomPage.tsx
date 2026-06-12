import { useEffect, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  PhoneOff,
  Users,
  MessageSquare,
  X,
  UserPlus,
  Link2,
  Check,
  Copy,
} from 'lucide-react'
import {
  Room,
  RoomEvent,
  Track,
  Participant,
} from 'livekit-client'
import { meetingApi } from '../../api/meetingApi'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'

// ── 타입 ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  senderName: string
  text: string
  isMe: boolean
  timestamp: Date
}

interface ParticipantTile {
  identity: string
  name: string
  videoTrack?: MediaStreamTrack
  audioTrack?: MediaStreamTrack
  isMuted: boolean
  isCameraOff: boolean
  isLocal: boolean
}

// ── 상수 ──────────────────────────────────────────────────────────

const STT_CHUNK_INTERVAL_MS = 5000

// ── 컴포넌트 ──────────────────────────────────────────────────────

const MeetingRoomPage = () => {
  const { vconfId } = useParams<{ vconfId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  // navigate state로 전달받은 토큰과 방 이름
  const { token, roomNm } = (location.state ?? {}) as {
    token?: string
    roomNm?: string
  }

  const roomRef = useRef<Room | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const sttChunksRef = useRef<Blob[]>([])
  const rcrdgChunksRef = useRef<Blob[]>([])
  const sttIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // cleanup·handleLeave 에서 직접 끊을 때 Disconnected 이벤트가 navigate 하지 않도록
  const isIntentionalDisconnectRef = useRef(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const [connected, setConnected] = useState(false)
  const [participants, setParticipants] = useState<ParticipantTile[]>([])
  const [isMuted, setIsMuted] = useState(false)
  const [isCameraOff, setIsCameraOff] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [participantListOpen, setParticipantListOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [subtitles, setSubtitles] = useState<string[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [uploadingRcrdg, setUploadingRcrdg] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteSelectedIds, setInviteSelectedIds] = useState<Array<string | number>>([])
  const [linkCopied, setLinkCopied] = useState(false)

  // ── 참여자 타일 업데이트 ────────────────────────────────────────

  const updateParticipants = useCallback((room: Room) => {
    const tiles: ParticipantTile[] = []

    const addTile = (participant: Participant, isLocal: boolean) => {
      const videoPublication = participant.getTrackPublication(Track.Source.Camera)
      const audioPublication = participant.getTrackPublication(Track.Source.Microphone)

      tiles.push({
        identity: participant.identity,
        name: participant.name ?? participant.identity,
        videoTrack: videoPublication?.track?.mediaStreamTrack,
        audioTrack: audioPublication?.track?.mediaStreamTrack,
        isMuted: audioPublication?.isMuted ?? true,
        isCameraOff: videoPublication?.isMuted ?? true,
        isLocal,
      })
    }

    addTile(room.localParticipant, true)
    room.remoteParticipants.forEach((p) => addTile(p, false))
    setParticipants(tiles)
  }, [])

  // ── 녹음 중지 ───────────────────────────────────────────────────

  const stopRecording = useCallback(() => {
    if (sttIntervalRef.current) clearInterval(sttIntervalRef.current)
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [])

  // ── STT 청크 전송 ───────────────────────────────────────────────

  const sendSttChunk = useCallback(
    async (chunk: Blob) => {
      if (!vconfId) return
      try {
        const res = await meetingApi.transcribe(Number(vconfId), chunk)
        if (res.data.data) {
          setSubtitles((prev) => [...prev.slice(-2), res.data.data!])
        }
      } catch {
        // STT 실패해도 회의 진행에 영향 없음
      }
    },
    [vconfId],
  )

  // ── STT 녹음 시작 ───────────────────────────────────────────────

  const startRecording = useCallback(() => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // 전체 녹취록용 MediaRecorder
        const rcrdgRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        rcrdgRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) rcrdgChunksRef.current.push(e.data)
        }
        rcrdgRecorder.start()
        setIsRecording(true)

        // STT용 5초 청크 MediaRecorder
        const sttRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
        sttRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) sttChunksRef.current.push(e.data)
        }
        mediaRecorderRef.current = sttRecorder
        sttRecorder.start()

        // 5초마다 청크 전송
        sttIntervalRef.current = setInterval(() => {
          if (sttRecorder.state === 'recording') {
            sttRecorder.stop()
            sttRecorder.start()
          }
        }, STT_CHUNK_INTERVAL_MS)

        // STT 청크 전송
        sttRecorder.onstop = () => {
          if (sttChunksRef.current.length === 0) return
          const chunk = new Blob(sttChunksRef.current, { type: 'audio/webm' })
          sttChunksRef.current = []
          void sendSttChunk(chunk)
        }

        // 전체 녹취록 저장용 참조
        ;(window as Window & { _rcrdgRecorder?: MediaRecorder })._rcrdgRecorder =
          rcrdgRecorder
      })
      .catch(() => {
        // 마이크 권한 거부 시 STT/녹취록 없이 진행
      })
  }, [sendSttChunk])

  // ── LiveKit 연결 ────────────────────────────────────────────────

  useEffect(() => {
    if (!token || !roomNm) {
      // 토큰 없이 직접 접근 시 뒤로 이동
      navigate(-1)
      return
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })
    roomRef.current = room

    // 참여자 변경 이벤트
    room.on(RoomEvent.ParticipantConnected, () => updateParticipants(room))
    room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(room))
    room.on(RoomEvent.TrackSubscribed, () => updateParticipants(room))
    room.on(RoomEvent.TrackUnsubscribed, () => updateParticipants(room))
    room.on(RoomEvent.TrackMuted, () => updateParticipants(room))
    room.on(RoomEvent.TrackUnmuted, () => updateParticipants(room))
    room.on(RoomEvent.Disconnected, () => {
      setConnected(false)
      if (!isIntentionalDisconnectRef.current) {
        navigate('/meeting/history')
      }
    })

    // 다른 참여자가 보낸 채팅 메시지 수신
    room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
      if (topic !== 'chat') return
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as { text?: string }
        if (!parsed.text) return
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            senderName: participant?.name ?? participant?.identity ?? '참여자',
            text: parsed.text!,
            isMe: false,
            timestamp: new Date(),
          },
        ])
      } catch {
        // 파싱 실패 무시
      }
    })

    const connect = async () => {
      await room.connect(
        import.meta.env.VITE_LIVEKIT_URL as string,
        token,
      )
      await room.localParticipant.enableCameraAndMicrophone()
      setConnected(true)
      updateParticipants(room)
      startRecording()
    }

    void connect()

    return () => {
      isIntentionalDisconnectRef.current = true
      stopRecording()
      void room.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 비디오 트랙 → <video> 연결 ─────────────────────────────────

  const attachVideo = useCallback(
    (element: HTMLVideoElement | null, track?: MediaStreamTrack) => {
      if (!element || !track) return
      element.srcObject = new MediaStream([track])
    },
    [],
  )

  // ── 회의 종료 ───────────────────────────────────────────────────

  const handleLeave = useCallback(async () => {
    isIntentionalDisconnectRef.current = true
    stopRecording()

    // 전체 녹취록 업로드
    const rcrdgRecorder = (
      window as Window & { _rcrdgRecorder?: MediaRecorder }
    )._rcrdgRecorder

    if (rcrdgRecorder && rcrdgChunksRef.current.length > 0 && vconfId) {
      rcrdgRecorder.stop()
      rcrdgRecorder.onstop = async () => {
        const file = new File(
          rcrdgChunksRef.current,
          `recording-${vconfId}.webm`,
          { type: 'audio/webm' },
        )
        setUploadingRcrdg(true)
        try {
          await meetingApi.uploadRcrdg(Number(vconfId), file)
        } catch {
          // 업로드 실패해도 회의 종료는 진행
        } finally {
          setUploadingRcrdg(false)
        }
      }
    }

    await roomRef.current?.disconnect()
    navigate('/meeting/history')
  }, [navigate, stopRecording, vconfId])

  // ── 마이크 토글 ─────────────────────────────────────────────────

  const toggleMic = useCallback(async () => {
    const local = roomRef.current?.localParticipant
    if (!local) return
    await local.setMicrophoneEnabled(isMuted)
    setIsMuted((prev) => !prev)
  }, [isMuted])

  // ── 카메라 토글 ─────────────────────────────────────────────────

  const toggleCamera = useCallback(async () => {
    const local = roomRef.current?.localParticipant
    if (!local) return
    await local.setCameraEnabled(isCameraOff)
    setIsCameraOff((prev) => !prev)
  }, [isCameraOff])

  // ── 화면 공유 토글 ──────────────────────────────────────────────

  const toggleScreenShare = useCallback(async () => {
    const local = roomRef.current?.localParticipant
    if (!local) return
    await local.setScreenShareEnabled(!isScreenSharing)
    setIsScreenSharing((prev) => !prev)
  }, [isScreenSharing])

  // ── 초대 링크 복사 ─────────────────────────────────────────────

  const handleCopyLink = useCallback(() => {
    const link = `${window.location.origin}/meeting/list?detailMeetingId=${vconfId}`
    void navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }, [vconfId])

  // ── 채팅 메시지 전송 ────────────────────────────────────────────

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!roomRef.current || !trimmed) return
    const local = roomRef.current.localParticipant
    const payload = new TextEncoder().encode(JSON.stringify({ text: trimmed }))
    void local.publishData(payload, { reliable: true, topic: 'chat' })
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderName: local.name ?? local.identity ?? '나',
        text: trimmed,
        isMe: true,
        timestamp: new Date(),
      },
    ])
    setChatInput('')
  }, [])

  // 채팅 새 메시지 시 맨 아래 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── 렌더링 ──────────────────────────────────────────────────────

  if (!connected) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
          <p className="text-sm font-semibold text-slate-400">회의실 연결 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-950 text-white">

      {/* ── 상단 헤더 ── */}
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-3">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-bold text-white">회의 진행 중</span>
          {isRecording && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-bold text-red-400">
              REC
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setInviteOpen((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              inviteOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus size={16} />
            초대
          </button>
          <button
            type="button"
            onClick={() => setParticipantListOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <Users size={16} />
            {participants.length}명
          </button>
          <button
            type="button"
            onClick={() => setChatOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <MessageSquare size={16} />
            채팅
          </button>
        </div>
      </header>

      {/* ── 메인 영역 ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── 비디오 그리드 ── */}
        <div className="flex flex-1 flex-wrap content-start gap-3 overflow-y-auto p-4">
          {participants.map((p) => (
            <div
              key={p.identity}
              className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl bg-slate-800 sm:w-[calc(50%-6px)] xl:w-[calc(33.333%-8px)]"
            >
              {p.videoTrack && !p.isCameraOff ? (
                <video
                  ref={(el) => attachVideo(el, p.videoTrack)}
                  autoPlay
                  playsInline
                  muted={p.isLocal}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-700 text-2xl font-bold text-slate-300">
                    {getInitial(p.name)}
                  </span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-lg bg-slate-950/70 px-2 py-1">
                {p.isMuted ? (
                  <MicOff size={12} className="text-red-400" />
                ) : (
                  <Mic size={12} className="text-green-400" />
                )}
                <span className="text-xs font-semibold text-white">
                  {p.isLocal ? `${p.name} (나)` : p.name}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ── 초대 패널 ── */}
        {inviteOpen && (
          <aside className="flex w-80 flex-col border-l border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 className="text-sm font-bold text-white">팀원 초대</h3>
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
              {/* 초대 링크 복사 */}
              <div className="rounded-xl border border-slate-700 bg-slate-800/60 p-3">
                <p className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                  <Link2 size={13} />
                  초대 링크
                </p>
                <p className="mt-1.5 break-all text-xs font-semibold text-slate-300">
                  {`${window.location.origin}/meeting/list?detailMeetingId=${vconfId}`}
                </p>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className={`mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-xs font-bold transition-colors ${
                    linkCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <Check size={13} />
                      복사됨
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      링크 복사
                    </>
                  )}
                </button>
              </div>

              {/* 팀원 검색 */}
              <div>
                <p className="mb-2 text-xs font-bold text-slate-400">팀원 검색</p>
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 [&_input]:bg-slate-800 [&_input]:text-white [&_input]:placeholder-slate-500 [&_input]:border-slate-700">
                  <EmployeeSearchPicker
                    variant="compact"
                    remoteSearch
                    showAllOnEmpty
                    selectedEmployeeIds={inviteSelectedIds}
                    onChange={setInviteSelectedIds}
                    emptyText="검색된 팀원이 없습니다."
                  />
                </div>
              </div>

              {/* 선택된 팀원이 있으면 안내 문구 */}
              {inviteSelectedIds.length > 0 && (
                <div className="rounded-xl border border-blue-800/60 bg-blue-900/30 px-3 py-3">
                  <p className="text-xs font-bold text-blue-300">
                    {inviteSelectedIds.length}명 선택됨
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-5 text-blue-400">
                    위 링크를 복사해 선택한 팀원에게 공유하세요. 링크를 열면 바로 회의에 입장할 수 있습니다.
                  </p>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-500"
                  >
                    <Copy size={13} />
                    초대 링크 복사
                  </button>
                </div>
              )}
            </div>
          </aside>
        )}

        {/* ── 참여자 목록 패널 ── */}
        {participantListOpen && (
          <aside className="w-64 border-l border-slate-800 bg-slate-900 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">참여자 {participants.length}명</h3>
              <button
                type="button"
                onClick={() => setParticipantListOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              {participants.map((p) => (
                <div key={p.identity} className="flex items-center gap-3 rounded-lg px-2 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-slate-300">
                    {getInitial(p.name)}
                  </span>
                  <span className="text-sm font-semibold text-slate-200">
                    {p.isLocal ? `${p.name} (나)` : p.name}
                  </span>
                  {p.isMuted && <MicOff size={12} className="ml-auto text-red-400" />}
                </div>
              ))}
            </div>
          </aside>
        )}

        {/* ── 채팅 패널 ── */}
        {chatOpen && (
          <aside className="flex w-72 flex-col border-l border-slate-800 bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h3 className="text-sm font-bold text-white">채팅</h3>
              <button
                type="button"
                onClick={() => setChatOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              {chatMessages.length === 0 ? (
                <p className="text-center text-xs font-semibold text-slate-500">
                  아직 채팅 메시지가 없습니다.
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col gap-1 ${msg.isMe ? 'items-end' : 'items-start'}`}
                  >
                    {!msg.isMe && (
                      <span className="text-xs font-bold text-slate-400">{msg.senderName}</span>
                    )}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-sm font-semibold ${
                        msg.isMe
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="border-t border-slate-800 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendChatMessage(chatInput)
                  }}
                  placeholder="메시지 입력..."
                  className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* ── 자막 영역 ── */}
      {subtitles.length > 0 && (
        <div className="border-t border-slate-800 bg-slate-900/80 px-6 py-2">
          {subtitles.map((text, idx) => (
            <p
              key={idx}
              className={`text-sm font-semibold ${
                idx === subtitles.length - 1 ? 'text-white' : 'text-slate-500'
              }`}
            >
              {text}
            </p>
          ))}
        </div>
      )}

      {/* ── 하단 컨트롤바 ── */}
      <footer className="flex items-center justify-center gap-4 border-t border-slate-800 bg-slate-900 px-6 py-4">
        <button
          type="button"
          onClick={() => void toggleMic()}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          type="button"
          onClick={() => void toggleCamera()}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            isCameraOff
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isCameraOff ? <VideoOff size={20} /> : <Video size={20} />}
        </button>

        <button
          type="button"
          onClick={() => void toggleScreenShare()}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition-colors ${
            isScreenSharing
              ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
              : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          <Monitor size={20} />
        </button>

        <button
          type="button"
          onClick={() => void handleLeave()}
          disabled={uploadingRcrdg}
          className="flex h-12 w-28 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          <PhoneOff size={18} />
          {uploadingRcrdg ? '저장 중...' : '나가기'}
        </button>
      </footer>
    </div>
  )
}

const getInitial = (name: string) => name.trim().charAt(0) || '?'

export default MeetingRoomPage