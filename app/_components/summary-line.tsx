interface SummaryLineProps {
  label: string;
  value: string;
}

export function SummaryLine({ label, value }: SummaryLineProps) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-[#6f675e]">{label}</span>
      <strong className="text-right">{value}</strong>
    </div>
  );
}
