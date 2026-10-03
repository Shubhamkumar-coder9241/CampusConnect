import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useOutletContext,
  useParams,
} from "react-router-dom";
import {
  ArrowLeft,
  Check,
  Flag,
  Headphones,
  LoaderCircle,
  Mic,
  MicOff,
  MonitorUp,
  Users,
  Video as VideoIcon,
  VideoOff,
  Wifi,
} from "lucide-react";
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  SectionHeading,
} from "../../components/ui.jsx";
import FocusTimer from "./FocusTimer.jsx";
import GoalChecklist from "./GoalChecklist.jsx";
import PodChat from "./PodChat.jsx";
import SessionSummary from "./SessionSummary.jsx";
import { supabase } from "../../lib/supabaseClient.js";

const goals = [
  "Revise array operations",
  "Solve 2 easy problems",
  "Solve 2 medium problems",
  "Discuss one difficult problem",
  "Write final notes",
];
export default function PodRoom() {
  const { podId } = useParams();
  const navigate = useNavigate();
  const {
    updateRoadmapFromSession,
    setToast,
    podList,
    podLoading,
    podError,
    authUser,
    profile,
    joinStudyPod,
    leaveStudyPod,
  } = useOutletContext();
  const pod = podList.find((item) => item.id === podId);
  const [membershipOverride, setMembershipOverrideState] = useState(null);
  const [membershipBusy, setMembershipBusy] = useState(false);
  const joined =
    membershipOverride?.podId === pod?.id
      ? membershipOverride.joined
      : Boolean(pod?.isMember);
  async function setMembershipOverride(nextMembership) {
    if (membershipBusy || !pod) return;
    setMembershipBusy(true);
    setMembershipOverrideState(nextMembership);
    try {
      if (nextMembership.joined) await joinStudyPod(pod.id);
      else await leaveStudyPod(pod.id);
    } catch (error) {
      setMembershipOverrideState(null);
      if (import.meta.env.DEV)
        console.error("Unable to update pod membership:", error);
      setToast({
        type: "error",
        message: "We could not update your pod membership. Please try again.",
      });
    } finally {
      setMembershipBusy(false);
    }
  }
  const [checked, setChecked] = useState([0]);
  const [chatState, setChatState] = useState({ podId: null, messages: [] });
  const [chatLoadState, setChatLoadState] = useState({ podId: null, loading: true });
  const [chatSending, setChatSending] = useState(false);
  const [chatErrorState, setChatErrorState] = useState({ podId: null, message: "" });
  const messageIdsByPodRef = useRef(new Map());
  const appendChatRowsRef = useRef(null);
  const chatSendingRef = useRef(false);
  const messages = chatState.podId === podId ? chatState.messages : [];
  const chatLoading = chatLoadState.podId !== podId || chatLoadState.loading;
  const chatError = chatErrorState.podId === podId ? chatErrorState.message : "";
  const podAvailable = Boolean(pod);
  const [camera, setCamera] = useState(false);
  const [microphone, setMicrophone] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [summary, setSummary] = useState(false);
  const [finished, setFinished] = useState(false);
  const [minutesStudied, setMinutesStudied] = useState(0);
  const onTimerComplete = useCallback(() => {
    setMinutesStudied(pod?.duration || 50);
    setSummary(true);
    setFinished(true);
  }, [pod?.duration]);
  const roomMembers = useMemo(() => {
    const colors = ["#9cc7b1", "#c1a7dc", "#a6c9dd", "#efc2a1"];
    if (pod?.memberProfiles)
      return pod.memberProfiles.map((member, index) => ({
        ...member,
        color: member.color || colors[index % colors.length],
        isCurrentUser: member.id === authUser?.id,
      }));
    return (pod?.memberNames || []).map((name, index) => ({
      name,
      initials: name
        .split(" ")
        .map((part) => part[0])
        .join(""),
      color: colors[index % colors.length],
      isCurrentUser: false,
      role: "member",
    }));
  }, [pod, authUser?.id]);

  useEffect(() => {
    let active = true;
    let initialLoadStarted = false;
    const profileById = new Map();
    const seenMessageIds = messageIdsByPodRef.current.get(podId) || new Set();
    messageIdsByPodRef.current.set(podId, seenMessageIds);
    if (authUser?.id && profile?.name) {
      profileById.set(authUser.id, {
        id: authUser.id,
        name: profile.name,
        initials: profile.initials,
        color: profile.color,
        avatarUrl: profile.avatar_url,
      });
    }

    if (podLoading || !podAvailable || !authUser?.id) {
      return () => { active = false; };
    }

    async function mapMessageRows(rows) {
      const missingProfileIds = [...new Set(rows
        .map((row) => row.sender_id)
        .filter((senderId) => senderId && !profileById.has(senderId)))];
      if (missingProfileIds.length) {
        const { data: senderProfiles, error: profilesError } = await supabase
          .from("profiles")
          .select("id, name, avatar_url")
          .in("id", missingProfileIds);
        if (profilesError) {
          if (import.meta.env.DEV) console.warn("Unable to load chat sender profiles:", profilesError);
        } else {
          for (const senderProfile of senderProfiles || []) {
            profileById.set(senderProfile.id, senderProfile);
          }
        }
      }
      return rows.map((row) => {
        const sender = profileById.get(row.sender_id);
        const name = sender?.name || "Pod member";
        const initials = sender?.initials || name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0].toUpperCase()).join("") || "?";
        return {
          id: row.id,
          senderId: row.sender_id,
          name,
          initials,
          color: sender?.color || "#9cc7b1",
          text: row.message,
          createdAt: row.created_at,
          time: row.created_at ? new Date(row.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
          self: row.sender_id === authUser.id,
        };
      });
    }

    async function appendRows(rows) {
      if (!active || !rows?.length) return;
      const mappedRows = await mapMessageRows(rows);
      if (!active) return;
      const unseenRows = mappedRows.filter((message) => !seenMessageIds.has(message.id));
      unseenRows.forEach((message) => seenMessageIds.add(message.id));
      if (unseenRows.length) {
        setChatState((current) => ({
          podId,
          messages: [...(current.podId === podId ? current.messages : []), ...unseenRows]
            .sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt)),
        }));
      }
    }
    appendChatRowsRef.current = appendRows;

    async function loadMessages() {
      if (initialLoadStarted) return;
      initialLoadStarted = true;
      try {
        const { data, error } = await supabase
          .from("study_pod_messages")
          .select("id, pod_id, sender_id, message, created_at")
          .eq("pod_id", podId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        await appendRows(data || []);
      } catch (error) {
        if (import.meta.env.DEV) console.error("Unable to load pod messages:", error);
        if (active) setChatErrorState({ podId, message: "Pod messages could not be loaded. Please try again." });
      } finally {
        if (active) setChatLoadState({ podId, loading: false });
      }
    }

    const channel = supabase
      .channel(`study-pod-messages:${podId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "study_pod_messages",
        filter: `pod_id=eq.${podId}`,
      }, (payload) => {
        appendRows([payload.new]).catch((error) => {
          if (import.meta.env.DEV) console.error("Unable to process new pod message:", error);
          if (active) setChatErrorState({ podId, message: "A new message could not be displayed." });
        });
      })
      .subscribe((status, error) => {
        if (!active) return;
        if (status === "SUBSCRIBED") loadMessages();
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (import.meta.env.DEV) console.error("Pod chat realtime subscription failed:", error);
          setChatErrorState({ podId, message: "Live chat connection failed. Loading saved messages only." });
          loadMessages();
          setChatLoadState({ podId, loading: false });
        }
      });

    return () => {
      active = false;
      appendChatRowsRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [podId, podAvailable, podLoading, podError, authUser?.id, profile?.name, profile?.initials, profile?.color, profile?.avatar_url]);

  async function sendChatMessage(text) {
    const trimmedMessage = text.trim();
    if (!trimmedMessage || chatSendingRef.current || !pod) return false;
    chatSendingRef.current = true;
    setChatSending(true);
    setChatErrorState({ podId, message: "" });
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) throw new Error("Sign in to send a message.");
      const { data, error } = await supabase
        .from("study_pod_messages")
        .insert({ pod_id: pod.id, sender_id: user.id, message: trimmedMessage })
        .select("id, pod_id, sender_id, message, created_at")
        .single();
      if (error) throw error;
      await appendChatRowsRef.current?.([data]);
      return true;
    } catch (error) {
      if (import.meta.env.DEV) console.error("Unable to send pod message:", error);
      setChatErrorState({ podId, message: "Your message could not be sent. Please try again." });
      return false;
    } finally {
      chatSendingRef.current = false;
      setChatSending(false);
    }
  }

  if (!pod)
    return podLoading ? (
      <div className="flex min-h-60 items-center justify-center gap-2 text-sm font-semibold text-[#397950]">
        <LoaderCircle size={18} className="animate-spin" />
        Loading study pod...
      </div>
    ) : (
      <EmptyState
        icon={Users}
        title="Study pod not found"
        description={
          podError || "This study pod is unavailable or may have been removed."
        }
      />
    );

  return (
    <div className="fade-up">
      <Link
        to="/pods"
        className="mb-5 inline-flex items-center gap-2 text-xs font-bold text-[#5f7d64]"
      >
        <ArrowLeft size={14} />
        All study pods
      </Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <Badge tone="green">
              <span className="h-1.5 w-1.5 rounded-full bg-[#61a46b]" />
              LIVE STUDY POD
            </Badge>
            <Badge tone="gray">{pod.duration} minute sprint</Badge>
          </div>
          <h1 className="text-[26px] font-extrabold text-[#293b30] sm:text-[31px]">
            {pod.topic}
          </h1>
          <p className="mt-1.5 text-sm text-[#7d897f]">
            {pod.detail} <span className="mx-1 text-[#c3cbc2]">·</span>{" "}
            {pod.goal}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {roomMembers.slice(0, 4).map((member) => (
              <Avatar
                key={member.name}
                initials={member.initials}
                color={member.color}
                online
                size="sm"
              />
            ))}
          </div>
          <span className="text-xs text-[#7a867c]">
            {roomMembers.length} here
          </span>
        </div>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <FocusTimer
            key={pod.id}
            podId={pod.id}
            minutes={pod.duration}
            onComplete={onTimerComplete}
          />
          <Card className="p-5">
            <SectionHeading
              title="Today's focus"
              subtitle="Keep it small. Keep it moving."
              action={
                <Badge tone="orange">
                  <TargetIcon />
                  Session goal
                </Badge>
              }
            />
            <div className="mb-2 rounded-xl bg-[#f7f8f5] px-3 py-2.5 text-sm font-semibold text-[#536157]">
              {pod.goal}
            </div>
            <GoalChecklist
              goals={goals}
              checked={checked}
              onToggle={(index) =>
                setChecked((value) =>
                  value.includes(index)
                    ? value.filter((item) => item !== index)
                    : [...value, index],
                )
              }
            />
            <div className="mt-2 flex items-center justify-between border-t border-[#edf0eb] pt-3">
              <span className="text-[11px] text-[#879188]">
                {checked.length} of {goals.length} goals complete
              </span>
              <Button
                variant={finished ? "soft" : "outline"}
                size="sm"
                onClick={() => {
                  setMinutesStudied((value) => value || 1);
                  setSummary(true);
                  setFinished(true);
                }}
              >
                <Flag size={13} />
                {finished ? "View summary" : "Finish session"}
              </Button>
            </div>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf0eb] px-5 py-4">
              <div>
                <h2 className="text-sm font-extrabold text-[#34453a]">
                  Video room
                </h2>
                <p className="mt-1 text-[11px] text-[#879188]">
                  A quiet place to work side-by-side
                </p>
              </div>
              <Badge tone="gray">
                <Wifi size={11} />
                Mock integration
              </Badge>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-[1fr_200px] sm:p-5">
              <div className="soft-grid flex min-h-[150px] flex-col items-center justify-center rounded-2xl bg-[#edf2ea] p-4 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-[#4b7955]">
                  <Headphones size={21} />
                </span>
                <p className="mt-3 text-sm font-bold text-[#46574a]">
                  Focus room is ready
                </p>
                <p className="mt-1 max-w-xs text-[10px] leading-4 text-[#849185]">
                  Camera, microphone and screen sharing can connect here later
                  using LiveKit or ZegoCloud.
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-1">
                {[
                  {
                    label: "Camera",
                    active: camera,
                    icon: camera ? VideoIcon : VideoOff,
                    set: setCamera,
                  },
                  {
                    label: "Microphone",
                    active: microphone,
                    icon: microphone ? Mic : MicOff,
                    set: setMicrophone,
                  },
                  {
                    label: "Screen share",
                    active: sharing,
                    icon: MonitorUp,
                    set: setSharing,
                  },
                ].map(({ label, active, icon: Icon, set }) => (
                  <button
                    key={label}
                    onClick={() => {
                      set((value) => !value);
                      setToast({
                        type: "info",
                        message: `${label} ${active ? "off" : "on"} in this mock room.`,
                      });
                    }}
                    className={`flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[10px] font-semibold transition-colors sm:justify-start sm:px-3 sm:text-xs ${active ? "border-[#9fc3a0] bg-[#edf6ec] text-[#35714d]" : "border-[#e8ece6] text-[#737f75] hover:bg-[#f7f9f6]"}`}
                  >
                    <Icon size={15} />
                    {label}
                    <span
                      className={`ml-auto hidden h-1.5 w-1.5 rounded-full sm:block ${active ? "bg-[#59a56a]" : "bg-[#c9d0c8]"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </Card>
          <Card className="p-5">
            <SectionHeading
              title="In this session"
              subtitle="A small group, working toward the same thing."
            />
            <div className="grid gap-2 sm:grid-cols-2">
              {roomMembers.map((member) => (
                <div
                  key={member.id || member.name}
                  className="flex items-center gap-3 rounded-xl bg-[#f7f8f5] p-3"
                >
                  <Avatar
                    initials={member.initials}
                    color={member.color}
                    online
                    size="sm"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-bold text-[#48574b]">
                      {member.name}
                      {member.isCurrentUser ? " (you)" : ""}
                    </span>
                    <span className="mt-0.5 block text-[10px] text-[#8b968d]">
                      {member.role === "owner" ? "Pod host" : "Pod member"}
                    </span>
                  </span>
                  <span className="h-2 w-2 rounded-full bg-[#6aaf78]" />
                </div>
              ))}
            </div>
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[10px] text-[#9aa39a]">
              Be respectful. Share the thinking, not just the answers.
            </p>
            <Button
              variant={joined ? "outline" : "soft"}
              size="sm"
              onClick={() => {
                setMembershipOverride({ podId: pod.id, joined: !joined });
                setToast({
                  type: "success",
                  message: joined
                    ? "You left the study pod."
                    : "You joined the study pod.",
                });
                if (joined) navigate("/pods");
              }}
            >
              {joined ? "Leave pod" : "Join pod"}
            </Button>
          </div>
        </div>
        <Card className="overflow-hidden xl:sticky xl:top-[88px]">
          <PodChat
            messages={messages}
            onSend={sendChatMessage}
            loading={chatLoading}
            sending={chatSending}
            error={chatError}
          />
        </Card>
      </div>
      {summary && (
        <SessionSummary
          pod={pod}
          checkedCount={checked.length}
          goalCount={goals.length}
          studiedMinutes={minutesStudied || 1}
          onClose={() => setSummary(false)}
          onUpdateRoadmap={updateRoadmapFromSession}
        />
      )}
    </div>
  );
}

function TargetIcon() {
  return <Check size={12} />;
}