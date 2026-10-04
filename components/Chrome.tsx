import Link from "next/link";

export function Nav({ right }: { right?: React.ReactNode }) {
  return (
    <nav className="nav">
      <Link href="/" className="brand">THE IDENTITY RESET</Link>
      {right ?? (
        <Link href="/reset" className="link">My Reset</Link>
      )}
    </nav>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <span className="three">WAKE. RESET. BECOME.</span>
      <span>
        <a href="https://instagram.com/jac_lavoiee">@jac_lavoiee</a> · theidentityreset.com
      </span>
    </footer>
  );
}

/** Plain form post: works without JavaScript and survives ad-blockers. */
export function CheckoutButton({ label = "Unlock THE IDENTITY RESET — $25" }: { label?: string }) {
  return (
    <form action="/api/checkout" method="post">
      <button className="btn" type="submit">{label}</button>
    </form>
  );
}
