import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col">
      <header className="flex justify-center px-4 pt-6 pb-2">
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-foreground no-underline hover:underline"
        >
          Anand ID
        </Link>
      </header>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
