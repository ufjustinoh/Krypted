const RULES = [
  { check: p => p.length >= 8, label: '8+ characters' },
  { check: p => /[A-Z]/.test(p), label: 'Uppercase' },
  { check: p => /[a-z]/.test(p), label: 'Lowercase' },
  { check: p => /\d/.test(p), label: 'Number' },
]

export default function PasswordStrength({ password }) {
  if (!password) return null
  return (
    <ul className="pw-rules">
      {RULES.map(({ check, label }) => {
        const pass = check(password)
        return (
          <li key={label} className={`pw-rule ${pass ? 'pw-rule-pass' : 'pw-rule-fail'}`}>
            {pass ? '✓' : '○'} {label}
          </li>
        )
      })}
    </ul>
  )
}
