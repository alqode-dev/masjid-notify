import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Masjid Notify",
  description: "Privacy Policy for Masjid Notify push notification service",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Privacy Policy</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Last updated: February 21, 2026
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">1. Information We Collect</h2>
            <p className="text-muted-foreground">
              Masjid Notify collects the following information when you subscribe to our service:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Push Subscription Data:</strong> Your browser&apos;s push notification endpoint and encryption keys, used to send you notifications</li>
              <li><strong>Device Information:</strong> Your browser&apos;s user agent string, used to identify your device in our system</li>
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
              Your data is stored securely using Supabase, a trusted database platform with enterprise-grade security. We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Push subscription data is encrypted end-to-end using Web Push protocol standards (VAPID).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">4. Data Sharing</h2>
            <p className="text-muted-foreground">
              We do not sell, trade, or share your personal information with third parties. Your data is used exclusively for providing the Masjid Notify service. Push notifications are delivered through your browser&apos;s built-in push service (e.g., Google FCM for Chrome, Mozilla Push Service for Firefox, APNs for Safari).
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">5. Your Rights</h2>
            <p className="text-muted-foreground">
              You have the following rights regarding your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li><strong>Unsubscribe:</strong> Visit the <Link href="/settings" className="text-primary hover:underline">Settings</Link> page at any time to unsubscribe from all notifications</li>
              <li><strong>Manage Preferences:</strong> Update your notification preferences on the <Link href="/settings" className="text-primary hover:underline">Settings</Link> page</li>
              <li><strong>Data Deletion:</strong> Request complete deletion of your data by emailing us or unsubscribing through Settings</li>
              <li><strong>Pause:</strong> Temporarily pause notifications from the Settings page</li>
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
              We may update this Privacy Policy from time to time. We will notify subscribers of any significant changes via push notification. Your continued use of the service after changes constitutes acceptance of the updated policy.
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
