type Props = {
  label?: string;
};

export default function PageLoading({ label = "Loading…" }: Props) {
  return (
    <div className="page-loading" role="status" aria-live="polite" aria-busy="true">
      {label}
    </div>
  );
}
