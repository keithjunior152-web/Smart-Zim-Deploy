import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";
import { MetaTags } from "@/components/MetaTags";

const UPDATED = "4 June 2026";
const CONTACT_EMAIL = "keithkungwara@gmail.com";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-lg font-bold text-foreground">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </section>
  );
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Terms of Service — SmartZim"
        description="Read SmartZim's terms of service governing your use of our ZIMSEC and Cambridge exam preparation platform, AI tutor, and educational resources in Zimbabwe."
        canonical="/terms"
      />
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span className="font-bold">Terms of Service</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-7">
        <div>
          <h1 className="text-2xl font-black text-foreground">SmartZim Terms of Service</h1>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Acceptance of these terms">
          <p>
            By creating an account or using SmartZim, you agree to these Terms of Service and to our
            Privacy Policy. If you do not agree, please do not use the service.
          </p>
        </Section>

        <Section title="2. Who can use SmartZim">
          <p>
            SmartZim is intended for students, teachers, parents and schools. If you are below the
            age of digital consent in your country, you may use SmartZim only with the permission and
            supervision of a parent, guardian or school.
          </p>
        </Section>

        <Section title="3. Your account">
          <ul className="list-disc pl-5 space-y-1">
            <li>You are responsible for the accuracy of the information you provide and for keeping your password secure.</li>
            <li>You are responsible for activity that happens under your account.</li>
            <li>Some accounts require approval before access is granted.</li>
          </ul>
        </Section>

        <Section title="4. Acceptable use">
          <p>You agree not to:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Use SmartZim for cheating in a way that violates your school's or examination board's rules.</li>
            <li>Upload or share unlawful, harmful, abusive or infringing content.</li>
            <li>Attempt to disrupt, reverse-engineer or gain unauthorised access to the service or other users' data.</li>
            <li>Misuse the AI tutor or messaging features to harass others.</li>
          </ul>
        </Section>

        <Section title="5. The AI tutor">
          <p>
            The ZimTutor AI tutor is provided to support your learning. AI responses may sometimes be
            incomplete or incorrect, so you should always verify important information against your
            official curriculum and teachers. The AI tutor is not a substitute for professional or
            academic advice.
          </p>
        </Section>

        <Section title="6. Subscriptions & payments">
          <p>
            Some features may require a subscription or registration fee. Pricing and any free-trial
            terms are shown in the app. Where payments are not yet enabled, related features may be
            limited or marked as "coming soon".
          </p>
        </Section>

        <Section title="7. Content ownership">
          <p>
            You retain ownership of the content you create. By uploading content, you grant SmartZim
            the limited rights needed to store and display it to operate the service. Course
            materials and the SmartZim brand remain the property of SmartZim and its licensors.
          </p>
        </Section>

        <Section title="8. Ending your use">
          <p>
            You may stop using SmartZim and delete your account at any time from{" "}
            <strong>Profile → Delete Account</strong>. We may suspend or terminate accounts that
            breach these terms.
          </p>
        </Section>

        <Section title="9. Disclaimers & liability">
          <p>
            SmartZim is provided "as is" without warranties of any kind. To the maximum extent
            permitted by law, SmartZim is not liable for any indirect or consequential loss arising
            from your use of the service.
          </p>
        </Section>

        <Section title="10. Changes & contact">
          <p>
            We may update these terms from time to time and will update the "Last updated" date
            above. For any questions, contact us at{" "}
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <div className="pt-2 flex gap-3 text-sm">
          <Link href="/privacy"><span className="text-primary underline">Privacy Policy</span></Link>
          <Link href="/"><span className="text-primary underline">Back to home</span></Link>
        </div>

        <footer className="pt-6 border-t text-center text-xs text-muted-foreground">
          SmartZim — Powered by Keith Kungwara · © 2025
        </footer>
      </main>
    </div>
  );
}
