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
 * 5. Enter template name (use underscore format, e.g., "salah_reminder")
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
  name: "salah_reminder",
  description: "Prayer time reminder notification",
  category: "MARKETING",
  languages: ["en"],
  body: `Salah Reminder from {{3}}: {{1}} is at {{2}} today. Please prepare for your salah. May Allah accept your ibadah.`,
  variables: ["prayer_name", "prayer_time", "mosque_name"],
  sampleValues: ["Fajr", "05:32", "Anwaarul Islam Rondebosch East"],
};

/**
 * Welcome Template
 *
 * Sent when a user subscribes to the mosque notifications.
 * Variables: mosque_name
 */
export const WELCOME_TEMPLATE: TemplateDefinition = {
  name: "masjid_notify_welcome",
  description: "Welcome message for new subscribers",
  category: "MARKETING",
  languages: ["en"],
  body: `Assalamu Alaikum! Welcome to {{1}} prayer notifications.

You will receive prayer time reminders, hadith, and announcements on WhatsApp, in sha Allah.

You can manage your preferences anytime:
* Type SETTINGS to update your choices
* Type PAUSE 7 to pause for 7 days
* Type HELP to see all commands
* Type STOP to unsubscribe

Reply STOP to opt out.`,
  variables: ["mosque_name"],
  sampleValues: ["Anwaarul Islam Rondebosch East"],
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
  category: "MARKETING",
  languages: ["en"],
  body: `Jumuah Mubarak from {{3}}! The adhaan is at {{1}} and the khutbah begins at {{2}} today. Please remember to recite Surah Al-Kahf and send abundant salawaat upon the Prophet (SAW).`,
  variables: ["adhaan_time", "khutbah_time", "mosque_name"],
  sampleValues: ["13:00", "13:20", "Anwaarul Islam Rondebosch East"],
};

/**
 * Daily Hadith Template
 *
 * Sent daily with an inspirational hadith.
 * Variables: hadith_text, source_and_reference, mosque_name
 */
export const DAILY_HADITH_TEMPLATE: TemplateDefinition = {
  name: "daily_hadith",
  description: "Daily hadith notification",
  category: "MARKETING",
  languages: ["en"],
  body: `Daily Hadith from {{3}}:

The Prophet (SAW) and his companions taught us:

{{1}}

Source: {{2}}. May Allah grant us the ability to act upon this teaching.`,
  variables: ["hadith_text", "source_and_reference", "mosque_name"],
  sampleValues: [
    "The best among you are those who have the best manners and character.",
    "Sahih al-Bukhari, Hadith 6029",
    "Anwaarul Islam Rondebosch East",
  ],
};

/**
 * Announcement Template
 *
 * Used for general mosque announcements and updates.
 * Variables: mosque_name, announcement_content
 *
 * NOTE: This single Meta template powers ALL 11 dashboard announcement types
 * (Eid, Juma, Lectures, Fundraiser, etc.). The admin picks a template in the
 * dashboard, edits the text, and it gets sent through this one Meta template.
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
    "Anwaarul Islam Rondebosch East",
    "Eid salah will be at 08:00 tomorrow morning. Please arrive early for takbeer at 07:45.",
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
  category: "MARKETING",
  languages: ["en"],
  body: `Suhoor Reminder from {{2}}: Fajr adhaan is at {{1}} today. Please complete your suhoor before this time. The Prophet (SAW) said: "Take suhoor, for indeed in suhoor there is blessing." (Sunan al-Nasa'i, 2164)`,
  variables: ["fajr_time", "mosque_name"],
  sampleValues: ["05:15", "Anwaarul Islam Rondebosch East"],
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
  category: "MARKETING",
  languages: ["en"],
  body: `Iftar Reminder from {{3}}: {{1}} minutes until Maghrib at {{2}}. Please begin preparing to break your fast.

Dua for breaking fast: "Allahumma inni laka sumtu wa bika aamantu wa ala rizqika aftartu." (O Allah, I fasted for You, I believed in You, and with Your provision I break my fast.)`,
  variables: ["minutes_until", "maghrib_time", "mosque_name"],
  sampleValues: ["15", "19:32", "Anwaarul Islam Rondebosch East"],
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
  category: "MARKETING",
  languages: ["en"],
  body: `Taraweeh Reminder from {{2}}: Taraweeh salah begins at {{1}} tonight at the masjid. May Allah accept your ibadah this Ramadan, Ameen.`,
  variables: ["taraweeh_time", "mosque_name"],
  sampleValues: ["20:30", "Anwaarul Islam Rondebosch East"],
};

/**
 * Tahajjud Reminder Template
 *
 * Sent 2 hours before Fajr to remind about night prayers.
 * Variables: fajr_time, mosque_name
 */
