import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";
import type { Temple } from "@/types";

export function TempleCard({ temple }: { temple: Temple }) {
  const location = [temple.city, temple.country].filter(Boolean).join(", ");

  return (
    <Link href={`/${temple.slug}`}>
      <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
        <div className="aspect-video bg-muted relative">
          {temple.cover_image ? (
            <img
              src={temple.cover_image}
              alt={temple.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
              <span className="text-4xl font-bold text-primary/20">
                {temple.name.charAt(0)}
              </span>
            </div>
          )}
          {temple.is_claimed && (
            <Badge className="absolute top-2 right-2" variant="secondary">
              Claimed
            </Badge>
          )}
        </div>
        <CardContent className="pt-4">
          <h3 className="font-semibold text-lg line-clamp-1">{temple.name}</h3>
          {location && (
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {location}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
