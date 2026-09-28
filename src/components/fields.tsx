export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const controlClass =
  "w-full rounded-md border border-line bg-paper px-3 py-2 text-ink outline-none focus:border-red";

export function PrimaryButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-md bg-red px-4 py-2 text-sm whitespace-nowrap text-white disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function QuietButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="rounded-md px-3 py-2 text-sm text-ink underline-offset-4 hover:underline disabled:opacity-60"
    >
      {children}
    </button>
  );
}

export function Notice({ error, saved }: { error: string; saved: string }) {
  if (!error && !saved) return null;
  return (
    <p className={error ? "text-sm text-red" : "text-sm text-ink"}>{error || saved}</p>
  );
}
