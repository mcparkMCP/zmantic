import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Calendar, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { TempleCard } from "@/components/temple/temple-card";

export const revalidate = 60;

export default async function HomePage() {
  const supabase = await createClient();

  const { data: temples, count } = await supabase
    .from("temples")
    .select("*", { count: "exact" })
    .eq("is_published", true)
    .order("name")
    .limit(6);

  const { count: countryCount } = await supabase
    .from("temples")
    .select("country", { count: "exact", head: true })
    .eq("is_published", true);

  return (
    <div>
      {/* Hero */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Every ISKCON Temple
            <br />
            <span className="text-primary">Deserves a Website</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Free website platform for 700+ ISKCON temples worldwide. Find
            schedules, events, and support your local temple.
          </p>

          {/* Search */}
          <form action="/temples" method="GET" className="max-w-lg mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  placeholder="Search temples by name or city..."
                  className="pl-10 h-12"
                />
              </div>
              <Button type="submit" size="lg">
                Search
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold">{count ?? 0}+</div>
              <div className="text-sm text-muted-foreground">Temples Listed</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{countryCount ?? 0}+</div>
              <div className="text-sm text-muted-foreground">Countries</div>
            </div>
            <div>
              <div className="text-3xl font-bold">Free</div>
              <div className="text-sm text-muted-foreground">For All Temples</div>
            </div>
            <div>
              <div className="text-3xl font-bold">24/7</div>
              <div className="text-sm text-muted-foreground">Online Presence</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything a Temple Needs Online
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6">
                <MapPin className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">Temple Directory</h3>
                <p className="text-muted-foreground text-sm">
                  Every ISKCON temple gets a dedicated page with address,
                  contact info, map, and photos.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Calendar className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Schedules & Events
                </h3>
                <p className="text-muted-foreground text-sm">
                  Daily darshan and arati times, plus upcoming festivals and
                  special events.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <Heart className="h-10 w-10 text-primary mb-4" />
                <h3 className="font-semibold text-lg mb-2">
                  Online Donations
                </h3>
                <p className="text-muted-foreground text-sm">
                  Secure Stripe checkout for devotees to support temples from
                  anywhere in the world.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Temples */}
      {temples && temples.length > 0 && (
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold">Featured Temples</h2>
              <Link href="/temples">
                <Button variant="outline">View All</Button>
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {temples.map((temple) => (
                <TempleCard key={temple.id} temple={temple} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-20 text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">
            Are You a Temple Administrator?
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto mb-8">
            Claim your temple&apos;s page and start managing your online
            presence. Update schedules, add events, and accept donations — all
            for free.
          </p>
          <Link href="/auth/signup">
            <Button size="lg">Claim Your Temple</Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
