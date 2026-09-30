import Image from "next/image";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Image
        src="/logo.png"
        alt="Hi5"
        width={420}
        height={420}
        priority
        className="-my-16 mix-blend-multiply"
      />
      <p className="text-lg font-medium text-foreground">
        Meet 5 people worth saying Hi to
      </p>
    </main>
  );
}
