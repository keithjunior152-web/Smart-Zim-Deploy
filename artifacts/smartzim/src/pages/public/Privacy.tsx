import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";
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

export default function Privacy() {
  return (
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Privacy Policy — SmartZim"
        description="Read SmartZim's privacy policy to understand how we collect, use and protect your personal data on our ZIMSEC and Cambridge exam preparation platform in Zimbabwe."
        canonical="/privacy"
      />
      <header className="sticky top-0 z-10 border-b bg-card/95 backdrop-blur px-4 py-3 flex items-center gap-3">
        <Link href="/">
          <Button variant="ghost" size="icon" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <span className="font-bold">Privacy Policy</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-8 space-y-7">
        <div>
          <h1 className="text-2xl font-black text-foreground">SmartZim Privacy Policy</h1>
          <p className="mt-1 text-xs text-muted-foreground">Last updated: {UPDATED}</p>
        </div>

        <Section title="1. Who we are">
          <p>
            SmartZim ("SmartZim", "we", "us") is a mobile-first learning service for students
            preparing for ZIMSEC and Cambridge examinations in Zimbabwe. SmartZim is operated by
            Keith Kungwara. If you have any questions about this policy, contact us at{" "}
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <Section title="2. Information we collect">
          <p>We collect only what we need to run the service:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account details</strong> — your name, email address, password (stored only as a secure hash), role (student, teacher, parent, school admin), and, where you provide them, your grade/form, school and phone number.</li>
            <li><strong>Learning content you create</strong> — messages you send to the ZimTutor AI tutor, assignment submissions, planner entries, bookmarks, and any files you upload.</li>
            <li><strong>Usage and progress data</strong> — quiz results, XP, streaks, focus sessions and similar gamification data used to show your progress.</li>
            <li><strong>Technical data</strong> — basic information needed to keep your session secure and the app working.</li>
          </ul>
        </Section>

        <Section title="3. How we use your information">
          <ul className="list-disc pl-5 space-y-1">
            <li>To provide and personalise your learning experience (tutoring, past papers, notes, assignments, planner and progress tracking).</li>
            <li>To create and secure your account and keep you signed in.</li>
            <li>To enable teacher, class and messaging features you choose to use.</li>
            <li>To process subscriptions and registration where applicable.</li>
            <li>To improve the reliability and safety of the service.</li>
          </ul>
          <p>We do <strong>not</strong> sell your personal information, and we do not show third-party advertising.</p>
        </Section>

        <Section title="4. The AI tutor">
          <p>
            When you use the ZimTutor AI tutor, the messages you send are processed by our
            AI provider, Anthropic, solely to generate a response for you. Please do not share
            sensitive personal information in tutor chats. Your tutor conversations are stored
            encrypted and are private to your account.
          </p>
        </Section>

        <Section title="5. How we share data">
          <p>We share information only with service providers that help us operate SmartZim, namely:</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Anthropic</strong> — to power AI tutoring responses.</li>
            <li><strong>Our hosting and storage providers</strong> — to run the app and store your data and uploaded files securely.</li>
          </ul>
          <p>We may also disclose information if required by law.</p>
        </Section>

        <Section title="6. Data security & retention">
          <p>
            Passwords are hashed and sensitive messages (AI tutor chats and private messages) are
            encrypted at rest. We keep your data for as long as your account is active. When you
            delete your account, your personal data is permanently removed (see section 8).
          </p>
        </Section>

        <Section title="7. Children's privacy">
          <p>
            SmartZim is an educational service often used by school-age learners. If you are under
            the age of digital consent in your country, please use SmartZim only with the
            involvement and permission of a parent, guardian or school. Parents or guardians may
            contact us at <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> to
            review or request deletion of a child's information.
          </p>
        </Section>

        <Section title="8. Your rights & deleting your account">
          <p>
            You can access and update your profile information at any time from the Profile screen
            in the app. You can permanently delete your account and associated personal data
            directly in the app: go to <strong>Profile → Delete Account</strong>. This removes your
            account, tutor conversations, messages, submissions, planner, bookmarks, progress and
            notifications.
          </p>
          <p>
            You can also request deletion by emailing{" "}
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the
            address linked to your account.
          </p>
        </Section>

        <Section title="9. Changes to this policy">
          <p>
            We may update this policy from time to time. We will update the "Last updated" date
            above when we do, and significant changes will be communicated within the app.
          </p>
        </Section>

        <Section title="10. Contact us">
          <p>
            Questions or requests about your privacy? Email{" "}
            <a className="text-primary underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
          </p>
        </Section>

        <div className="pt-2 flex gap-3 text-sm">
          <Link href="/terms"><span className="text-primary underline">Terms of Service</span></Link>
          <Link href="/"><span className="text-primary underline">Back to home</span></Link>
        </div>

        <footer className="pt-6 border-t text-center text-xs text-muted-foreground">
          SmartZim — Powered by Keith Kungwara · © 2025
        </footer>
      </main>
    </div>
  );
}
