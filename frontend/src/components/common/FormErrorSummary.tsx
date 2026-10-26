import { AlertCircle } from 'lucide-react';

export interface FormErrorSummaryProps {
  title?: string;
  message?: string | null;
  errors?: Array<string | undefined> | Record<string, string | undefined>;
  className?: string;
}

export default function FormErrorSummary({
  title,
  message,
  errors,
  className = '',
}: FormErrorSummaryProps) {
  const errorList: string[] = [];

  if (message) {
    errorList.push(message);
  }

  if (Array.isArray(errors)) {
    for (const err of errors) {
      if (err && !errorList.includes(err)) errorList.push(err);
    }
  } else if (errors && typeof errors === 'object') {
    for (const val of Object.values(errors)) {
      if (val && !errorList.includes(val)) errorList.push(val);
    }
  }

  if (errorList.length === 0 && !title) {
    return null;
  }

  return (
    <div
      role="alert"
      className={`p-3.5 rounded-xl bg-[var(--money-out)]/10 text-[var(--money-out)] border border-[var(--money-out)]/20 text-sm ${className}`}
    >
      <div className="flex items-start gap-2.5">
        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="space-y-1">
          {title && <p className="font-semibold text-foreground">{title}</p>}
          {errorList.length === 1 ? (
            <p className="font-medium">{errorList[0]}</p>
          ) : (
            <ul className="list-disc list-inside space-y-0.5 text-xs font-medium">
              {errorList.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
