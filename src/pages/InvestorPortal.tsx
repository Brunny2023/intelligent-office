import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Lock, FileText, CheckCircle2, Clock, MessageSquare, Video, LogOut,
  Download, ShieldCheck, ArrowLeft,
} from "lucide-react";
import RequestAccessDialog from "@/components/investors/RequestAccessDialog";
import BookMeetingDialog from "@/components/investors/BookMeetingDialog";
import { NAVY, BONE, GOLD } from "@/components/investors/investorTheme";

type Investor = {
  id: string; full_name: string; email: string; firm: string | null; status: string;
  nda_accepted_at: string | null; access_expires_at: string | null;
};
type Doc = {
  id: string; category: string; title: string; description: string | null;
  storage_path: string | null; external_url: string | null; sensitivity: string;
};
type Step = { id: string; step_key: string; label: string; status: string; completed_at: string | null; sort_order: number };
type Msg = { id: string; body: string; from_company: boolean; kind: string; created_at: string };

const CATEGORIES: { key: string; label: string }[] = [
  { key: "corporate", label: "Corporate" },
  { key: "financial", label: "Financial" },
  { key: "product", label: "Product & Technology" },
  { key: "commercial", label: "Commercial" },
  { key: "legal", label: "Legal & Compliance" },
  { key: "fundraising", label: "Fundraising" },
];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen" style={{ background: BONE, color: NAVY }}>
    <div className="max-w-5xl mx-auto px-6 md:px-12 py-12">
      <Link to="/investors" className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase mb-10"
        style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
        <ArrowLeft className="w-3 h-3" /> Investor Brief
      </Link>
      {children}
    </div>
  </div>
);

const Title = ({ eyebrow, children }: { eyebrow: string; children: React.ReactNode }) => (
  <>
    <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{eyebrow}</p>
    <h1 className="text-3xl md:text-4xl mb-6" style={{ fontFamily: "'Instrument Serif', Georgia, serif", fontWeight: 400 }}>{children}</h1>
  </>
);

