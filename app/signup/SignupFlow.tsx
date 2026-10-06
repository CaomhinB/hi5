"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Logo } from "../components/landing/Logo";
import { getSupabaseBrowserClient } from "../lib/supabase/browser";
import { industries, interests } from "./options";
import { signupErrorMessage } from "./signupErrors";
import styles from "./Signup.module.css";

const steps = ["Account", "Interests", "Your project"];

export function SignupFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const pending = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousStep = useRef(step);
  const previousDone = useRef(done);
  const matches = industries.filter((tag) => !tags.includes(tag) && tag.toLowerCase().includes(query.trim().toLowerCase()));

  useEffect(() => {
    if (previousStep.current !== step || previousDone.current !== done) {
      heading.current?.focus();
      previousStep.current = step;
      previousDone.current = done;
    }
  }, [step, done]);

  function goTo(next: number) {
    setError("");
    setStep(next);
  }

  function toggleInterest(interest: string) {
    setSelectedInterests((current) => current.includes(interest)
      ? current.filter((value) => value !== interest) : [...current, interest]);
  }

  function continueAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError("Enter your name, a valid email, and a password with at least 8 characters.");
      return;
    }
    goTo(1);
  }

  async function createAccount(skip: boolean) {
    if (pending.current) return;
    if (selectedInterests.length < 3) { goTo(1); return; }
    pending.current = true;
    setBusy(true);
    setError("");
    try {
      const { data, error: signupError } = await getSupabaseBrowserClient().auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/signup/confirmed`,
          data: { full_name: name.trim(), interests: selectedInterests, industries: skip ? [] : tags },
        },
      });
      if (signupError) throw signupError;
      if (!data.user) throw new Error("Signup did not return a user");
      if (data.user.identities?.length === 0) {
        setError("An account may already exist for this email. Check your email for an earlier confirmation link, or use a different email.");
        return;
      }
      setPassword("");
      if (data.session) {
        router.replace("/home");
      } else {
        setDone(true);
      }
    } catch (cause) {
      setError(signupErrorMessage(cause));
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.orbs} aria-hidden="true"><span /><span /><span /></div>
      <Link href="/" className={styles.brand} aria-label="Hi5 home"><Logo height={46} /></Link>
      <section className={`glass glass-strong ${styles.card}`} aria-labelledby="signup-title" aria-busy={busy}>
        {done ? (
          <div className={styles.success}>
            <span className={styles.successIcon} aria-hidden="true">✓</span>
            <h1 id="signup-title" ref={heading} tabIndex={-1}>Check your email</h1>
            <p>We&apos;ve sent a confirmation link to <strong>{email.trim()}</strong>.</p>
            <p>Open the link to confirm your account. If you don&apos;t see it, check your spam folder.</p>
            <Link href="/" className="btn btn-primary">Back to Hi5</Link>
          </div>
        ) : (
          <>
            <ol className={styles.progress} aria-label="Signup progress">
              {steps.map((label, index) => <li key={label} aria-current={index === step ? "step" : undefined} className={index <= step ? styles.active : ""}>
                <span aria-hidden="true">{index < step ? "✓" : index + 1}</span><small>{label}</small>
              </li>)}
            </ol>
            <p className={styles.kicker}>STEP {step + 1} OF 3{step === 2 ? " · OPTIONAL" : ""}</p>
            <h1 id="signup-title" ref={heading} tabIndex={-1}>{["Create your Hi5", "What are you interested in?", "What are you working on?"][step]}</h1>
            <p className={styles.intro}>{["Your next great connection starts with a Hi.", "Choose at least 3 interests to help us find more relevant people for you.", "Add tags that describe your company, project or idea. You can always do this later."][step]}</p>
            {error && <p className={styles.error} role="alert">{error}</p>}
            {step === 0 && <form onSubmit={continueAccount} className={styles.form}>
              <label htmlFor="signup-name">Name<input id="signup-name" name="name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required maxLength={120} /></label>
              <label htmlFor="signup-email">Email<input id="signup-email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} /></label>
              <label htmlFor="signup-password">Password<input id="signup-password" name="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" minLength={8} required aria-describedby="password-help" /></label>
              <p id="password-help" className={styles.hint}>Use at least 8 characters. A longer, unique password is best.</p>
              <button className="btn btn-primary btn-lg" type="submit">Continue <span aria-hidden="true">→</span></button>
            </form>}
            {step === 1 && <>
              <div className={styles.interests} role="group" aria-label="Choose your interests">
                {interests.map((interest) => <button type="button" key={interest} aria-pressed={selectedInterests.includes(interest)} onClick={() => toggleInterest(interest)} className={styles.interest}>
                  {interest}<span aria-hidden="true">{selectedInterests.includes(interest) ? "✓" : "+"}</span>
                </button>)}
              </div>
              <p className={styles.selection} role="status">{selectedInterests.length} selected · {selectedInterests.length < 3 ? `choose ${3 - selectedInterests.length} more` : "looking good!"}</p>
              <div className={styles.actions}>
                <button type="button" className="btn btn-glass" onClick={() => goTo(0)}>Back</button>
                <button type="button" className="btn btn-primary" disabled={selectedInterests.length < 3} onClick={() => goTo(2)}>Continue <span aria-hidden="true">→</span></button>
              </div>
            </>}
            {step === 2 && <>
              <fieldset className={styles.tagsField} disabled={busy}>
                <legend className={styles.fieldLabel}>Company / project tags</legend>
                <div className={styles.selectedTags} aria-label="Selected project tags">
                  {tags.map((tag) => <button key={tag} type="button" className="pill pill-purple" onClick={() => setTags((current) => current.filter((value) => value !== tag))} aria-label={`Remove ${tag}`}>{tag} <span aria-hidden="true">×</span></button>)}
                </div>
                <label htmlFor="tag-search" className={styles.fieldLabel}>Find a tag</label>
                <input id="tag-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try Fintech, SaaS or AI" autoComplete="off" aria-describedby="tag-help" />
                <p id="tag-help" className={styles.hint}>Select a suggestion to add it. Select a chosen tag to remove it.</p>
                <div className={styles.suggestions} role="group" aria-label="Matching project tags">
                  {matches.map((tag) => <button key={tag} type="button" className={styles.suggestion} onClick={() => { setTags((current) => [...current, tag]); setQuery(""); }}>{tag} <span aria-hidden="true">+</span></button>)}
                  {!matches.length && <p className={styles.hint}>No matching tags. Try another search.</p>}
                </div>
                <p className={styles.hint} role="status">{tags.length} project tags selected</p>
              </fieldset>
              <div className={styles.actions}>
                <button type="button" className="btn btn-glass" disabled={busy} onClick={() => goTo(1)}>Back</button>
                <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void createAccount(false)}>{busy ? "Creating your Hi5…" : "Create my Hi5"}</button>
              </div>
              <button type="button" className={styles.skip} disabled={busy} onClick={() => void createAccount(true)}>Skip for now</button>
              {busy && <p className={styles.hint} role="status">Setting up your account. Please wait.</p>}
            </>}
          </>
        )}
      </section>
      <p className={styles.footer}>Meet 5 people worth saying Hi to.</p>
    </main>
  );
}
