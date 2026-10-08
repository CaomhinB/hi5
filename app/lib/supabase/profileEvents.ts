export const PROFILE_CHANGED_EVENT = "hi5:profile-changed";

export function notifyProfileChanged(authUserId: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(PROFILE_CHANGED_EVENT, { detail: { authUserId } }));
  }
}
