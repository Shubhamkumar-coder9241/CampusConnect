import { useRef, useState } from 'react'
import {
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useParticipants,
  useTracks,
} from '@livekit/components-react'
import { Camera, CameraOff, LoaderCircle, Mic, MicOff, MonitorUp, PhoneOff, Video } from 'lucide-react'
import { Track, TokenSource } from 'livekit-client'
import { Button } from '../../components/ui.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import '@livekit/components-styles'

const tokenServerId = import.meta.env.VITE_LIVEKIT_TOKEN_SERVER_ID

function ParticipantGrid() {
  const participants = useParticipants()
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ])

  if (!participants.length) {
    return <div className="flex min-h-[220px] items-center justify-center rounded-xl border border-dashed border-[#dfe7df] bg-[#f7f9f6] p-5 text-center text-xs text-[#7f8a80]">Waiting for participants to join...</div>
  }

  return <div className="min-h-[220px] overflow-hidden rounded-xl bg-[#18231d]">
    <GridLayout tracks={tracks} className="min-h-[220px] gap-2 p-2">
      <ParticipantTile />
    </GridLayout>
  </div>
}

function RoomControls({ onLeave, onMediaError }) {
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled, isScreenShareEnabled } = useLocalParticipant()
  const participants = useParticipants()
  async function toggleMedia(toggle) {
    try {
      await toggle()
    } catch (error) {
      onMediaError(error)
    }
  }

  return <>
    <RoomAudioRenderer />
    <div className="mb-3 flex items-center justify-between gap-3 text-xs text-[#748077]">
      <span>{participants.length} {participants.length === 1 ? 'participant' : 'participants'} connected</span>
      <span className="inline-flex items-center gap-1.5 text-[#438056]"><span className="h-1.5 w-1.5 rounded-full bg-[#61a46b]" />Connected</span>
    </div>
    <ParticipantGrid />
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <Button size="sm" variant={isMicrophoneEnabled ? 'soft' : 'outline'} aria-label={isMicrophoneEnabled ? 'Turn microphone off' : 'Turn microphone on'} onClick={() => toggleMedia(() => localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled))}>
        {isMicrophoneEnabled ? <Mic size={15} /> : <MicOff size={15} />}{isMicrophoneEnabled ? 'Mic on' : 'Mic off'}
      </Button>
      <Button size="sm" variant={isCameraEnabled ? 'soft' : 'outline'} aria-label={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'} onClick={() => toggleMedia(() => localParticipant.setCameraEnabled(!isCameraEnabled))}>
        {isCameraEnabled ? <Camera size={15} /> : <CameraOff size={15} />}{isCameraEnabled ? 'Camera on' : 'Camera off'}
      </Button>
      <Button size="sm" variant={isScreenShareEnabled ? 'soft' : 'outline'} aria-label={isScreenShareEnabled ? 'Stop screen sharing' : 'Share screen'} onClick={() => toggleMedia(() => localParticipant.setScreenShareEnabled(!isScreenShareEnabled))}>
        <MonitorUp size={15} />{isScreenShareEnabled ? 'Stop sharing' : 'Share screen'}
      </Button>
      <Button size="sm" variant="danger" className="ml-auto" onClick={onLeave}>
        <PhoneOff size={15} />Leave room
      </Button>
    </div>
  </>
}

