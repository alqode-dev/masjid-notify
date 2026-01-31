/**
 * WhatsApp Message Templates for Masjid Notify
 *
 * This file contains all message template definitions that must be submitted
 * to Meta for approval before production use.
 *
 * IMPORTANT: WhatsApp Business API requires pre-approved templates for:
 * - First contact with a user (user hasn't messaged you in 24 hours)
 * - Notifications sent outside the 24-hour conversation window
 *
 * META TEMPLATE GUIDELINES:
 * 1. Templates cannot start or end with a variable
 * 2. Variables must be enclosed in double curly braces: {{1}}, {{2}}, etc.
 * 3. Templates must be submitted via Meta Business Manager
 * 4. Approval typically takes 24-48 hours
 * 5. Templates must follow Meta's commerce and messaging policies
 *
 * HOW TO SUBMIT TEMPLATES:
 * 1. Go to Meta Business Manager: https://business.facebook.com/
 * 2. Navigate to: WhatsApp Manager > Account Tools > Message Templates
 * 3. Click "Create Template"
 * 4. Select Category: UTILITY or MARKETING (see notes below)
 * 5. Enter template name (use underscore format, e.g., "prayer_reminder")
 * 6. Select language(s): English (en), and add translations if needed
 * 7. Enter the template body text exactly as specified below
 * 8. Submit for review
 *
 * TEMPLATE CATEGORIES:
 * - UTILITY: Transactional messages (prayer reminders, welcome, confirmations)
 * - MARKETING: Promotional messages (announcements, event notifications)
 *
 * After approval, use sendWhatsAppTemplate() from whatsapp.ts with the template name.
 */

// Environment variable for template namespace (set in Vercel/production)
// This is your WhatsApp Business Account ID used as namespace for templates
export const TEMPLATE_NAMESPACE = process.env.WHATSAPP_TEMPLATE_NAMESPACE || "";

/**
 * Template definition interface
 */
export interface TemplateDefinition {
  /** Template name as registered in Meta Business Manager (snake_case) */
  name: string;
  /** Human-readable description */
  description: string;
  /** Meta template category */
  category: "UTILITY" | "MARKETING";
  /** Supported language codes */
  languages: string[];
  /** Template body text with {{n}} placeholders */
  body: string;
  /** Variable descriptions in order */
  variables: string[];
  /** Sample values for template preview/testing */
  sampleValues: string[];
}

/**
 * Prayer Reminder Template
 *
 * Sent before each prayer time to notify subscribers.
 * Variables: prayer_name, prayer_time, mosque_name
 */
export const PRAYER_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "prayer_reminder",
  description: "Prayer time reminder notification",
  category: "UTILITY",
  languages: ["en"],
  body: `Salah Reminder: {{1}} begins at {{2}}

May Allah accept your prayers.

{{3}}`,
  variables: ["prayer_name", "prayer_time", "mosque_name"],
  sampleValues: ["Fajr", "05:30", "Green Point Masjid"],
};

/**
 * Welcome Template
 *
 * Sent when a user subscribes to the mosque notifications.
 * Variables: mosque_name
 */
export const WELCOME_TEMPLATE: TemplateDefinition = {
  name: "welcome_subscriber",
  description: "Welcome message for new subscribers",
  category: "UTILITY",
  languages: ["en"],
  body: `Assalamu Alaikum! Welcome to {{1}} notifications.

You will receive:
- Prayer time reminders
- Jumu'ah notifications
- Important announcements

Reply STOP to unsubscribe
Reply SETTINGS to manage preferences
Reply HELP for assistance

JazakAllah Khair for connecting with us!`,
  variables: ["mosque_name"],
  sampleValues: ["Green Point Masjid"],
};

/**
 * Jumu'ah Reminder Template
 *
 * Sent on Friday mornings to remind about Jumu'ah prayer.
 * Variables: adhaan_time, khutbah_time, mosque_name
 */
export const JUMUAH_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "jumuah_reminder",
  description: "Friday Jumu'ah prayer reminder",
  category: "UTILITY",
  languages: ["en"],
  body: `Jumu'ah Mubarak!

First Adhaan: {{1}}
Khutbah begins: {{2}}

We look forward to seeing you at {{3}}.`,
  variables: ["adhaan_time", "khutbah_time", "mosque_name"],
  sampleValues: ["12:30 PM", "12:50 PM", "Green Point Masjid"],
};

/**
 * Daily Hadith Template
 *
 * Sent daily with an inspirational hadith.
 * Variables: hadith_text, source, reference, mosque_name
 */
export const DAILY_HADITH_TEMPLATE: TemplateDefinition = {
  name: "daily_hadith",
  description: "Daily hadith notification",
  category: "UTILITY",
  languages: ["en"],
  body: `Daily Hadith:

{{1}}

Source: {{2}} ({{3}})

{{4}}`,
  variables: ["hadith_text", "source", "reference", "mosque_name"],
  sampleValues: [
    "The best among you are those who learn the Quran and teach it.",
    "Sahih al-Bukhari",
    "5027",
    "Green Point Masjid",
  ],
};

