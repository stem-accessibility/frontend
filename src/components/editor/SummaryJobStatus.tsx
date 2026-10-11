type Props = {
  isGenerating: boolean;
  jobId: number | null;
  error: string;
};

export default function SummaryJobStatus({
  isGenerating,
  jobId,
  error,
}: Props) {

    console.log(jobId);
  if (!isGenerating && !error) return null;

  if (error) {
    return (
      <section
        className="job-status-banner job-status-banner--error"
        role="alert"
        aria-live="assertive"
      >
        <div className="job-status-banner__content">
          <div className="job-status-banner__title">Summary generation failed</div>
          <div className="job-status-banner__message">{error}</div>
        </div>
      </section>
    );
  }

  return (
    <section
      className="job-status-banner job-status-banner--loading"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="job-status-banner__spinner" aria-hidden="true" />
      <div className="job-status-banner__content">
        <div className="job-status-banner__title">Generating accessibility summary</div>
        <div className="job-status-banner__message">
          Updating the short alt text and long description...
        </div>
      </div>
    </section>
  );
}