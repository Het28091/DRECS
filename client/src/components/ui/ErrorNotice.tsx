import { Button } from './Button';
export function ErrorNotice({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div role="alert" className="rounded-xl border border-red-800 bg-red-950/30 p-3 text-sm text-red-300 flex flex-wrap items-center justify-between gap-3"><span>{message}</span>{onRetry && <Button variant="outline" onClick={onRetry}>Retry</Button>}</div>;
}