/**
 * Announcement Template
 *
 * Used for general mosque announcements and updates.
 * Variables: mosque_name, announcement_content
 */
export const ANNOUNCEMENT_TEMPLATE: TemplateDefinition = {
  name: "mosque_announcement",
  description: "General mosque announcement",
  category: "MARKETING",
  languages: ["en"],
  body: `Announcement from {{1}}:

{{2}}

Reply STOP to unsubscribe.`,
  variables: ["mosque_name", "announcement_content"],
  sampleValues: [
    "Green Point Masjid",
    "Eid Salah will be held at 7:30 AM on Wednesday. Please arrive early.",
  ],
};

/**
 * Suhoor Reminder Template (Ramadan)
 *
 * Sent before Fajr during Ramadan to remind about suhoor.
 * Variables: fajr_time, mosque_name
 */
export const SUHOOR_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "ramadan_suhoor",
  description: "Suhoor reminder during Ramadan",
  category: "UTILITY",
  languages: ["en"],
  body: `Suhoor Reminder: Time ends at {{1}}

Eat something, even if just dates and water. Remember your intention for fasting.

{{2}}`,
  variables: ["fajr_time", "mosque_name"],
  sampleValues: ["04:45 AM", "Green Point Masjid"],
};

/**
 * Iftar Reminder Template (Ramadan)
 *
 * Sent shortly before Maghrib during Ramadan.
 * Variables: minutes_until, maghrib_time, mosque_name
 */
export const IFTAR_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "ramadan_iftar",
  description: "Iftar reminder during Ramadan",
  category: "UTILITY",
  languages: ["en"],
  body: `Iftar Reminder: {{1}} minutes until Maghrib at {{2}}

Prepare to break your fast. Remember the dua when breaking fast.

{{3}}`,
  variables: ["minutes_until", "maghrib_time", "mosque_name"],
  sampleValues: ["15", "6:30 PM", "Green Point Masjid"],
};

/**
 * Taraweeh Reminder Template (Ramadan)
 *
 * Sent in the evening during Ramadan to remind about Taraweeh prayers.
 * Variables: taraweeh_time, mosque_name
 */
export const TARAWEEH_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "ramadan_taraweeh",
  description: "Taraweeh prayer reminder during Ramadan",
  category: "UTILITY",
  languages: ["en"],
  body: `Taraweeh Reminder: Night prayers begin at {{1}}

Join us for Taraweeh at {{2}}. May your prayers be accepted.`,
  variables: ["taraweeh_time", "mosque_name"],
  sampleValues: ["8:00 PM", "Green Point Masjid"],
};

/**
 * Collection of all templates for easy iteration
 */
export const ALL_TEMPLATES: TemplateDefinition[] = [
  PRAYER_REMINDER_TEMPLATE,
  WELCOME_TEMPLATE,
  JUMUAH_REMINDER_TEMPLATE,
  DAILY_HADITH_TEMPLATE,
  ANNOUNCEMENT_TEMPLATE,
  SUHOOR_REMINDER_TEMPLATE,
  IFTAR_REMINDER_TEMPLATE,
  TARAWEEH_REMINDER_TEMPLATE,
];

/**
 * Helper function to get template by name
 */
export function getTemplateByName(name: string): TemplateDefinition | undefined {
  return ALL_TEMPLATES.find((t) => t.name === name);
}

/**
 * Helper to format template variables for API call
 *
 * @param values - Array of string values in order of template variables
 * @returns Components array for sendWhatsAppTemplate()
 *
 * @example
 * const components = formatTemplateVariables(["Fajr", "05:30", "Green Point Masjid"]);
 * await sendWhatsAppTemplate(phone, "prayer_reminder", "en", components);
 */
export function formatTemplateVariables(
  values: string[]
): Array<{ type: string; parameters: Array<{ type: string; text: string }> }> {
  if (values.length === 0) {
    return [];
  }

  return [
    {
      type: "body",
      parameters: values.map((text) => ({
        type: "text",
        text,
      })),
    },
  ];
}

/**
 * Validate that all required variables are provided for a template
 */
export function validateTemplateVariables(
  template: TemplateDefinition,
  values: string[]
): { valid: boolean; error?: string } {
  if (values.length !== template.variables.length) {
    return {
      valid: false,
      error: `Template "${template.name}" requires ${template.variables.length} variables (${template.variables.join(", ")}), but ${values.length} provided`,
    };
  }

  // Check for empty values
  const emptyIndex = values.findIndex((v) => !v || v.trim() === "");
  if (emptyIndex !== -1) {
    return {
      valid: false,
      error: `Variable "${template.variables[emptyIndex]}" cannot be empty`,
    };
  }

  return { valid: true };
}

/**
 * Generate a preview of the template with sample or provided values
 */
export function previewTemplate(
  template: TemplateDefinition,
  values?: string[]
): string {
  const useValues = values || template.sampleValues;
  let preview = template.body;

  useValues.forEach((value, index) => {
    preview = preview.replace(`{{${index + 1}}}`, value);
  });

  return preview;
}
