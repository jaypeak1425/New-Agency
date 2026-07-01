import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ maxWidth: 480, margin: "4rem auto", fontFamily: "sans-serif" }}>
      <h1>Page not found</h1>
      <p>
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}
