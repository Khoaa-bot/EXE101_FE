export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  colorClass: string;
};

export function evaluatePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: "", colorClass: "bg-outline-variant" };

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const clamped = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;
  const levels: Record<number, { label: string; colorClass: string }> = {
    0: { label: "Rất yếu", colorClass: "bg-error" },
    1: { label: "Yếu", colorClass: "bg-error" },
    2: { label: "Trung bình", colorClass: "bg-secondary" },
    3: { label: "Mạnh", colorClass: "bg-tertiary" },
    4: { label: "Rất mạnh", colorClass: "bg-tertiary" },
  };
  return { score: clamped, ...levels[clamped] };
}
