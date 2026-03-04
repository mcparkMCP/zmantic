import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart } from "lucide-react";
import type { Temple } from "@/types";

export function TempleDonateButton({ temple }: { temple: Temple }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-6 text-center">
        <Heart className="h-8 w-8 text-primary mx-auto mb-3" />
        <h3 className="font-semibold mb-2">Support This Temple</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Your donation helps maintain the temple and its services.
        </p>
        <Link href={`/donate/${temple.slug}`}>
          <Button className="w-full" size="lg">
            Donate Now
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