export default function StudyPodVideoRoom({ podId, isMember, profile, authUser }) {
  const [credentials, setCredentials] = useState(null)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState('')
  const intentionalLeaveRef = useRef(false)

  async function joinRoom() {
    if (connecting || credentials) return
    setConnecting(true)
    setError('')
    try {
      if (!tokenServerId) throw new Error('Add VITE_LIVEKIT_TOKEN_SERVER_ID to your local environment to enable the video room.')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) throw authError
      if (!user || !authUser?.id || user.id !== authUser.id) throw new Error('Please sign in again to join the video room.')
      const { data: membership, error: membershipError } = await supabase
        .from('study_pod_members')
        .select('pod_id')
        .eq('pod_id', podId)
        .eq('user_id', user.id)
        .maybeSingle()
      if (membershipError) throw membershipError
      if (!membership) throw new Error('Only members of this Study Pod can enter its video room. Join the pod first.')
      if (!isMember) throw new Error('Your membership is not active in this session. Reopen the pod and try again.')

      const participantName = profile?.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pod member'
      const roomName = `campussetu-pod-${podId}`
      const tokenSource = TokenSource.developmentTokenServer(tokenServerId)
      const response = await tokenSource.fetch({
        roomName,
        participantIdentity: user.id,
        participantName,
      })
      if (!response.serverUrl || !response.participantToken) throw new Error('LiveKit did not return room credentials.')
      intentionalLeaveRef.current = false
      setCredentials({ serverUrl: response.serverUrl, token: response.participantToken, roomName })
    } catch (joinError) {
      if (import.meta.env.DEV) console.error('Unable to join Study Pod video room:', joinError)
      setError(joinError.message || 'Unable to join the video room. Please try again.')
    } finally {
      setConnecting(false)
    }
  }

  function leaveRoom() {
    intentionalLeaveRef.current = true
    setConnected(false)
    setCredentials(null)
  }

  function handleMediaError(mediaError, kind) {
    if (import.meta.env.DEV) console.error('LiveKit media device error:', { kind, error: mediaError })
    setError(kind ? `${kind} permission or device error. Check your browser permissions and try again.` : mediaError.message || 'A camera or microphone error occurred.')
  }

  return <div className="space-y-3">
    {!credentials ? <>
      <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe7df] bg-[#f7f9f6] p-5 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#4b7955]"><Video size={20} /></span>
        <p className="mt-3 text-sm font-bold text-[#46574a]">{isMember ? 'Join the live room' : 'Pod membership required'}</p>
        <p className="mt-1 max-w-sm text-xs leading-5 text-[#849185]">{isMember ? 'Connect with pod members using live audio and video.' : 'Join this Study Pod before entering its live room.'}</p>
        {isMember && <Button className="mt-4" onClick={joinRoom} disabled={connecting}>{connecting ? <><LoaderCircle size={15} className="animate-spin" />Connecting...</> : <><Video size={15} />Join video/audio room</>}</Button>}
      </div>
      {error && <p role="alert" className="rounded-xl border border-[#f0d9d6] bg-[#fff7f6] p-3 text-xs text-[#9f5148]">{error}</p>}
    </> : <LiveKitRoom
      key={credentials.roomName}
      serverUrl={credentials.serverUrl}
      token={credentials.token}
      connect
      audio={false}
      video={false}
      onConnected={() => { setConnected(true); setError('') }}
      onDisconnected={() => {
        setConnected(false)
        setCredentials(null)
        if (!intentionalLeaveRef.current) setError('The video room disconnected. Rejoin to continue.')
      }}
      onError={(connectionError) => {
        if (import.meta.env.DEV) console.error('LiveKit room connection error:', connectionError)
        intentionalLeaveRef.current = true
        setConnected(false)
        setCredentials(null)
        setError(connectionError.message || 'Unable to connect to the video room.')
      }}
      onMediaDeviceFailure={(failure, kind) => handleMediaError(failure || new Error('Media device unavailable.'), kind)}
      className="space-y-3"
    >
      {!connected && <p className="flex items-center gap-2 text-xs font-semibold text-[#397950]"><LoaderCircle size={15} className="animate-spin" />Connecting to LiveKit...</p>}
      <RoomControls onLeave={leaveRoom} onMediaError={handleMediaError} />
      {error && <p role="alert" className="rounded-xl border border-[#f0d9d6] bg-[#fff7f6] p-3 text-xs text-[#9f5148]">{error}</p>}
    </LiveKitRoom>}
  </div>
}