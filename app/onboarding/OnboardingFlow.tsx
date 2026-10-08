"use client";

import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent, InputHTMLAttributes } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "../components/landing/Logo";
import { SearchableSelect } from "../home/filters/SearchableSelect";
import {
  createProfileDraft, fieldStep, INDUSTRIES, INTEREST_OPTIONS, isProfileComplete,
  PROFILE_STEPS, PROFESSIONS, requiredProfileIssue, SKILL_OPTIONS, validateProfileDraft,
} from "./profileModel";
import type { ProfileDraft, ProfileIssue } from "./profileModel";
import {
  loadOnboardingContext, OnboardingError, profilePhotoUrl, saveOnboardingProfile,
  uploadProfilePhoto, validatePhoto,
} from "./onboardingApi";
import type { OnboardingContext } from "./onboardingApi";
import styles from "./Onboarding.module.css";

type TextField = Exclude<keyof ProfileDraft, "industries" | "skills" | "interests">;

export function OnboardingFlow() {
  const router = useRouter();
  const [context, setContext] = useState<OnboardingContext | null>(null);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [phase, setPhase] = useState<"loading" | "form" | "error">("loading");
  const [loadError, setLoadError] = useState<OnboardingError | null>(null);
  const [reload, setReload] = useState(0);
  const [step, setStep] = useState(0);
  const [issue, setIssue] = useState<ProfileIssue | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoReady, setPhotoReady] = useState(false);
  const [preview, setPreview] = useState("");
  const [savedPhoto, setSavedPhoto] = useState("");
  const pageRef = useRef<HTMLElement>(null);
  const fieldsRef = useRef<HTMLFieldSetElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const blobUrl = useRef<string | null>(null);
  const uploadCache = useRef<{ file: File; path: string } | null>(null);
  const saveLock = useRef(false);
  const saveController = useRef<AbortController | null>(null);
  const mounted = useRef(false);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      saveController.current?.abort();
      if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    queueMicrotask(() => {
      if (!active) return;
      setPhase("loading");
      setLoadError(null);
      void loadOnboardingContext(controller.signal).then((loaded) => {
        if (!active) return;
        if (isProfileComplete(loaded.profile, loaded.photoExists)) { router.replace("/home"); return; }
        const initial = createProfileDraft(loaded.profile, loaded.metadata);
        const missing = validateProfileDraft(initial, loaded.photoExists) ?? requiredProfileIssue(loaded.profile, loaded.photoExists);
        const photoUrl = loaded.profile?.image_path && loaded.photoExists ? profilePhotoUrl(loaded.profile.image_path) : "";
        setContext(loaded); setDraft(initial); setStep(missing ? Math.max(0, fieldStep(missing.field)) : 0);
        setSavedPhoto(photoUrl); setPreview(photoUrl); setPhase("form");
      }).catch((cause: unknown) => {
        if (!active || controller.signal.aborted) return;
        setLoadError(cause instanceof OnboardingError ? cause : new OnboardingError("We couldn’t load your profile. Please try again."));
        setPhase("error");
      });
    });
    return () => { active = false; controller.abort(); };
  }, [reload, router]);

  useEffect(() => {
    if (phase !== "form") return;
    if (fieldsRef.current) fieldsRef.current.scrollTop = 0;
    headingRef.current?.focus({ preventScroll: true });
  }, [step, phase]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const page = pageRef.current;
    if (!viewport || !page) return;
    function fitViewport() {
      if (!page || !viewport || Math.abs(viewport.scale - 1) > 0.01) return;
      page.style.setProperty("--onboarding-viewport-height", `${viewport.height}px`);
      page.dataset.compact = viewport.height < 520 ? "true" : "false";
      const fields = fieldsRef.current;
      const control = document.activeElement;
      if (!fields || !(control instanceof HTMLElement) || !fields.contains(control)) return;
      const bounds = fields.getBoundingClientRect();
      const rect = control.getBoundingClientRect();
      if (rect.bottom > bounds.bottom - 12) fields.scrollTop += rect.bottom - bounds.bottom + 12;
      else if (rect.top < bounds.top + 12) fields.scrollTop -= bounds.top + 12 - rect.top;
    }
    fitViewport();
    viewport.addEventListener("resize", fitViewport); viewport.addEventListener("scroll", fitViewport);
    return () => { viewport.removeEventListener("resize", fitViewport); viewport.removeEventListener("scroll", fitViewport); };
  }, []);

  function update<K extends keyof ProfileDraft>(field: K, value: ProfileDraft[K]) {
    setDraft((current) => current ? { ...current, [field]: value } : current);
    setIssue((current) => current?.field === field ? null : current);
    setError("");
  }

  function showIssue(next: ProfileIssue) {
    setIssue(next); setError(""); setStep(Math.max(0, fieldStep(next.field)));
    requestAnimationFrame(() => {
      const root = document.getElementById(`onboarding-${next.field}-field`);
      const control = Array.from(root?.querySelectorAll<HTMLElement>("input, textarea, button") ?? [])
        .find((element) => element.getClientRects().length > 0);
      control?.focus({ preventScroll: true });
      root?.scrollIntoView({ block: "nearest", behavior: "instant" });
    });
  }

  function choosePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const invalid = validatePhoto(file);
    if (invalid) { setIssue({ field: "image_path", message: invalid }); return; }
    if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
    const url = URL.createObjectURL(file);
    blobUrl.current = url;
    uploadCache.current = null;
    setPhoto(file); setPhotoReady(false); setPreview(url); setIssue(null); setError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!context || !draft || saveLock.current) return;
    const hasPhoto = photo ? photoReady : context.photoExists;
    const invalid = validateProfileDraft(draft, hasPhoto, step < 3 ? step : undefined);
    if (invalid) { showIssue(invalid); return; }
    setIssue(null); setError("");
    if (step < 3) { setStep(step + 1); return; }
    saveLock.current = true; setSaving(true);
    const controller = new AbortController();
    saveController.current = controller;
    try {
      let imagePath = context.profile?.image_path ?? "";
      if (photo) {
        if (uploadCache.current?.file === photo) imagePath = uploadCache.current.path;
        else {
          setSaveStatus("Uploading your photo…");
          imagePath = await uploadProfilePhoto(photo, context.authUserId);
          uploadCache.current = { file: photo, path: imagePath };
        }
      }
      if (!mounted.current || controller.signal.aborted) return;
      setSaveStatus("Saving your profile…");
      await saveOnboardingProfile(draft, imagePath, context.authUserId, controller.signal);
      if (!mounted.current) return;
      router.replace("/home"); router.refresh();
    } catch (cause) {
      if (!mounted.current || controller.signal.aborted) return;
      saveLock.current = false; setSaving(false); setSaveStatus("");
      setError(cause instanceof Error ? cause.message : "We couldn’t save your profile. Please try again.");
    }
  }

  function textQuestion(field: TextField, title: string, options: InputHTMLAttributes<HTMLInputElement> = {}, optional = false) {
    return <div id={`onboarding-${field}-field`} className={styles.question}>
      <label htmlFor={`profile-${field}`}>{title}{optional && <span className={styles.optional}>Optional</span>}</label>
      <input {...options} id={`profile-${field}`} name={field} value={draft?.[field] ?? ""}
        required={!optional} aria-invalid={issue?.field === field || undefined}
        aria-describedby={issue?.field === field ? "onboarding-validation-error" : undefined}
        onChange={(event) => update(field, event.target.value)} />
    </div>;
  }

  function longQuestion(field: "bio" | "current_projects", title: string, placeholder: string, optional = false) {
    return <div id={`onboarding-${field}-field`} className={styles.question}>
      <label htmlFor={`profile-${field}`}>{title}{optional && <span className={styles.optional}>Optional</span>}</label>
      <textarea id={`profile-${field}`} name={field} rows={3} maxLength={600} required={!optional} placeholder={placeholder}
        value={draft?.[field] ?? ""} aria-invalid={issue?.field === field || undefined}
        onChange={(event) => update(field, event.target.value)} />
      <p className={styles.counter}>{draft?.[field].length ?? 0}/600</p>
    </div>;
  }

  function tagQuestion(field: "industries" | "skills" | "interests", title: string, options: readonly string[], optional = false) {
    return <div id={`onboarding-${field}-field`} className={`${styles.question} ${styles.choiceField}`}>
      <p id={`profile-${field}-label`} className={styles.questionTitle}>{title}{optional && <span className={styles.optional}>Optional</span>}</p>
      <SearchableSelect label={field === "industries" ? "Industries" : field === "skills" ? "Skills" : "Interests"}
        labelledBy={`profile-${field}-label`} placeholder={field === "industries" ? "Choose your industries" : "Choose or add your own"}
        options={options} value={draft?.[field] ?? []} onChange={(values) => update(field, values)} multiple
        searchInside={field === "industries"} allowCustom={field !== "industries"} matchAnyWord={field !== "industries"}
        maxSelections={field === "industries" ? 3 : undefined} portalRootId="onboarding-popovers" />
      <p className={styles.hint}>{field === "industries" ? "Choose 1–3 options from the list." : "Choose suggestions, or type and select + Add to use your own words."}</p>
    </div>;
  }

  return (
    <main ref={pageRef} className={styles.page}>
      <Link href="/" className={styles.brand} aria-label="Hi5 home" inert={saving}><Logo height={40} /></Link>
      {phase === "form" && draft && context ? (
        <section className={`glass glass-strong ${styles.card}`} aria-labelledby="onboarding-title">
          <header className={styles.header}>
            <ol className={styles.progress} aria-label="Profile setup progress">
              {PROFILE_STEPS.map((title, index) => <li key={title} className={index <= step ? styles.active : ""} aria-current={index === step ? "step" : undefined}>
                <span aria-hidden="true">{index < step ? "✓" : index + 1}</span><small>{title}</small>
              </li>)}
            </ol>
            <p className={styles.kicker}>Complete your Hi5 · Step {step + 1} of 4</p>
            <h1 id="onboarding-title" ref={headingRef} tabIndex={-1}>{["Let’s get to know you", "Tell us about your work", "What do you bring to the table?", "Put a face to your Hi5"][step]}</h1>
            <p className={styles.intro}>We’ve filled in what we already know. Add the missing details to help people get to know you.</p>
          </header>
          <form className={styles.form} noValidate onSubmit={(event) => void submit(event)} aria-busy={saving}>
            <fieldset ref={fieldsRef} className={styles.fields} data-filter-scroll disabled={saving}>
              <legend className={styles.srOnly}>{PROFILE_STEPS[step]}</legend>
              {step === 0 && <>
                {textQuestion("name", "What should we call you?", { autoComplete: "name", maxLength: 120, placeholder: "Your full name" })}
                <div className={styles.twoColumns}>
                  {textQuestion("location", "Where are you based?", { maxLength: 160, placeholder: "e.g. Brighton, UK" })}
                  {textQuestion("age", "How old are you?", { type: "number", min: 1, max: 120, step: 1, inputMode: "numeric", placeholder: "Your age" }, true)}
                </div>
                {longQuestion("bio", "Tell us a little about yourself", "Share what you do, what matters to you, and who you’d like to meet.")}
              </>}
              {step === 1 && <>
                <div id="onboarding-job_title-field" className={`${styles.question} ${styles.choiceField}`}>
                  <p id="profile-role-label" className={styles.questionTitle}>What do you do?</p>
                  <SearchableSelect label="Role / Profession" labelledBy="profile-role-label" placeholder="Choose or enter your role"
                    options={PROFESSIONS} value={draft.job_title ? [draft.job_title] : []} onChange={(values) => update("job_title", values[0] ?? "")}
                    allowCustom matchAnyWord portalRootId="onboarding-popovers" />
                  <p className={styles.hint}>Choose a suggestion or select + Add to enter your own title.</p>
                </div>
                <div className={styles.twoColumns}>
                  {textQuestion("organisation", "Where do you work?", { maxLength: 160, placeholder: "Company or organisation" }, true)}
                  {textQuestion("experience", "Years of experience", { type: "number", min: 0, max: 100, step: 1, inputMode: "numeric", placeholder: "e.g. 5" })}
                </div>
                {tagQuestion("industries", "Which industries describe your work?", INDUSTRIES)}
              </>}
              {step === 2 && <>
                {tagQuestion("skills", "What are your skills?", SKILL_OPTIONS)}
                {tagQuestion("interests", "What are you interested in?", INTEREST_OPTIONS, true)}
                {longQuestion("current_projects", "What are you working on?", "e.g. Building a SaaS product, exploring an idea, or growing a team.", true)}
              </>}
              {step === 3 && <>
                <div id="onboarding-image_path-field" className={styles.question}>
                  <p className={styles.questionTitle}>Add your profile photo</p>
                  <div className={styles.photoRow}>
                    <div className={styles.photoPreview}>
                      {preview ? <Image key={preview} src={preview} alt="Your profile photo preview" fill sizes="140px" unoptimized={preview.startsWith("blob:")}
                        onLoad={() => { if (photo) setPhotoReady(true); }} onError={() => { if (photo) { setPhotoReady(false); setIssue({ field: "image_path", message: "This photo couldn’t be opened. Please choose another image." }); } }} />
                        : <span aria-hidden="true">{draft.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "Hi"}</span>}
                    </div>
                    <div className={styles.photoActions}>
                      <p>Help your next connection recognise you.</p>
                      <button type="button" className="btn btn-glass" onClick={() => fileRef.current?.click()}>Choose a photo</button>
                      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className={styles.fileInput} aria-label="Choose your profile photo" onChange={choosePhoto} />
                      <small>JPEG, PNG or WebP · up to 5 MB</small>
                      {photo && savedPhoto && <button type="button" className={styles.textButton} onClick={() => {
                        if (blobUrl.current) URL.revokeObjectURL(blobUrl.current);
                        blobUrl.current = null; uploadCache.current = null;
                        setPhoto(null); setPhotoReady(false); setPreview(savedPhoto); setIssue(null);
                      }}>Use saved photo</button>}
                    </div>
                  </div>
                </div>
                <p className={styles.linksIntro}>Add a few links so people can explore your work. These are optional.</p>
                {textQuestion("portfolio_url", "Portfolio or website", { type: "url", maxLength: 2048, placeholder: "https://your-website.com" }, true)}
                {textQuestion("linkedin_url", "LinkedIn", { type: "url", maxLength: 2048, placeholder: "https://linkedin.com/in/your-name" }, true)}
                {textQuestion("github_url", "GitHub", { type: "url", maxLength: 2048, placeholder: "https://github.com/your-name" }, true)}
              </>}
            </fieldset>
            <footer className={styles.actions}>
              {issue && <p id="onboarding-validation-error" className={styles.error} role="alert">{issue.message}</p>}
              {error && <p className={styles.error} role="alert">{error}</p>}
              <div className={styles.actionButtons}>
                <button type="button" className={`btn btn-glass ${styles.back}`} disabled={step === 0 || saving} onClick={() => { setIssue(null); setError(""); setStep(step - 1); }}>Back</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? saveStatus || "Saving…" : step === 3 ? "Finish my profile" : "Continue"}</button>
              </div>
              <span className={styles.srOnly} role="status" aria-live="polite">{saveStatus}</span>
            </footer>
          </form>
        </section>
      ) : (
        <section className={`glass glass-strong ${styles.statusCard}`} aria-busy={phase === "loading"}>
          <h1>{phase === "loading" ? "Checking your profile…" : loadError?.signedOut ? "Log in to complete your Hi5" : "Your profile isn’t ready yet"}</h1>
          <p role={phase === "error" ? "alert" : "status"}>{phase === "loading" ? "Getting your details ready." : loadError?.message}</p>
          {phase === "error" && <div className={styles.statusActions}>
            {!loadError?.signedOut && <button type="button" className="btn btn-primary" onClick={() => setReload((value) => value + 1)}>Try again</button>}
            <Link href="/" className="btn btn-glass">Back to Hi5</Link>
          </div>}
        </section>
      )}
      <p className={styles.pageFooter}>Meet 5 people worth saying Hi to.</p>
      <div id="onboarding-popovers" className={styles.portalRoot} />
    </main>
  );
}
