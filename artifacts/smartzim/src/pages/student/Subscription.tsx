import { useAuth } from "@/lib/auth";
import {
  useCreateCheckout,
  useGetPaymentSettings,
  useListMySubscriptions,
  getGetCurrentUserQueryKey,
  getListMySubscriptionsQueryKey,
} from "@workspace/api-client-react";
import { useUpload } from "@workspace/object-storage-web";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CreditCard, Check, Clock, Smartphone, Banknote, Copy, CheckCircle2, Zap, Loader2,
  Upload, ImageIcon, AlertCircle, Hourglass, X, Globe,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

type Plan = "registration" | "monthly" | "yearly" | "school";

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID as string | undefined;

export default function Subscription() {
  const { user } = useAuth();
  const checkout = useCreateCheckout();
  const qc = useQueryClient();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const { data: settings } = useGetPaymentSettings();
  const { data: mySubs } = useListMySubscriptions();

  const ecocash  = settings?.ecocashNumber?.trim()  || "Not set yet";
  const innbucks = settings?.innbucksNumber?.trim() || "Not set yet";
  const onemoney = settings?.onemoneyNumber?.trim() || "";
  const whatsapp = settings?.whatsappNumber?.trim() || "";

  const [plan, setPlan] = useState<Plan>("monthly");
  const [senderPhone, setSenderPhone] = useState("");
  const [reference, setReference]     = useState("");
  const [proofUrl, setProofUrl]       = useState<string | null>(null);
  const { uploadFile, isUploading }   = useUpload();

  const refreshAll = () => {
    qc.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
    qc.invalidateQueries({ queryKey: getListMySubscriptionsQueryKey() });
  };

  // Handle return from Stripe Checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("payment") === "success") {
      toast.success("Payment confirmed! Your subscription is now active. 🎉");
      refreshAll();
      window.history.replaceState({}, "", window.location.pathname);
    } else if (params.get("payment") === "cancelled") {
      toast.info("Payment cancelled — you can try again any time.");
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const trialMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/subscriptions/trial", { method: "POST", credentials: "include" });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? "Failed to start trial");
      }
      return res.json();
    },
    onSuccess: () => { toast.success("Your 7-day free trial has started! Enjoy SmartZim."); refreshAll(); },
    onError: (err: Error) => toast.error(err.message),
  });

  const stripeMutation = useMutation({
    mutationFn: async (selectedPlan: Plan) => {
      const res = await fetch("/api/payments/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: selectedPlan }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) throw new Error(data.error ?? "Could not start checkout");
      window.location.href = data.url;
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!user) return null;

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please upload an image of your payment confirmation."); return; }
    const res = await uploadFile(file);
    if (res) { setProofUrl(`/api/storage${res.objectPath}`); toast.success("Screenshot attached."); }
    else toast.error("Upload failed. Please try again.");
  };

  const submitPayment = () => {
    if (!proofUrl) { toast.error("Please attach a screenshot of your payment first."); return; }
    checkout.mutate(
      { data: { plan, paymentMethod: "manual", proofUrl, paymentReference: reference, senderPhone } },
      {
        onSuccess: () => {
          toast.success("Payment submitted! An admin will verify it shortly.");
          setProofUrl(null); setReference(""); setSenderPhone("");
          refreshAll();
        },
        onError: () => toast.error("Could not submit payment. Please try again."),
      },
    );
  };

  const expiry    = user.subscriptionExpiry ? format(new Date(user.subscriptionExpiry), "PPP") : null;
  const trialEnd  = user.trialStartDate ? format(new Date(new Date(user.trialStartDate).getTime() + 7 * 86400 * 1000), "PPP") : null;
  const hasTrialEver = (mySubs ?? []).some((s) => s.plan === "trial");
  const pending      = (mySubs ?? []).find((s) => s.status === "pending");
  const lastRejected = (mySubs ?? []).find((s) => s.status === "rejected");
  const isActive     = user.subscriptionStatus === "active";

  const planLabel = plan === "school" ? "School" : plan === "yearly" ? "Yearly" : "Monthly";
  const planPrice = plan === "school" ? "$50" : plan === "yearly" ? "$20" : "$2";

  return (
    <div className="space-y-6 pb-20 md:pb-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold">Subscription</h1>
        <p className="text-muted-foreground mt-1">Manage your SmartZim membership.</p>
      </motion.div>

      {/* Current plan */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader><CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" />Current plan</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge className="capitalize">{user.subscriptionStatus ?? "No active plan"}</Badge>
            {user.subscriptionStatus === "trial" && trialEnd && <span className="text-sm text-muted-foreground"><Clock className="h-3 w-3 inline mr-1" />Trial ends {trialEnd}</span>}
            {isActive && expiry && <span className="text-sm text-muted-foreground">Expires {expiry}</span>}
          </div>
          <p className="text-sm text-muted-foreground">7-day free trial, then $4 registration + $2/month for unlimited access to notes, papers, the AI tutor and more.</p>
          {!hasTrialEver && !isActive && (
            <Button className="mt-2" onClick={() => trialMutation.mutate()} disabled={trialMutation.isPending}>
              {trialMutation.isPending
                ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Starting trial…</>
                : <><Zap className="h-4 w-4 mr-2" />Start 7-Day Free Trial</>}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Pending review banner */}
      {pending && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <CardContent className="py-4 flex items-start gap-3">
            <Hourglass className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">Payment under review</p>
              <p className="text-amber-700 dark:text-amber-400">We received your <span className="capitalize">{pending.plan}</span> payment proof and an admin is verifying it.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rejected banner */}
      {!pending && lastRejected && !isActive && (
        <Card className="border-red-300 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
          <CardContent className="py-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 dark:text-red-300">Your last payment could not be verified</p>
              <p className="text-red-700 dark:text-red-400">{lastRejected.rejectionReason ?? "Please re-submit a clear screenshot of your payment."}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <PlanCard name="Monthly" price="$2" period="per month" features={["Unlimited notes & past papers", "ZimTutor AI", "Mock exams", "Planner & syllabus", "Daily Quiz"]} active={plan === "monthly"} onSelect={() => setPlan("monthly")} />
        <PlanCard name="Yearly" price="$20" period="per year" highlight features={["Everything in Monthly", "2 months free", "Note summariser", "Priority support"]} active={plan === "yearly"} onSelect={() => setPlan("yearly")} />
        <PlanCard name="School" price="$50" period="per month" features={["For schools & institutions", "Unlimited students", "Teacher tools", "Admin dashboard"]} active={plan === "school"} onSelect={() => setPlan("school")} />
      </div>

      {/* ── Online payment (Stripe + PayPal) ── */}
      {!isActive && !pending && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Globe className="h-5 w-5" />
              Pay Online — Instant Activation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              Pay with an international card or PayPal. Your account is activated immediately — no admin approval needed.
            </p>
            <div className="flex items-center gap-2 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-sm font-medium text-blue-800 dark:text-blue-300">
              <Check className="h-4 w-4 flex-shrink-0" />
              Selected: <span className="font-bold">{planLabel} plan — {planPrice}</span>
            </div>

            {/* Stripe */}
            <Button
              className="w-full bg-[#635bff] hover:bg-[#5147e5] text-white font-semibold h-12 text-base"
              onClick={() => stripeMutation.mutate(plan)}
              disabled={stripeMutation.isPending}
            >
              {stripeMutation.isPending
                ? <><Loader2 className="h-5 w-5 animate-spin mr-2" />Redirecting to Stripe…</>
                : <><CreditCard className="h-5 w-5 mr-2" />Pay {planPrice} with Card (Stripe)</>}
            </Button>

            {/* PayPal */}
            {PAYPAL_CLIENT_ID ? (
              <div>
                <p className="text-xs text-center text-muted-foreground mb-2">or</p>
                <PayPalScriptProvider
                  options={{
                    clientId: PAYPAL_CLIENT_ID,
                    currency: "USD",
                    intent: "capture",
                  }}
                >
                  <PayPalButtons
                    style={{ layout: "horizontal", color: "gold", shape: "rect", label: "pay", height: 48 }}
                    createOrder={async () => {
                      const res = await fetch("/api/payments/paypal/create-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        credentials: "include",
                        body: JSON.stringify({ plan }),
                      });
                      const data = (await res.json()) as { orderId?: string; error?: string };
                      if (!data.orderId) throw new Error(data.error ?? "PayPal order failed");
                      return data.orderId;
                    }}
                    onApprove={async (data) => {
                      const res = await fetch(`/api/payments/paypal/capture-order/${data.orderID}`, {
                        method: "POST",
                        credentials: "include",
                      });
                      if (!res.ok) {
                        const err = (await res.json().catch(() => ({}))) as { error?: string };
                        toast.error(err.error ?? "PayPal capture failed");
                        return;
                      }
                      toast.success("PayPal payment confirmed! Your subscription is now active. 🎉");
                      refreshAll();
                    }}
                    onError={() => toast.error("PayPal encountered an error. Please try again.")}
                    onCancel={() => toast.info("PayPal payment cancelled.")}
                  />
                </PayPalScriptProvider>
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground text-center">
              Powered by Stripe &amp; PayPal · Secured with SSL · No card data stored on our servers
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Mobile Money (manual) ── */}
      <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-400">
            <Smartphone className="h-5 w-5" />
            Pay with Mobile Money
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-green-700 dark:text-green-400">Send your payment to one of the numbers below, then upload your confirmation screenshot below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <PayNumber label="EcoCash"  tag="ECO" tagBg="bg-green-600" hint="Dial *151#"     number={ecocash}  fieldKey="eco" copiedField={copiedField} onCopy={copy} />
            <PayNumber label="InnBucks" tag="INN" tagBg="bg-blue-600"  hint="App or USSD"   number={innbucks} fieldKey="inn" copiedField={copiedField} onCopy={copy} />
            {onemoney && <PayNumber label="OneMoney" tag="ONE" tagBg="bg-red-600" hint="Dial *111#" number={onemoney} fieldKey="one" copiedField={copiedField} onCopy={copy} />}
          </div>
          {whatsapp && (
            <div className="flex items-start gap-3 p-3 bg-white/60 dark:bg-black/20 rounded-lg text-sm">
              <Banknote className="h-5 w-5 text-green-700 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">Need help?</p>
                <p className="text-muted-foreground">Message us on WhatsApp <span className="font-mono font-medium">{whatsapp}</span>.</p>
              </div>
            </div>
          )}
          {settings?.instructions?.trim() && (
            <p className="text-xs text-muted-foreground whitespace-pre-line">{settings.instructions}</p>
          )}
        </CardContent>
      </Card>

      {/* Upload proof */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Send your mobile money proof</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pending ? (
            <p className="text-sm text-muted-foreground">You already have a payment awaiting review. We'll notify you once it's verified.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="senderPhone">Phone you paid from</Label>
                  <Input id="senderPhone" placeholder="e.g. 0771234567" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="reference">Reference / your name</Label>
                  <Input id="reference" placeholder="e.g. Tendai M — SmartZim" value={reference} onChange={(e) => setReference(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Payment screenshot</Label>
                {proofUrl ? (
                  <div className="relative inline-block">
                    <img src={proofUrl} alt="Payment proof" className="max-h-48 rounded-lg border" />
                    <button type="button" onClick={() => setProofUrl(null)} className="absolute -top-2 -right-2 bg-background border rounded-full p-1 shadow hover:bg-muted" aria-label="Remove screenshot">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-xl p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                    {isUploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImageIcon className="h-6 w-6 text-muted-foreground" />}
                    <span className="text-sm text-muted-foreground">{isUploading ? "Uploading…" : "Tap to upload your payment screenshot"}</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => onPickFile(e.target.files?.[0])} disabled={isUploading} />
                  </label>
                )}
              </div>
              <Button className="w-full" onClick={submitPayment} disabled={checkout.isPending || isUploading || !proofUrl}>
                {checkout.isPending
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting…</>
                  : <>Submit payment for {planLabel} plan</>}
              </Button>
              <p className="text-xs text-muted-foreground text-center">An admin will verify your payment and unlock your account, usually within 24 hours.</p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PayNumber({ label, tag, tagBg, hint, number, fieldKey, copiedField, onCopy }: {
  label: string; tag: string; tagBg: string; hint: string; number: string;
  fieldKey: string; copiedField: string | null; onCopy: (t: string, f: string) => void;
}) {
  return (
    <div className="rounded-xl border border-green-200 dark:border-green-700 bg-white dark:bg-green-900/20 p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className={`w-10 h-10 rounded-lg ${tagBg} flex items-center justify-center`}>
          <span className="text-white font-bold text-xs">{tag}</span>
        </div>
        <div>
          <p className="font-bold text-sm">{label}</p>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Send to number:</p>
        <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-2">
          <span className="font-mono font-bold flex-1">{number}</span>
          <button onClick={() => onCopy(number, fieldKey)} className="text-muted-foreground hover:text-foreground transition-colors">
            {copiedField === fieldKey ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ name, price, period, features, onSelect, active, highlight }: {
  name: string; price: string; period: string; features: string[];
  onSelect: () => void; active?: boolean; highlight?: boolean;
}) {
  return (
    <Card className={active ? "border-primary border-2 ring-2 ring-primary/20" : highlight ? "border-primary/40 border-2" : ""}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">{name}{highlight && <Badge>Best value</Badge>}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div><span className="text-3xl font-bold">{price}</span> <span className="text-sm text-muted-foreground">{period}</span></div>
        <ul className="space-y-2 text-sm">{features.map(f => <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />{f}</li>)}</ul>
        <Button className="w-full" variant={active ? "default" : "outline"} onClick={onSelect}>
          {active ? <><CheckCircle2 className="h-4 w-4 mr-2" />Selected</> : "Select plan"}
        </Button>
      </CardContent>
    </Card>
  );
}
