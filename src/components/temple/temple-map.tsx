import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Map } from "lucide-react";
import type { Temple } from "@/types";

export function TempleMap({ temple }: { temple: Temple }) {
  if (!temple.lat || !temple.lng) return null;

  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${temple.lng - 0.01},${temple.lat - 0.01},${temple.lng + 0.01},${temple.lat + 0.01}&layer=mapnik&marker=${temple.lat},${temple.lng}`;
  const linkUrl = `https://www.openstreetmap.org/?mlat=${temple.lat}&mlon=${temple.lng}#map=15/${temple.lat}/${temple.lng}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Map className="h-5 w-5" />
          Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video rounded-md overflow-hidden">
          <iframe
            width="100%"
            height="100%"
            src={mapUrl}
            style={{ border: 0 }}
            loading="lazy"
            title={`Map of ${temple.name}`}
          />
        </div>
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-primary hover:underline mt-2 inline-block"
        >
          View larger map
        </a>
      </CardContent>
    </Card>
  );
}
