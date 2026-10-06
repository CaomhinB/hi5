import type { Metadata } from "next";
import { SignupFlow } from "./SignupFlow";

export const metadata: Metadata = {
  title: "Create your Hi5",
  description: "Tell us what interests you and meet people worth saying Hi to.",
};

export default function SignupPage() {
  return <SignupFlow />;
}
