import { Badge } from "@/components/ui/badge";
import type { Temple } from "@/types";

export function TempleHeader({ temple }: { temple: Temple }) {
  return (
    <div className="relative">
      <div className="aspect-[3/1] md:aspect-[4/1] bg-muted relative overflow-hidden">
        {temple.cover_image ? (
          <img
            src={temple.cover_image}
            alt={temple.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div className="container mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              {temple.name}
            </h1>
            {temple.deity_names && (
              <p className="text-white/80 text-lg">{temple.deity_names}</p>
            )}
            <div className="flex gap-2 mt-3">
              {temple.is_claimed && <Badge variant="secondary">Verified</Badge>}
              {temple.country && <Badge variant="outline" className="text-white border-white/30">{temple.country}</Badge>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
