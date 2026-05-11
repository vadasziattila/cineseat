import type { HTMLInputTypeAttribute } from "react";

interface TextInputProps {
  label: string;
  onChange: (value: string) => void;
  type?: HTMLInputTypeAttribute;
  value: string;
}

export function TextInput({ label, onChange, type = "text", value }: TextInputProps) {
  return (
    <label className="grid gap-2 text-sm font-bold">
      {label}
      <input
        className="h-11 border border-[#171512]/20 bg-white px-3 font-normal outline-none transition focus:border-[#171512]"
        onChange={(event) => onChange(event.target.value)}
        required
        type={type}
        value={value}
      />
    </label>
  );
}
