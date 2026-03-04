"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Heart, Loader2 } from "lucide-react";

const PRESET_AMOUNTS = [11, 21, 51, 108, 251, 501];

export default function DonatePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [amount, setAmount] = useState<number>(21);
  const [customAmount, setCustomAmount] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const effectiveAmount = customAmount ? parseInt(customAmount) : amount;

  async function handleDonate(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveAmount || effectiveAmount < 1) return;

    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          temple_slug: slug,
          amount_cents: effectiveAmount * 100,
          currency: "usd",
          donor_email: email || undefined,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <Card>
        <CardHeader className="text-center">
          <Heart className="h-10 w-10 text-primary mx-auto mb-2" />
          <CardTitle className="text-2xl">Donate to Temple</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Your generous contribution helps maintain the temple and its services.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleDonate} className="space-y-6">
            {/* Preset amounts */}
            <div>
              <Label className="mb-3 block">Select Amount (USD)</Label>
              <div className="grid grid-cols-3 gap-2">
                {PRESET_AMOUNTS.map((a) => (
                  <Button
                    key={a}
                    type="button"
                    variant={amount === a && !customAmount ? "default" : "outline"}
                    onClick={() => {
                      setAmount(a);
                      setCustomAmount("");
                    }}
                  >
                    ${a}
                  </Button>
                ))}
              </div>
            </div>

            {/* Custom amount */}
            <div>
              <Label htmlFor="custom">Or enter custom amount</Label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="custom"
                  type="number"
                  min="1"
                  placeholder="0"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">Email (optional, for receipt)</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={loading || !effectiveAmount || effectiveAmount < 1}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Heart className="h-4 w-4 mr-2" />
              )}
              Donate ${effectiveAmount || 0}
            </Button>

            <p className="text-xs text-center text-muted-foreground">
              Payments are securely processed via Stripe. You will be redirected
              to complete the payment.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
