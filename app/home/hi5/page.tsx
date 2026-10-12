import type { Metadata } from "next";
import { Hi5Experience } from "./Hi5Experience";

export const metadata: Metadata = { title: "Your Hi5 | Hi5" };

export default function Hi5Page() {
  return <Hi5Experience />;
}
