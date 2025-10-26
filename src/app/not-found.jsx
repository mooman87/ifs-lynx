import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ padding: 32 }}>
      <h1>Page not found</h1>
      <p>Sorry, we couldn’t find that page.</p>
      <p><Link href="/">Go back home</Link></p>
    </main>
  );
}
