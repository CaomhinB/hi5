import type { Metadata } from "next";
import { MeetPanel } from "./MeetPanel";
import { getMeetReturnPath } from "./returnPath";

export const metadata: Metadata = { title: "Meet | Hi5" };

export default async function MeetPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { from } = await searchParams;
  return <MeetPanel returnTo={getMeetReturnPath(typeof from === "string" ? from : undefined)} />;
}
