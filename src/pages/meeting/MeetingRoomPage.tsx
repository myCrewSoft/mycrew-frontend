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
  DisconnectReason,
} from 'livekit-client'
import { ApiError } from '../../api/axiosInstance'
import { meetingApi } from '../../api/meetingApi'
import ProfileAvatar from '../../components/common/avatar/ProfileAvatar'
import EmployeeSearchPicker from '../../components/common/employeeSearch/EmployeeSearchPicker'

// ── 타입 ──────────────────────────────────────────────────────────

interface ChatMessage {
  id: number
  senderName: string
  senderDepartment?: string
  senderJobGrade?: string
  senderProfileImageId?: number | null
  text: string
  isMe: boolean
  timestamp: Date
}

interface ParticipantProfile {
  empId?: number
  name: string
  department?: string
  jobGrade?: string
  profileImageId?: number | null
}

interface ParticipantTile {
  identity: string
  name: string
  department?: string
  jobGrade?: string
  profileImageId?: number | null
  videoTrack?: MediaStreamTrack
  audioTrack?: MediaStreamTrack
  isMuted: boolean
  isCameraOff: boolean
  isLocal: boolean
}

// ── 상수 ──────────────────────────────────────────────────────────

const STT_CHUNK_INTERVAL_MS = 5000
const STT_SPEECH_RMS_THRESHOLD = 0.025
const STT_SPEECH_CHECK_INTERVAL_MS = 200
const DEFAULT_LIVEKIT_URL = `${
  window.location.protocol === 'https:' ? 'wss' : 'ws'
}://${window.location.hostname}:7880`

const getVideoGridClass = (participantCount: number) => {
  const base =
    'grid h-full min-h-0 flex-1 auto-rows-fr gap-3 overflow-y-auto p-3'

  if (participantCount <= 1) return `${base} grid-cols-1`
  if (participantCount <= 2) return `${base} grid-cols-1 lg:grid-cols-2`
  if (participantCount <= 4) return `${base} grid-cols-1 sm:grid-cols-2`
  if (participantCount <= 6) return `${base} grid-cols-1 sm:grid-cols-2 xl:grid-cols-3`
  return `${base} grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`
}

// ── 컴포넌트 ──────────────────────────────────────────────────────

