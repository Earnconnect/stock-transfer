"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Seal, LockIcon, ShieldCheck } from "@/components/ui";
import ProcessingOverlay from "@/components/ProcessingOverlay";
import { verifyIdentityAction } from "@/app/actions/kyc";

const ID_TYPES = [
  { id: "drivers_license", label: "Driver's License" },
  { id: "passport", label: "Passport" },
  { id: "state_id", label: "State ID" },
];

const VERIFY_STAGES = ["Reading identity document", "Running biometric face match", "Confirming against records"];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export default function IdentityVerification({ redirectTo = "/" }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [idType, setIdType] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [docName, setDocName] = useState("");
  const [faceShot, setFaceShot] = useState(""); // data URL preview
  const [camError, setCamError] = useState("");
  const [error, setError] = useState("");
  const [proc, setProc] = useState({ open: false, step: 0, status: "running" });

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // Start / stop the webcam when entering the face step.
  useEffect(() => {
    if (step !== 1 || faceShot) return;
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      } catch {
        setCamError("Camera unavailable or permission denied. Upload a selfie instead.");
      }
    }
    start();
    return () => { cancelled = true; stopCam(); };
  }, [step, faceShot]);

  function stopCam() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capture() {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c) return;
    c.width = v.videoWidth || 320; c.height = v.videoHeight || 240;
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    setFaceShot(c.toDataURL("image/jpeg", 0.7));
    stopCam();
  }

  function onSelfieFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setFaceShot(String(reader.result));
    reader.readAsDataURL(file);
  }

  const idValid = idType && idNumber.trim().length >= 4 && docName;

  async function submit() {
    setError("");
    setProc({ open: true, step: 0, status: "running" });
    const actionP = verifyIdentityAction({ idType, idNumber, faceCaptured: !!faceShot });
    for (let i = 0; i < VERIFY_STAGES.length; i++) {
      setProc((p) => ({ ...p, step: i }));
      await wait(750);
    }
    const res = await actionP;
    if (res?.error) {
      setProc({ open: false, step: 0, status: "running" });
      setError(res.error);
      return;
    }
    setProc((p) => ({ ...p, status: "success" }));
    await wait(1150);
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* steps */}
      <ol className="flex items-center gap-2 text-xs">
        {["Identity document", "Face verification"].map((l, i) => (
          <li key={l} className="flex items-center gap-2">
            <span className={`grid place-items-center h-6 w-6 rounded-full font-semibold ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-brand-700 text-white" : "bg-slate-200 text-slate-500"}`}>{i < step ? "✓" : i + 1}</span>
            <span className={i === step ? "font-medium text-slate-800" : "text-slate-400"}>{l}</span>
            {i === 0 && <span className="mx-1 h-px w-8 bg-slate-200" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="card p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900">Upload a government ID</h2>
            <p className="mt-1 text-sm text-slate-500">Required to comply with KYC / Customer Identification Program rules before moving funds.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1.5">Document type <span className="text-rose-500">*</span></span>
              <select className="field" value={idType} onChange={(e) => setIdType(e.target.value)}>
                <option value="">Select…</option>
                {ID_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-medium text-slate-600 mb-1.5">Document number <span className="text-rose-500">*</span></span>
              <input className="field font-mono" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="e.g. D1234-5678-9012" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs font-medium text-slate-600 mb-1.5">Document image (front) <span className="text-rose-500">*</span></span>
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => setDocName(e.target.files?.[0]?.name || "")}
                className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-700 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-800" />
            </div>
            {docName && <span className="mt-1 block text-[11px] text-emerald-600">✓ {docName} attached</span>}
          </label>
          <div className="flex items-center justify-between">
            <Seal tone="slate"><LockIcon /> Encrypted &amp; never shared</Seal>
            <button disabled={!idValid} onClick={() => setStep(1)} className="btn-primary">Continue</button>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card p-4 sm:p-6 space-y-4">
          <div>
            <h2 className="font-semibold text-slate-900">Face verification</h2>
            <p className="mt-1 text-sm text-slate-500">We match a live photo to your ID to confirm it&apos;s really you (liveness check).</p>
          </div>

          <div className="grid place-items-center">
            <div className={`relative h-56 w-56 overflow-hidden rounded-full bg-slate-900 ring-4 ${faceShot ? "ring-emerald-300" : "ring-brand-200"}`}>
              {faceShot ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={faceShot} alt="Captured selfie" className="h-full w-full object-cover animate-pop" />
              ) : (
                <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
              )}
              <canvas ref={canvasRef} className="hidden" />

              {/* Live scan overlay */}
              {!faceShot && !camError && (
                <>
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-x-0 h-10 bg-gradient-to-b from-brand-400/0 via-brand-400/40 to-brand-400/0 animate-scan" />
                  </div>
                  {/* corner brackets */}
                  <div className="pointer-events-none absolute inset-5">
                    <span className="absolute left-0 top-0 h-5 w-5 border-l-2 border-t-2 border-white/70 rounded-tl" />
                    <span className="absolute right-0 top-0 h-5 w-5 border-r-2 border-t-2 border-white/70 rounded-tr" />
                    <span className="absolute left-0 bottom-0 h-5 w-5 border-l-2 border-b-2 border-white/70 rounded-bl" />
                    <span className="absolute right-0 bottom-0 h-5 w-5 border-r-2 border-b-2 border-white/70 rounded-br" />
                  </div>
                  <div className="pointer-events-none absolute bottom-3 inset-x-0 text-center text-[10px] font-medium text-white/80 animate-soft-pulse">
                    Align your face within the circle
                  </div>
                </>
              )}
              {faceShot && (
                <span className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[10px] font-semibold text-white animate-fade">
                  ✓ Captured
                </span>
              )}
            </div>
          </div>

          {camError && <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/20">{camError}</div>}

          <div className="flex flex-wrap items-center justify-center gap-2">
            {!faceShot ? (
              <>
                <button onClick={capture} disabled={!!camError} className="btn-primary disabled:opacity-50">Capture photo</button>
                <label className="btn-ghost cursor-pointer">
                  Upload selfie
                  <input type="file" accept="image/*" capture="user" className="hidden" onChange={onSelfieFile} />
                </label>
              </>
            ) : (
              <button onClick={() => setFaceShot("")} className="btn-ghost">Retake</button>
            )}
          </div>

          {error && <div className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-600/20">{error}</div>}

          <div className="flex items-center justify-between border-t border-slate-100 pt-4">
            <button onClick={() => { stopCam(); setStep(0); }} className="btn-ghost">Back</button>
            <button onClick={submit} disabled={!faceShot || proc.open} className="btn-primary">
              <ShieldCheck className="h-4 w-4" /> Submit &amp; verify
            </button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400">
        Demonstration only — no biometric data is stored. A production build would run a real ID + liveness
        check through a regulated IDV provider.
      </p>

      <ProcessingOverlay
        open={proc.open}
        status={proc.status}
        current={proc.step}
        steps={VERIFY_STAGES}
        title="Verifying your identity"
        subtitle="This usually takes a few seconds."
        successTitle="Identity verified"
        successSubtitle="You're all set — redirecting…"
      />
    </div>
  );
}
