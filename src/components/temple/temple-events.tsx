import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays } from "lucide-react";
import { format } from "date-fns";
import type { Event } from "@/types";

export function TempleEvents({ events }: { events: Event[] }) {
  if (!events.length) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CalendarDays className="h-5 w-5" />
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="flex gap-4">
              <div className="text-center shrink-0 w-14">
                <div className="text-2xl font-bold text-primary">
                  {format(new Date(event.start_date), "d")}
                </div>
                <div className="text-xs text-muted-foreground uppercase">
                  {format(new Date(event.start_date), "MMM")}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm">{event.title}</h4>
                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {event.description}
                  </p>
                )}
                {event.start_time && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {event.start_time}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
