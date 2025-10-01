import React from "react";

type ProgressBarProps = {
  color: string;
  value: number;
  maxValue: number;
  changeValue: React.Dispatch<React.SetStateAction<string>>;
};

export default function ProgressBar({}: ProgressBarProps) {
  return (
    <div>
      <span />
    </div>
  );
}
