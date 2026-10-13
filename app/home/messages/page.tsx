import type { Metadata } from "next";
import { MessagesExperience } from "./MessagesExperience";

export const metadata: Metadata = { title: "Messages | Hi5" };

export default function MessagesPage() {
  return <MessagesExperience />;
}
