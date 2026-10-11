type Props = {
  busy: boolean;
  status: string;
  jobId: number | null;
  error?: boolean;
};

export default function UploadJobStatus({
  busy,
  status,
  jobId,
  error = false,
}: Props) {
  if (!status) return null;
console.log(jobId)
  return (
    <section
      className={`upload-job-status ${error ? "upload-job-status--error" : "upload-job-status--loading"}`}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      aria-busy={busy ? "true" : "false"}
    >
      {!error && <div className="upload-job-status__spinner" aria-hidden="true" />}

      <div className="upload-job-status__content">
        <div className="upload-job-status__title">
          {error ? "Something went wrong" : "Working on your diagram"}
        </div>

        <div className="upload-job-status__message">
          {status}
          
        </div>
      </div>
    </section>
  );
}