export const TAHAJJUD_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "tahajjud_reminder",
  description: "Tahajjud prayer reminder",
  category: "MARKETING",
  languages: ["en"],
  body: `Tahajjud Reminder from {{2}}: The last third of the night has begun. Fajr adhaan is at {{1}} today. The Prophet (SAW) said: "Our Lord descends every night to the lowest heaven when the last third of the night remains."`,
  variables: ["fajr_time", "mosque_name"],
  sampleValues: ["05:15", "Anwaarul Islam Rondebosch East"],
};

/**
 * Ishraq/Duha Reminder Template
 *
 * Sent 20 minutes after sunrise to remind about forenoon prayer.
 * Variables: mosque_name
 */
export const ISHRAQ_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "ishraq_reminder",
  description: "Ishraq/Duha prayer reminder",
  category: "MARKETING",
  languages: ["en"],
  body: `Ishraq Reminder from {{1}}: The sun has risen. It is now time for Ishraq salah. The Prophet (SAW) said: "Whoever prays Fajr in congregation, then sits remembering Allah until the sun rises, then prays two rakaats, will have a reward like Hajj and Umrah."`,
  variables: ["mosque_name"],
  sampleValues: ["Anwaarul Islam Rondebosch East"],
};

/**
 * Awwabin Reminder Template
 *
 * Sent 15 minutes after Maghrib to remind about Awwabin prayers.
 * Variables: mosque_name
 */
export const AWWABIN_REMINDER_TEMPLATE: TemplateDefinition = {
  name: "awwabin_reminder",
  description: "Awwabin prayer reminder",
  category: "MARKETING",
  languages: ["en"],
  body: `Awwabin Reminder from {{1}}: The time between Maghrib and Isha has begun. It is now time for Awwabin salah. The Prophet (SAW) said: "Whoever prays six rakaats after Maghrib without speaking ill between them, they will be equated to twelve years of worship."`,
  variables: ["mosque_name"],
  sampleValues: ["Anwaarul Islam Rondebosch East"],
};

/**
 * Suhoor Planning Reminder Template
 *
 * Sent the night before (after Isha/Taraweeh) to remind about suhoor.
 * Variables: fajr_time, mosque_name
 */
export const SUHOOR_PLANNING_TEMPLATE: TemplateDefinition = {
  name: "suhoor_planning",
  description: "Night before suhoor planning reminder",
  category: "MARKETING",
  languages: ["en"],
  body: `Suhoor Planning from {{2}}: Fajr adhaan is at {{1}} tomorrow morning. Please set your alarm and prepare your suhoor tonight. The Prophet (SAW) said: "Whoever fasts in the month of Ramadan out of sincere faith and hoping for a reward from Allah, then all his previous sins will be forgiven." (Sahih al-Bukhari)`,
  variables: ["fajr_time", "mosque_name"],
  sampleValues: ["05:15", "Anwaarul Islam Rondebosch East"],
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
  TAHAJJUD_REMINDER_TEMPLATE,
  ISHRAQ_REMINDER_TEMPLATE,
  AWWABIN_REMINDER_TEMPLATE,
  SUHOOR_PLANNING_TEMPLATE,
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
 * await sendWhatsAppTemplate(phone, "salah_reminder", "en", components);
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
    preview = preview.replaceAll(`{{${index + 1}}}`, value);
  });

  return preview;
}
