import { CheckCircle2 } from 'lucide-react';

interface AdminSelectionMarkProps {
  active: boolean;
}

export default function AdminSelectionMark({ active }: AdminSelectionMarkProps) {
  if (active) {
    return <CheckCircle2 size={17} />;
  }

  return (
    <span className="h-4 w-4 rounded-full border border-slate-800 bg-white" />
  );
}
