import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

export default function DonateSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-20 max-w-lg text-center">
      <Card>
        <CardContent className="pt-8 pb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Thank You!</h1>
          <p className="text-muted-foreground mb-6">
            Your donation has been received. Hare Krishna! Your generosity helps
            maintain the temple and support its services to the community.
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
            <Link href="/temples">
              <Button>Browse Temples</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
