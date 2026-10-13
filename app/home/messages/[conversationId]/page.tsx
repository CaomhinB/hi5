import type { Metadata } from "next";
import { MessagesExperience } from "../MessagesExperience";

export const metadata: Metadata = { title: "Conversation | Hi5" };

export default async function ConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = await params;
  return <MessagesExperience conversationId={conversationId} />;
}
