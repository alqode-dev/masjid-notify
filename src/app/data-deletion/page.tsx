import { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Data Deletion | Masjid Notify",
  description: "How to request data deletion from Masjid Notify",
};

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <main className="flex-1 container max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">Data Deletion Instructions</h1>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            We respect your right to control your personal data. Here&apos;s how you can manage or delete your information from Masjid Notify.
          </p>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Option 1: Unsubscribe via Settings</h2>
            <p className="text-muted-foreground">
              The quickest way to stop receiving notifications is to visit the{" "}
              <Link href="/settings" className="text-primary hover:underline">Settings</Link> page and click <strong>Unsubscribe</strong>. This will:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Immediately stop all push notifications</li>
              <li>Mark your subscription as inactive</li>
              <li>Retain your data for 90 days (in case you want to resubscribe)</li>
            </ul>
            <p className="text-muted-foreground">
              You can resubscribe at any time by visiting the home page and enabling notifications again.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Option 2: Request Complete Data Deletion</h2>
            <p className="text-muted-foreground">
              If you want your data permanently deleted from our systems, please email us:
            </p>
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-foreground font-medium">
                Email:{" "}
                <a href="mailto:alqodez@gmail.com" className="text-primary hover:underline">
                  alqodez@gmail.com
                </a>
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Subject: Data Deletion Request
              </p>
            </div>
            <p className="text-muted-foreground">
              Please include details to identify your subscription (e.g., the device and browser you used). We will process your request and permanently delete all your data within <strong>30 days</strong>.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">What Data Will Be Deleted</h2>
            <p className="text-muted-foreground">
              Upon a complete data deletion request, we will permanently remove:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>Your push notification subscription data</li>
              <li>Your notification preferences</li>
              <li>Your subscription history</li>
              <li>Any notification delivery records associated with your subscription</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Confirmation</h2>
            <p className="text-muted-foreground">
              Once your data has been deleted, we will send you a confirmation email. Please note that after deletion:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-2">
              <li>You will no longer receive any notifications from Masjid Notify</li>
              <li>Your data cannot be recovered</li>
              <li>You can subscribe again at any time as a new user</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Questions?</h2>
            <p className="text-muted-foreground">
              If you have any questions about data deletion or your privacy rights, please contact us at:
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
