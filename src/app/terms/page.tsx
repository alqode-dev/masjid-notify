import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Masjid Notify",
  description: "Terms of Service for Masjid Notify WhatsApp notification service",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Terms of Service</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: February 1, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By subscribing to Masjid Notify, you agree to these Terms of Service. If you do not agree with any part of these terms, please do not use our service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. Service Description</h2>
            <p className="text-muted-foreground">
              Masjid Notify is a WhatsApp-based notification service that sends:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Prayer time reminders for the five daily prayers</li>
              <li>Jumu&apos;ah (Friday prayer) notifications</li>
              <li>Ramadan reminders (Suhoor, Iftar, Taraweeh) during the holy month</li>
              <li>Daily hadith from authentic sources</li>
              <li>Mosque announcements and event notifications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. User Responsibilities</h2>
            <p className="text-muted-foreground">
              As a user of Masjid Notify, you agree to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Provide a valid WhatsApp phone number that belongs to you</li>
              <li>Not use the service for any unlawful purpose</li>
              <li>Not attempt to reverse engineer, hack, or disrupt the service</li>
              <li>Keep your notification preferences up to date</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Message Frequency</h2>
            <p className="text-muted-foreground">
              Message frequency depends on your preferences. You may receive:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Up to 5 prayer reminders daily (if all prayers selected)</li>
              <li>1 Jumu&apos;ah reminder on Fridays</li>
              <li>1 daily hadith message</li>
              <li>Occasional mosque announcements</li>
              <li>Additional Ramadan reminders during Ramadan (if enabled)</li>
            </ul>
            <p className="text-muted-foreground">
              You can adjust your preferences at any time by sending &quot;SETTINGS&quot; to our WhatsApp number.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Unsubscribing</h2>
            <p className="text-muted-foreground">
              You may unsubscribe from Masjid Notify at any time by:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Sending &quot;STOP&quot; to our WhatsApp number</li>
              <li>Contacting us at alqodez@gmail.com</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Service Availability</h2>
            <p className="text-muted-foreground">
              We strive to provide reliable service, but we do not guarantee uninterrupted availability. The service may be temporarily unavailable due to maintenance, technical issues, or circumstances beyond our control. We are not liable for any missed notifications or service interruptions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Prayer Times Accuracy</h2>
            <p className="text-muted-foreground">
              Prayer times are calculated using the Aladhan API based on your mosque&apos;s location and calculation method. While we strive for accuracy, times may vary slightly from your local mosque. Always verify with your local mosque for exact prayer times, especially for Jumu&apos;ah and Ramadan.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Hadith Content</h2>
            <p className="text-muted-foreground">
              Daily hadith messages are sourced from authentic collections including Sahih al-Bukhari, Sahih Muslim, Sunan Abu Dawud, Jami at-Tirmidhi, and Sunan Ibn Majah. We make every effort to ensure authenticity, but users should verify important matters with qualified scholars.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">9. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              Masjid Notify is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from the use or inability to use our service, including but not limited to missed prayers, incorrect prayer times, or service interruptions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">10. Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms of Service at any time. Significant changes will be communicated via WhatsApp message. Continued use of the service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">11. Contact</h2>
            <p className="text-muted-foreground">
              For questions about these Terms of Service, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong>{" "}
              <a href="mailto:alqodez@gmail.com" className="text-primary hover:underline">
                alqodez@gmail.com
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-6 border-t border-border">
          <Link href="/" className="text-primary hover:underline">
            &larr; Back to Home
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