/* ---------------- auth gate ---------------- */
const AuthPanel = ({ onRequest }: { onRequest: () => void }) => {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setMsg(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(), password,
          options: { emailRedirectTo: `${window.location.origin}/investor-portal`, data: { full_name: name } },
        });
        if (error) throw error;
        if (!data.session) setMsg("Check your email to confirm your address, then sign in.");
      }
    } catch (err) {
      setMsg((err as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <Shell>
      <Title eyebrow="Secure Access">Investor Portal</Title>
      <p className="max-w-2xl mb-10 leading-relaxed" style={{ color: `${NAVY}CC` }}>
        This portal holds the Global Office data room, your due-diligence tracker, and a secure channel to the
        founding team. Access is granted to qualified investors under NDA and every document view is logged.
      </p>
      <div className="grid md:grid-cols-2 gap-10">
        <form onSubmit={submit} className="space-y-4 border p-6" style={{ borderColor: NAVY }}>
          <p className="text-xs tracking-[0.2em] uppercase" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>
            {mode === "signin" ? "Sign in" : "Create your investor account"}
          </p>
          {mode === "signup" && (
            <div><Label htmlFor="ip-name">Full name</Label><Input id="ip-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} /></div>
          )}
          <div><Label htmlFor="ip-email">Email</Label><Input id="ip-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
          <div><Label htmlFor="ip-pw">Password</Label><Input id="ip-pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
          {msg && <p className="text-sm" style={{ color: GOLD }}>{msg}</p>}
          <Button type="submit" disabled={busy} className="w-full">{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
          <button type="button" className="text-xs underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
            {mode === "signin" ? "No account yet? Create one" : "Already have an account? Sign in"}
          </button>
        </form>
        <div className="border p-6" style={{ borderColor: NAVY }}>
          <p className="text-xs tracking-[0.2em] uppercase mb-3" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>No access yet?</p>
          <p className="text-sm leading-relaxed mb-6" style={{ color: `${NAVY}CC` }}>
            Submit a request with your firm details and accept the confidentiality terms. Approved investors receive a
            time-limited data room grant tied to this account.
          </p>
          <Button variant="outline" onClick={onRequest}>Request data room access</Button>
        </div>
      </div>
    </Shell>
  );
};

/* ---------------- portal ---------------- */
const InvestorPortal = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const [investor, setInvestor] = useState<Investor | null>(null);
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<"message" | "document_request" | "question">("message");
  const [requestOpen, setRequestOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const loadInvestor = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("investor_profiles")
      .select("id, full_name, email, firm, status, nda_accepted_at, access_expires_at")
      .eq("user_id", user.id).maybeSingle();
    setInvestor(data as Investor | null);
    setLoading(false);
  }, [user]);

  useEffect(() => { if (!authLoading) loadInvestor(); }, [authLoading, loadInvestor]);

  const approved = investor?.status === "approved" &&
    (!investor.access_expires_at || new Date(investor.access_expires_at) > new Date());

  useEffect(() => {
    if (!approved || !investor) return;
    supabase.from("data_room_documents").select("*").eq("is_active", true)
      .order("category").order("sort_order")
      .then(({ data }) => setDocs((data ?? []) as Doc[]));
    supabase.from("investor_dd_steps").select("*").eq("investor_id", investor.id).order("sort_order")
      .then(({ data }) => setSteps((data ?? []) as Step[]));
    supabase.from("investor_messages").select("*").eq("investor_id", investor.id).order("created_at")
      .then(({ data }) => setMsgs((data ?? []) as Msg[]));
  }, [approved, investor]);

  const openDoc = async (doc: Doc) => {
    if (!investor) return;
    const started = Date.now();
    let url = doc.external_url ?? null;
    if (doc.storage_path) {
      const { data, error } = await supabase.storage.from("data-room").createSignedUrl(doc.storage_path, 600);
      if (error) { alert("This document is not available yet."); return; }
      url = data.signedUrl;
    }
    if (!url) { alert("This document is not available yet."); return; }
    const win = window.open(url, "_blank", "noopener");
    await supabase.from("data_room_access_log").insert({
      investor_id: investor.id, document_id: doc.id, action: "view",
      user_agent: navigator.userAgent.slice(0, 300),
    });
    // Best-effort dwell-time capture when the tab closes.
    const timer = window.setInterval(async () => {
      if (win && win.closed) {
        window.clearInterval(timer);
        await supabase.from("data_room_access_log").insert({
          investor_id: investor.id, document_id: doc.id, action: "close",
          duration_seconds: Math.round((Date.now() - started) / 1000),
          user_agent: navigator.userAgent.slice(0, 300),
        });
      }
    }, 2000);
    window.setTimeout(() => window.clearInterval(timer), 30 * 60 * 1000);
  };

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investor || !user || draft.trim().length === 0) return;
    const body = draft.trim().slice(0, 4000);
    const { data, error } = await supabase.from("investor_messages")
      .insert({ investor_id: investor.id, sender_id: user.id, from_company: false, kind, body })
      .select("*").single();
    if (!error && data) { setMsgs((m) => [...m, data as Msg]); setDraft(""); }
  };

  if (authLoading || loading) {
    return <Shell><p style={{ color: `${NAVY}99` }}>Loading…</p></Shell>;
  }

  if (!user) {
    return (
      <>
        <AuthPanel onRequest={() => setRequestOpen(true)} />
        <RequestAccessDialog open={requestOpen} onOpenChange={setRequestOpen} />
      </>
    );
  }

  if (!investor || !approved) {
    const pending = investor?.status === "pending";
    return (
      <Shell>
        <Title eyebrow="Secure Access">Investor Portal</Title>
        <div className="border p-8 max-w-2xl" style={{ borderColor: NAVY }}>
          {pending ? (
            <>
              <Clock className="w-6 h-6 mb-4" style={{ color: GOLD }} />
              <p className="text-lg mb-2">Your access request is under review.</p>
              <p className="text-sm leading-relaxed" style={{ color: `${NAVY}CC` }}>
                Your NDA acceptance was recorded on{" "}
                {investor?.nda_accepted_at ? new Date(investor.nda_accepted_at).toLocaleDateString() : "file"}.
                You will receive an email once the founding team approves access. Typical turnaround is one business day.
              </p>
            </>
          ) : investor?.status === "revoked" || investor?.status === "declined" ? (
            <>
              <Lock className="w-6 h-6 mb-4" style={{ color: GOLD }} />
              <p className="text-lg mb-2">Access is not currently active.</p>
              <p className="text-sm" style={{ color: `${NAVY}CC` }}>Contact the founding team to discuss reinstatement.</p>
            </>
          ) : (
            <>
              <Lock className="w-6 h-6 mb-4" style={{ color: GOLD }} />
              <p className="text-lg mb-2">No data room grant on this account.</p>
              <p className="text-sm mb-6" style={{ color: `${NAVY}CC` }}>
                Submit a request and accept the confidentiality terms to be considered.
              </p>
              <Button onClick={() => setRequestOpen(true)}>Request data room access</Button>
            </>
          )}
          <button onClick={signOut} className="mt-8 inline-flex items-center gap-2 text-xs underline" style={{ color: `${NAVY}99` }}>
            <LogOut className="w-3 h-3" /> Sign out
          </button>
        </div>
        <RequestAccessDialog open={requestOpen} onOpenChange={setRequestOpen} onSubmitted={loadInvestor} />
      </Shell>
    );
  }

  const done = steps.filter((s) => s.status === "complete").length;

  return (
    <Shell>
      <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
        <div>
          <Title eyebrow="Secure Access">Investor Portal</Title>
          <p className="text-sm" style={{ color: `${NAVY}99` }}>
            {investor.full_name}{investor.firm ? ` · ${investor.firm}` : ""} — access{" "}
            {investor.access_expires_at ? `expires ${new Date(investor.access_expires_at).toLocaleDateString()}` : "active"}
          </p>
        </div>
        <button onClick={signOut} className="inline-flex items-center gap-2 text-xs underline" style={{ color: `${NAVY}99` }}>
          <LogOut className="w-3 h-3" /> Sign out
        </button>
      </div>

      <div className="mb-8 flex items-center gap-2 text-xs px-3 py-2 border" style={{ borderColor: GOLD, color: NAVY, background: `${GOLD}12` }}>
        <ShieldCheck className="w-3.5 h-3.5" style={{ color: GOLD }} />
        Confidential under NDA. Every document you open is logged with a timestamp and time-on-document.
      </div>

      <Tabs defaultValue="dataroom">
        <TabsList>
          <TabsTrigger value="dataroom">Data Room</TabsTrigger>
          <TabsTrigger value="diligence">Diligence ({done}/{steps.length})</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="meet">Meet</TabsTrigger>
        </TabsList>

        <TabsContent value="dataroom" className="mt-8 space-y-10">
          {docs.length === 0 && (
            <p className="text-sm" style={{ color: `${NAVY}99` }}>
              Documents are being prepared for your grant. You will be notified as folders are released.
            </p>
          )}
          {CATEGORIES.map((c) => {
            const list = docs.filter((d) => d.category === c.key);
            if (list.length === 0) return null;
            return (
              <div key={c.key}>
                <p className="text-[11px] tracking-[0.22em] uppercase mb-3" style={{ color: GOLD, fontFamily: "'Space Grotesk', sans-serif" }}>{c.label}</p>
                <div className="border" style={{ borderColor: NAVY }}>
                  {list.map((d) => (
                    <div key={d.id} className="flex items-center justify-between gap-4 px-4 py-3" style={{ borderTop: `1px solid ${NAVY}22` }}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm"><FileText className="w-3.5 h-3.5" style={{ color: GOLD }} />{d.title}</div>
                        {d.description && <p className="text-xs mt-1" style={{ color: `${NAVY}99` }}>{d.description}</p>}
                      </div>
                      <button onClick={() => openDoc(d)}
                        className="shrink-0 inline-flex items-center gap-1 text-[10px] tracking-[0.2em] uppercase px-2 py-1 border"
                        style={{ borderColor: GOLD, color: GOLD, background: `${GOLD}15`, fontFamily: "'Space Grotesk', sans-serif" }}>
                        <Download className="w-3 h-3" /> Open
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </TabsContent>

        <TabsContent value="diligence" className="mt-8">
          <p className="text-sm mb-6" style={{ color: `${NAVY}CC` }}>
            Your personalised progress through our diligence process. Steps are marked complete by the founding team as
            each milestone is reached.
          </p>
          <ol className="border" style={{ borderColor: NAVY }}>
            {steps.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-3 text-sm" style={{ borderTop: `1px solid ${NAVY}22` }}>
                {s.status === "complete"
                  ? <CheckCircle2 className="w-4 h-4" style={{ color: GOLD }} />
                  : <Clock className="w-4 h-4" style={{ color: `${NAVY}55` }} />}
                <span style={{ color: s.status === "complete" ? NAVY : `${NAVY}99` }}>{s.label}</span>
                {s.completed_at && <span className="ml-auto text-xs" style={{ color: `${NAVY}77` }}>{new Date(s.completed_at).toLocaleDateString()}</span>}
                {s.status === "in_progress" && <span className="ml-auto text-xs" style={{ color: GOLD }}>In progress</span>}
              </li>
            ))}
          </ol>
        </TabsContent>

        <TabsContent value="messages" className="mt-8">
          <div className="space-y-3 mb-6">
            {msgs.length === 0 && <p className="text-sm" style={{ color: `${NAVY}99` }}>No messages yet. Ask a question or request a document below.</p>}
            {msgs.map((m) => (
              <div key={m.id} className="border p-3 text-sm" style={{ borderColor: m.from_company ? GOLD : `${NAVY}33`, background: m.from_company ? `${GOLD}0D` : "transparent" }}>
                <div className="text-[10px] tracking-[0.18em] uppercase mb-1" style={{ color: m.from_company ? GOLD : `${NAVY}77`, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {m.from_company ? "Global Office" : "You"} · {m.kind.replace("_", " ")} · {new Date(m.created_at).toLocaleString()}
                </div>
                <p style={{ color: `${NAVY}DD` }}>{m.body}</p>
              </div>
            ))}
          </div>
          <form onSubmit={send} className="space-y-3">
            <div className="flex gap-2">
              {(["message", "question", "document_request"] as const).map((k) => (
                <button key={k} type="button" onClick={() => setKind(k)}
                  className="text-[10px] tracking-[0.18em] uppercase px-2 py-1 border"
                  style={{ borderColor: kind === k ? GOLD : `${NAVY}33`, color: kind === k ? GOLD : `${NAVY}88`, fontFamily: "'Space Grotesk', sans-serif" }}>
                  {k.replace("_", " ")}
                </button>
              ))}
            </div>
            <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={3} maxLength={4000}
              placeholder={kind === "document_request" ? "Which document would you like added to the data room?" : "Your message to the founding team…"} />
            <Button type="submit" disabled={!draft.trim()}><MessageSquare className="w-4 h-4 mr-2" /> Send securely</Button>
          </form>
        </TabsContent>

        <TabsContent value="meet" className="mt-8">
          <p className="text-sm mb-6 max-w-2xl" style={{ color: `${NAVY}CC` }}>
            Book time with the founding team or join a live product demo. Sessions run inside Global Office's own
            executive meeting room — the fundraising process itself runs on the product.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setMeetingOpen(true)}><Video className="w-4 h-4 mr-2" /> Schedule a meeting</Button>
            <Button variant="outline" asChild><Link to="/demo">Open the live product demo</Link></Button>
          </div>
        </TabsContent>
      </Tabs>

      <BookMeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} />
    </Shell>
  );
};

export default InvestorPortal;
