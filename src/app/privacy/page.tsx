import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Masjid Notify",
  description: "Privacy Policy for Masjid Notify WhatsApp notification service",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: February 1, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              Masjid Notify collects the following information when you subscribe to our service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Phone Number:</strong> Your WhatsApp phone number, used to send you notifications</li>
              <li><strong>Notification Preferences:</strong> Your choices for which types of messages you want to receive (prayer reminders, Jumu&apos;ah notifications, Ramadan reminders, daily hadith, announcements)</li>
              <li><strong>Subscription Date:</strong> When you subscribed to the service</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">2. How We Use Your Information</h2>
            <p className="text-muted-foreground">
              We use your information solely to provide the Masjid Notify service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Send prayer time reminders based on your preferences</li>
              <li>Send Jumu&apos;ah (Friday prayer) notifications</li>
              <li>Send Ramadan-related reminders (Suhoor, Iftar, Taraweeh) when enabled</li>
              <li>Send daily hadith messages</li>
              <li>Send mosque announcements and event notifications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">3. Data Storage and Security</h2>
            <p className="text-muted-foreground">
              Your data is stored securely using Supabase, a trusted database platform with enterprise-grade security. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell, trade, or share your personal information with third parties. Your data is used exclusively for providing the Masjid Notify service. The only third-party service that receives your phone number is WhatsApp (Meta) for the purpose of delivering messages.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Unsubscribe:</strong> Send &quot;STOP&quot; to our WhatsApp number at any time to stop receiving messages</li>
              <li><strong>Manage Preferences:</strong> Send &quot;SETTINGS&quot; to update your notification preferences</li>
              <li><strong>Data Deletion:</strong> Request complete deletion of your data by emailing us</li>
              <li><strong>Pause:</strong> Send &quot;PAUSE [days]&quot; to temporarily pause notifications</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">6. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your data for as long as you remain subscribed to the service. If you unsubscribe, your data is marked as inactive but retained for 90 days in case you wish to resubscribe. After this period, or upon request, your data will be permanently deleted.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">7. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or wish to exercise your data rights, please contact us at:
            </p>
            <p className="text-muted-foreground">
              <strong>Email:</strong>{" "}
              <a href="mailto:alqodez@gmail.com" className="text-primary hover:underline">
                alqodez@gmail.com
              </a>
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">8. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify subscribers of any significant changes via WhatsApp message. Your continued use of the service after changes constitutes acceptance of the updated policy.
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
