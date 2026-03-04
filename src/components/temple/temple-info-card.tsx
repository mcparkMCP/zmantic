import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Globe } from "lucide-react";
import type { Temple } from "@/types";

export function TempleInfoCard({ temple }: { temple: Temple }) {
  const address = [temple.address, temple.city, temple.state, temple.postal_code, temple.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Contact & Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {address && (
          <div className="flex gap-3">
            <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <span className="text-sm">{address}</span>
          </div>
        )}
        {temple.phone && (
          <div className="flex gap-3">
            <Phone className="h-5 w-5 text-muted-foreground shrink-0" />
            <a href={`tel:${temple.phone}`} className="text-sm hover:underline">
              {temple.phone}
            </a>
          </div>
        )}
        {temple.email && (
          <div className="flex gap-3">
            <Mail className="h-5 w-5 text-muted-foreground shrink-0" />
            <a href={`mailto:${temple.email}`} className="text-sm hover:underline">
              {temple.email}
            </a>
          </div>
        )}
        {temple.website && (
          <div className="flex gap-3">
            <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
            <a
              href={temple.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm hover:underline truncate"
            >
              {temple.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
