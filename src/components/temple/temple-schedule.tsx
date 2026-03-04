import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import type { Schedule } from "@/types";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function formatTime(time: string) {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function TempleSchedule({ schedules }: { schedules: Schedule[] }) {
  if (!schedules.length) return null;

  const daily = schedules.filter((s) => s.day_of_week === null);
  const byDay = schedules.filter((s) => s.day_of_week !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Daily Schedule
        </CardTitle>
      </CardHeader>
      <CardContent>
        {daily.length > 0 && (
          <div className="space-y-3">
            {daily
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((s) => (
                <div key={s.id} className="flex justify-between items-center">
                  <span className="text-sm font-medium">{s.title}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(s.start_time)}
                    {s.end_time && ` - ${formatTime(s.end_time)}`}
                  </span>
                </div>
              ))}
          </div>
        )}
        {byDay.length > 0 && (
          <div className="mt-4 pt-4 border-t space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground">Special Schedule</h4>
            {byDay
              .sort((a, b) => (a.day_of_week ?? 0) - (b.day_of_week ?? 0) || a.sort_order - b.sort_order)
              .map((s) => (
                <div key={s.id} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">{s.title}</span>
                    {s.day_of_week !== null && (
                      <span className="text-xs text-muted-foreground ml-2">
                        ({DAY_NAMES[s.day_of_week]})
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {formatTime(s.start_time)}
                    {s.end_time && ` - ${formatTime(s.end_time)}`}
                  </span>
                </div>
              ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
