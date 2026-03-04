import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
      <h2 className="text-2xl font-bold mb-2">Page Not Found</h2>
      <p className="text-muted-foreground mb-8">
        The temple or page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/">
          <Button>Go Home</Button>
        </Link>
        <Link href="/temples">
          <Button variant="outline">Browse Temples</Button>
        </Link>
      </div>
    </div>
  );
}
