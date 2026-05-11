interface MetricProps {
  label: string;
  value: number;
}

export function Metric({ label, value }: MetricProps) {
  return (
    <div className="border-t border-[#171512]/15 pt-3">
      <p className="text-2xl font-black">{value}</p>
      <p className="text-xs uppercase tracking-[0.18em] text-[#6f675e]">{label}</p>
    </div>
  );
}
