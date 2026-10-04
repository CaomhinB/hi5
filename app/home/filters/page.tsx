import type { Metadata } from "next";
import { FiltersPanel } from "./FiltersPanel";
import { getFilterReturnPath } from "./returnPath";

export const metadata: Metadata = { title: "Filters | Hi5" };

export default async function FiltersPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[] }>;
}) {
  const { from } = await searchParams;
  return <FiltersPanel returnTo={getFilterReturnPath(typeof from === "string" ? from : undefined)} />;
}