const MeetingRoomPage = () => {
  const { vconfId } = useParams<{ vconfId: string }>()
  const location = useLocation()
  const navigate = useNavigate()

  // navigate state로 전달받은 토큰과 방 이름
  const { token, roomNm, mtngId, canEnd } = (location.state ?? {}) as {
    token?: string
    roomNm?: string
    mtngId?: number
    canEnd?: boolean
  }

  const roomRef = useRef<Room | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingRecorderRef = useRef<MediaRecorder | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const mixerContextRef = useRef<AudioContext | null>(null)
  const mixerDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null)
  const trackSourcesRef = useRef<Map<string, MediaStreamAudioSourceNode>>(new Map())
  const localMicStreamRef = useRef<MediaStream | null>(null)
  const sttChunksRef = useRef<Blob[]>([])
  const rcrdgChunksRef = useRef<Blob[]>([])
  const sttIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechDetectionIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const speechDetectedInChunkRef = useRef(false)
  const participantProfileMapRef = useRef<Map<string, ParticipantProfile>>(
    new Map(),
  )
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
  const [connectionError, setConnectionError] = useState('')
  const [connectionAttempt, setConnectionAttempt] = useState(0)
  const [canEndMeeting, setCanEndMeeting] = useState(canEnd ?? false)
  const canEndMeetingRef = useRef(canEnd ?? false)
  const [endingMeeting, setEndingMeeting] = useState(false)
  const [speakingIdentities, setSpeakingIdentities] = useState<Set<string>>(new Set())

  // ── 참여자 타일 업데이트 ────────────────────────────────────────

  const getParticipantProfile = useCallback((participant: Participant) => {
    const mappedProfile = participantProfileMapRef.current.get(
      participant.identity,
    )
    let metadataProfile: Partial<ParticipantProfile> = {}
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata) as {
          empId?: number | string
          empNm?: string
          name?: string
          deptNm?: string
          jobGrdNm?: string
          prflImgFileId?: number | string | null
        }
        const parsedProfileImageId = Number(metadata.prflImgFileId)
        metadataProfile = {
          empId:
            metadata.empId === undefined ? undefined : Number(metadata.empId),
          name: metadata.empNm?.trim() || metadata.name?.trim(),
          department: metadata.deptNm?.trim() || undefined,
          jobGrade: metadata.jobGrdNm?.trim() || undefined,
          profileImageId: Number.isFinite(parsedProfileImageId)
            ? parsedProfileImageId
            : null,
        }
      } catch {
        // LiveKit metadata가 JSON이 아니면 identity를 대체값으로 사용합니다.
      }
    }

    return {
      empId: metadataProfile.empId ?? mappedProfile?.empId,
      name:
        (participant.name !== participant.identity
          ? participant.name?.trim()
          : undefined) ||
        metadataProfile.name ||
        mappedProfile?.name ||
        participant.identity,
      department:
        metadataProfile.department ?? mappedProfile?.department,
      jobGrade: metadataProfile.jobGrade ?? mappedProfile?.jobGrade,
      profileImageId:
        metadataProfile.profileImageId ?? mappedProfile?.profileImageId ?? null,
    } satisfies ParticipantProfile
  }, [])

  const updateParticipants = useCallback((room: Room) => {
    const tiles: ParticipantTile[] = []

    const addTile = (participant: Participant, isLocal: boolean) => {
      const videoPublication = participant.getTrackPublication(Track.Source.Camera)
      const audioPublication = participant.getTrackPublication(Track.Source.Microphone)
      const profile = getParticipantProfile(participant)

      tiles.push({
        identity: participant.identity,
        name: profile.name,
        department: profile.department,
        jobGrade: profile.jobGrade,
        profileImageId: profile.profileImageId,
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
  }, [getParticipantProfile])

  useEffect(() => {
    if (!mtngId) return

    let disposed = false
    void meetingApi
      .getMeeting(mtngId)
      .then((response) => {
        if (disposed) return

        const meeting = response.data.data
        const canEnd = meeting?.canEnd ?? false
        setCanEndMeeting(canEnd)
        canEndMeetingRef.current = canEnd
        participantProfileMapRef.current = new Map(
          (meeting?.ptcptList ?? []).map((participant) => [
            String(participant.empId),
            {
              empId: participant.empId,
              name: participant.empNm,
              department: participant.deptNm,
              jobGrade: participant.jobGrdNm,
              profileImageId: participant.prflImgFileId,
            },
          ]),
        )

        if (roomRef.current) updateParticipants(roomRef.current)
      })
      .catch(() => {
        if (!disposed) setCanEndMeeting(false)
      })

    return () => {
      disposed = true
    }
  }, [mtngId, updateParticipants])

  // ── 녹음 중지 ───────────────────────────────────────────────────

  const stopSpeechDetection = useCallback(() => {
    if (speechDetectionIntervalRef.current) {
      clearInterval(speechDetectionIntervalRef.current)
      speechDetectionIntervalRef.current = null
    }
    void audioContextRef.current?.close()
    audioContextRef.current = null
    speechDetectedInChunkRef.current = false
  }, [])

  const stopRecording = useCallback(() => {
    if (sttIntervalRef.current) clearInterval(sttIntervalRef.current)
    sttIntervalRef.current = null
    stopSpeechDetection()
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setIsRecording(false)
  }, [stopSpeechDetection])

  const discardFullRecording = useCallback(() => {
    const recorder = recordingRecorderRef.current
    if (!recorder) return

    if (recorder.state === 'recording') recorder.stop()
    recordingRecorderRef.current = null
    rcrdgChunksRef.current = []
    localMicStreamRef.current?.getTracks().forEach((track) => track.stop())
    localMicStreamRef.current = null
    trackSourcesRef.current.clear()
    void mixerContextRef.current?.close()
    mixerContextRef.current = null
    mixerDestinationRef.current = null
    stopSpeechDetection()
  }, [stopSpeechDetection])

  const uploadFullRecording = useCallback(async () => {
    const recorder = recordingRecorderRef.current
    if (!recorder || !vconfId) return

    setUploadingRcrdg(true)
    try {
      const recordingBlob =
        recorder.state === 'inactive'
          ? new Blob(rcrdgChunksRef.current, { type: 'audio/webm' })
          : await new Promise<Blob>((resolve, reject) => {
              recorder.addEventListener(
                'stop',
                () => {
                  resolve(
                    new Blob(rcrdgChunksRef.current, {
                      type: 'audio/webm',
                    }),
                  )
                },
                { once: true },
              )
              recorder.addEventListener(
                'error',
                () => reject(new Error('녹취 파일 생성에 실패했습니다.')),
                { once: true },
              )
              recorder.stop()
            })

      if (recordingBlob.size === 0) return

      const file = new File(
        [recordingBlob],
        `recording-${vconfId}.webm`,
        { type: 'audio/webm' },
      )
      await meetingApi.uploadRcrdg(Number(vconfId), file)
    } finally {
      recordingRecorderRef.current = null
      rcrdgChunksRef.current = []
      localMicStreamRef.current?.getTracks().forEach((track) => track.stop())
      localMicStreamRef.current = null
      trackSourcesRef.current.clear()
      void mixerContextRef.current?.close()
      mixerContextRef.current = null
      mixerDestinationRef.current = null
      stopSpeechDetection()
      setUploadingRcrdg(false)
    }
  }, [stopSpeechDetection, vconfId])

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

  const startSpeechDetection = useCallback((stream: MediaStream) => {
    stopSpeechDetection()

    const AudioContextConstructor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext

    if (!AudioContextConstructor) return

    try {
      const audioContext = new AudioContextConstructor()
      const analyser = audioContext.createAnalyser()
      const source = audioContext.createMediaStreamSource(stream)

      analyser.fftSize = 1024
      const samples = new Uint8Array(analyser.fftSize)
      source.connect(analyser)
      audioContextRef.current = audioContext
      speechDetectedInChunkRef.current = false

      speechDetectionIntervalRef.current = setInterval(() => {
        analyser.getByteTimeDomainData(samples)

        const sum = samples.reduce((total, sample) => {
          const normalized = (sample - 128) / 128
          return total + normalized * normalized
        }, 0)
        const rms = Math.sqrt(sum / samples.length)

        if (rms >= STT_SPEECH_RMS_THRESHOLD) {
          speechDetectedInChunkRef.current = true
        }
      }, STT_SPEECH_CHECK_INTERVAL_MS)
    } catch {
      speechDetectedInChunkRef.current = true
    }
  }, [stopSpeechDetection])

  const startRecording = useCallback(() => {
    const room = roomRef.current
    if (!room) return

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((localStream) => {
        localMicStreamRef.current = localStream
        startSpeechDetection(localStream)

        const AudioContextConstructor =
          window.AudioContext ||
          (window as typeof window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext

        if (!AudioContextConstructor) return

        // 전체 참여자 오디오 믹서 생성
        const mixerContext = new AudioContextConstructor()
        const destination = mixerContext.createMediaStreamDestination()
        mixerContextRef.current = mixerContext
        mixerDestinationRef.current = destination
        trackSourcesRef.current = new Map()

        // 내 마이크를 믹서에 연결
        const localSource = mixerContext.createMediaStreamSource(localStream)
        localSource.connect(destination)

        // 이미 구독 중인 원격 참여자 오디오 트랙을 믹서에 연결
        room.remoteParticipants.forEach((participant) => {
          const audioPublication = participant.getTrackPublication(Track.Source.Microphone)
          const mediaStreamTrack = audioPublication?.track?.mediaStreamTrack
          if (mediaStreamTrack) {
            const source = mixerContext.createMediaStreamSource(new MediaStream([mediaStreamTrack]))
            source.connect(destination)
            trackSourcesRef.current.set(`${participant.identity}:${mediaStreamTrack.id}`, source)
          }
        })

        // 믹싱된 스트림으로 전체 녹취록용 MediaRecorder
        const rcrdgRecorder = new MediaRecorder(destination.stream, { mimeType: 'audio/webm' })
        rcrdgRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) rcrdgChunksRef.current.push(e.data)
        }
        recordingRecorderRef.current = rcrdgRecorder
        rcrdgRecorder.start()
        setIsRecording(true)

        // STT용 5초 청크 MediaRecorder (내 마이크 스트림만 사용)
        const sttRecorder = new MediaRecorder(localStream, { mimeType: 'audio/webm' })
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
          const hasSpeech = speechDetectedInChunkRef.current
          sttChunksRef.current = []
          speechDetectedInChunkRef.current = false

          if (hasSpeech) {
            void sendSttChunk(chunk)
          }
        }
      })
      .catch(() => {
        // 마이크 권한 거부 시 STT/녹취록 없이 진행
      })
  }, [sendSttChunk, startSpeechDetection])

  // ── LiveKit 연결 ────────────────────────────────────────────────

  useEffect(() => {
    if (!token) {
      // 토큰 없이 직접 접근 시 뒤로 이동
      navigate(-1)
      return
    }

    let disposed = false
    isIntentionalDisconnectRef.current = false

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    })
    roomRef.current = room

    // 참여자 변경 이벤트
    room.on(RoomEvent.ParticipantConnected, () => updateParticipants(room))
    room.on(RoomEvent.ParticipantDisconnected, () => updateParticipants(room))
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      updateParticipants(room)
      // 녹음 중이면 새로 구독된 마이크 트랙을 믹서에 연결합니다.
      if (
        publication.source === Track.Source.Microphone &&
        mixerContextRef.current &&
        mixerDestinationRef.current
      ) {
        const mediaStreamTrack = track.mediaStreamTrack
        if (mediaStreamTrack) {
          const source = mixerContextRef.current.createMediaStreamSource(
            new MediaStream([mediaStreamTrack]),
          )
          source.connect(mixerDestinationRef.current)
          trackSourcesRef.current.set(`${participant.identity}:${mediaStreamTrack.id}`, source)
        }
      }
    })
    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      updateParticipants(room)
      // 구독 해제된 마이크 트랙을 믹서에서 분리합니다.
      if (publication.source === Track.Source.Microphone) {
        const key = `${participant.identity}:${track.mediaStreamTrack?.id}`
        const source = trackSourcesRef.current.get(key)
        if (source) {
          source.disconnect()
          trackSourcesRef.current.delete(key)
        }
      }
    })
    room.on(RoomEvent.TrackMuted, () => updateParticipants(room))
    room.on(RoomEvent.TrackUnmuted, () => updateParticipants(room))
    room.on(RoomEvent.ParticipantMetadataChanged, () =>
      updateParticipants(room),
    )
    room.on(RoomEvent.Disconnected, (reason) => {
      // StrictMode cleanup으로 폐기된 이전 Room 이벤트는 현재 화면에 영향을 주면 안 됩니다.
      if (disposed || roomRef.current !== room) return

      setConnected(false)
      if (!isIntentionalDisconnectRef.current) {
        if (
          reason === DisconnectReason.ROOM_DELETED ||
          reason === DisconnectReason.PARTICIPANT_REMOVED
        ) {
          // 방이 삭제됐을 때: 주최자는 녹취록을 업로드하고, 나머지는 바로 이동합니다.
          stopRecording()
          if (canEndMeetingRef.current) {
            uploadFullRecording()
              .catch(() => {})
              .finally(() => { navigate('/meeting/history') })
          } else {
            discardFullRecording()
            navigate('/meeting/history')
          }
        } else {
          setConnectionError('LiveKit 서버와의 연결이 종료되었습니다.')
        }
      }
    })

    room.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
      if (disposed || roomRef.current !== room) return
      setSpeakingIdentities(new Set(speakers.map((s) => s.identity)))
    })

    // 다른 참여자가 보낸 채팅 메시지 수신
    room.on(RoomEvent.DataReceived, (payload, participant, _kind, topic) => {
      if (topic !== 'chat') return
      try {
        const parsed = JSON.parse(new TextDecoder().decode(payload)) as { text?: string }
        if (!parsed.text) return
        const senderProfile = participant
          ? getParticipantProfile(participant)
          : null
        setChatMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            senderName: senderProfile?.name ?? '참여자',
            senderDepartment: senderProfile?.department,
            senderJobGrade: senderProfile?.jobGrade,
            senderProfileImageId: senderProfile?.profileImageId,
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
      const liveKitUrl =
        import.meta.env.VITE_LIVEKIT_URL?.trim() || DEFAULT_LIVEKIT_URL

      try {
        await room.connect(liveKitUrl, token)
        if (disposed || roomRef.current !== room) {
          await room.disconnect()
          return
        }

        setConnected(true)
        updateParticipants(room)

        try {
          await room.localParticipant.enableCameraAndMicrophone()
          if (disposed || roomRef.current !== room) return

          updateParticipants(room)
          startRecording()
        } catch {
          if (disposed || roomRef.current !== room) return

          // 카메라·마이크 권한이 없어도 텍스트 채팅과 화면 공유로 회의에 참여할 수 있습니다.
          setIsMuted(true)
          setIsCameraOff(true)
        }
      } catch (error) {
        if (disposed || roomRef.current !== room) return

        setConnected(false)
        setConnectionError(
          error instanceof Error
            ? error.message
            : 'LiveKit 회의실에 연결하지 못했습니다.',
        )
      }
    }

    void connect()

    return () => {
      disposed = true
      if (roomRef.current === room) {
        roomRef.current = null
      }
      stopRecording()
      discardFullRecording()
      setSpeakingIdentities(new Set())
      void room.disconnect()
    }
  }, [
    connectionAttempt,
    discardFullRecording,
    navigate,
    startRecording,
    stopRecording,
    token,
    getParticipantProfile,
    updateParticipants,
  ])

  // ── 비디오 트랙 → <video> 연결 ─────────────────────────────────

  const attachVideo = useCallback(
    (element: HTMLVideoElement | null, track?: MediaStreamTrack) => {
      if (!element || !track) return
      element.srcObject = new MediaStream([track])
    },
    [],
  )

  // ── 회의 종료 ───────────────────────────────────────────────────

  const disconnectAndNavigate = useCallback(async () => {
    isIntentionalDisconnectRef.current = true
    stopRecording()

    // 회의 주최자만 전체 참여자 오디오가 믹싱된 녹취록을 업로드합니다.
    if (canEndMeeting) {
      try {
        await uploadFullRecording()
      } catch {
        // 녹취 업로드 실패가 사용자의 방 나가기를 막지는 않도록 합니다.
      }
    } else {
      discardFullRecording()
    }

    await roomRef.current?.disconnect()
    navigate('/meeting/history')
  }, [canEndMeeting, discardFullRecording, navigate, stopRecording, uploadFullRecording])

  const handleLeave = useCallback(async () => {
    if (vconfId) {
      try {
        await meetingApi.leaveConf(Number(vconfId))
      } catch {
        // 퇴장 기록 실패가 사용자의 방 나가기를 막지는 않도록 합니다.
      }
    }

    await disconnectAndNavigate()
  }, [disconnectAndNavigate, vconfId])

  const handleEndMeeting = useCallback(async () => {
    if (!vconfId) return
    if (!window.confirm('모든 참여자의 회의를 종료하시겠습니까?')) return

    setEndingMeeting(true)
    try {
      await meetingApi.endConf(Number(vconfId))
      await disconnectAndNavigate()
    } catch (error) {
      const message =
        error instanceof ApiError
          ? `${error.message} (${error.errorCode})`
          : error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.'
      window.alert(`회의를 종료하지 못했습니다.\n${message}`)
      setEndingMeeting(false)
    }
  }, [disconnectAndNavigate, vconfId])

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
    const link = `${window.location.origin}/meeting/list?detailMeetingId=${mtngId ?? ''}`
    void navigator.clipboard.writeText(link).then(() => {
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    })
  }, [mtngId])

  // ── 채팅 메시지 전송 ────────────────────────────────────────────

  const sendChatMessage = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!roomRef.current || !trimmed) return
    const local = roomRef.current.localParticipant
    const senderProfile = getParticipantProfile(local)
    const payload = new TextEncoder().encode(JSON.stringify({ text: trimmed }))
    void local.publishData(payload, { reliable: true, topic: 'chat' })
    setChatMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        senderName: senderProfile.name,
        senderDepartment: senderProfile.department,
        senderJobGrade: senderProfile.jobGrade,
        senderProfileImageId: senderProfile.profileImageId,
        text: trimmed,
        isMe: true,
        timestamp: new Date(),
      },
    ])
    setChatInput('')
  }, [getParticipantProfile])

  // 채팅 새 메시지 시 맨 아래 스크롤
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ── 렌더링 ──────────────────────────────────────────────────────

  const localIdentity = participants.find((p) => p.isLocal)?.identity
  const isLocalSpeaking = !!localIdentity && speakingIdentities.has(localIdentity) && !isMuted

  if (!connected) {
    return (
      <div className="flex h-dvh items-center justify-center bg-slate-950">
        <div className="text-center">
          {connectionError ? (
            <>
              <p className="text-base font-bold text-white">
                회의실에 연결하지 못했습니다.
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm font-semibold text-slate-400">
                {connectionError}
              </p>
              <p className="mt-2 text-xs text-slate-500">
                LiveKit 주소: {import.meta.env.VITE_LIVEKIT_URL || DEFAULT_LIVEKIT_URL}
              </p>
              <div className="mt-5 flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setConnectionError('')
                    setConnectionAttempt((current) => current + 1)
                  }}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-500"
                >
                  다시 연결
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/meeting/list')}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800"
                >
                  회의 목록
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-600 border-t-blue-500" />
              <p className="text-sm font-semibold text-slate-400">
                {roomNm ? `${roomNm} 연결 중...` : '회의실 연결 중...'}
              </p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-dvh min-h-0 flex-col overflow-hidden bg-slate-950 text-white">

      {/* ── 상단 헤더 ── */}
      <header className="flex shrink-0 items-center justify-between border-b border-slate-800 px-4 py-2">
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
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors ${
              inviteOpen ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserPlus size={16} />
            초대
          </button>
          <button
            type="button"
            onClick={() => setParticipantListOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <Users size={16} />
            {participants.length}명
          </button>
          <button
            type="button"
            onClick={() => setChatOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
          >
            <MessageSquare size={16} />
            채팅
          </button>
        </div>
      </header>

      {/* ── 메인 영역 ── */}
      <div className="flex min-h-0 flex-1 overflow-hidden">

        {/* ── 비디오 그리드 ── */}
        <div className={getVideoGridClass(participants.length)}>
          {participants.map((p) => (
            <div
              key={p.identity}
              className={`relative min-h-0 overflow-hidden rounded-lg bg-slate-800 transition-all duration-150 ${
                speakingIdentities.has(p.identity) && !p.isMuted
                  ? 'ring-2 ring-green-400 shadow-[0_0_8px_rgba(74,222,128,0.4)]'
                  : 'ring-2 ring-transparent'
              }`}
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
                  <ProfileAvatar
                    fileId={p.profileImageId}
                    name={p.name}
                    size={64}
                    className="ring-2 ring-slate-600"
                  />
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex items-center gap-2 rounded-lg bg-slate-950/75 px-2.5 py-1.5">
                {p.isMuted ? (
                  <MicOff size={12} className="text-red-400" />
                ) : speakingIdentities.has(p.identity) ? (
                  <Mic size={12} className="animate-pulse text-green-400" />
                ) : (
                  <Mic size={12} className="text-slate-400" />
                )}
                <span>
                  <span className="block text-xs font-semibold text-white">
                    {p.isLocal ? `${p.name} (나)` : p.name}
                  </span>
                  {(p.department || p.jobGrade) && (
                    <span className="block text-[10px] font-semibold text-slate-300">
                      {[p.department, p.jobGrade].filter(Boolean).join(' · ')}
                    </span>
                  )}
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
                  {`${window.location.origin}/meeting/list?detailMeetingId=${mtngId ?? ''}`}
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
                  <ProfileAvatar
                    fileId={p.profileImageId}
                    name={p.name}
                    size={32}
                    className="ring-1 ring-slate-600"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-200">
                      {p.isLocal ? `${p.name} (나)` : p.name}
                    </span>
                    {(p.department || p.jobGrade) && (
                      <span className="block truncate text-xs font-semibold text-slate-500">
                        {[p.department, p.jobGrade].filter(Boolean).join(' · ')}
                      </span>
                    )}
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
                    <div
                      className={`flex items-center gap-2 ${
                        msg.isMe ? 'flex-row-reverse' : ''
                      }`}
                    >
                      <ProfileAvatar
                        fileId={msg.senderProfileImageId}
                        name={msg.senderName}
                        size={24}
                        className="ring-1 ring-slate-600"
                      />
                      <span
                        className={`text-xs ${
                          msg.isMe ? 'text-right' : 'text-left'
                        }`}
                      >
                        <span className="block font-bold text-slate-300">
                          {msg.isMe ? `${msg.senderName} (나)` : msg.senderName}
                        </span>
                        {(msg.senderDepartment || msg.senderJobGrade) && (
                          <span className="block font-semibold text-slate-500">
                            {[msg.senderDepartment, msg.senderJobGrade]
                              .filter(Boolean)
                              .join(' · ')}
                          </span>
                        )}
                      </span>
                    </div>
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
        <div className="shrink-0 border-t border-slate-800 bg-slate-900/80 px-4 py-1.5">
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
      <footer className="flex shrink-0 items-center justify-center gap-3 border-t border-slate-800 bg-slate-900 px-4 py-2.5">
        <button
          type="button"
          onClick={() => void toggleMic()}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-150 ${
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : isLocalSpeaking
                ? 'bg-green-500/20 text-green-400 ring-2 ring-green-400 ring-offset-1 ring-offset-slate-900 hover:bg-green-500/30'
                : 'bg-slate-700 text-white hover:bg-slate-600'
          }`}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        <button
          type="button"
          onClick={() => void toggleCamera()}
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
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
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
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
          disabled={uploadingRcrdg || endingMeeting}
          className="flex h-10 w-24 items-center justify-center gap-2 rounded-full bg-red-600 text-sm font-bold text-white transition-colors hover:bg-red-700 disabled:opacity-60"
        >
          <PhoneOff size={18} />
          {uploadingRcrdg ? '저장 중...' : '나가기'}
        </button>

        {canEndMeeting && (
          <button
            type="button"
            title="모든 참여자의 회의를 종료합니다."
            onClick={() => void handleEndMeeting()}
            disabled={uploadingRcrdg || endingMeeting}
            className="flex h-10 w-28 items-center justify-center gap-2 rounded-full border border-red-500 bg-red-950 text-sm font-bold text-red-300 transition-colors hover:bg-red-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <PhoneOff size={18} />
            {endingMeeting ? '종료 중...' : '회의 종료'}
          </button>
        )}
      </footer>
    </div>
  )
}

export default MeetingRoomPage
