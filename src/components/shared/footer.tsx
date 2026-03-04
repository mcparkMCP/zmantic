import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-bold text-lg mb-2">TempleTools</h3>
            <p className="text-sm text-muted-foreground">
              Free website platform for ISKCON temples worldwide. Every temple
              deserves a web presence.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-2">Links</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/temples" className="hover:text-foreground">
                  Browse Temples
                </Link>
              </li>
              <li>
                <Link href="/auth/signup" className="hover:text-foreground">
                  Claim Your Temple
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-2">For Temple Admins</h4>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>
                <Link href="/auth/login" className="hover:text-foreground">
                  Admin Login
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-8 pt-4 border-t text-center text-sm text-muted-foreground">
          Built with care for the Hare Krishna community.
        </div>
      </div>
    </footer>
  );
}
