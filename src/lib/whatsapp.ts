import {
  type TemplateDefinition,
  formatTemplateVariables,
  validateTemplateVariables,
  PRAYER_REMINDER_TEMPLATE,
  WELCOME_TEMPLATE,
  JUMUAH_REMINDER_TEMPLATE,
  DAILY_HADITH_TEMPLATE,
  ANNOUNCEMENT_TEMPLATE,
  SUHOOR_REMINDER_TEMPLATE,
  IFTAR_REMINDER_TEMPLATE,
  TARAWEEH_REMINDER_TEMPLATE,
} from "./whatsapp-templates";

const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0'
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!

// Feature flag to use templates instead of plain text messages
// Set to false during testing, true in production after templates are approved
const USE_TEMPLATES = process.env.WHATSAPP_USE_TEMPLATES === "true";

interface WhatsAppResponse {
  messaging_product: string
  contacts: { input: string; wa_id: string }[]
  messages: { id: string }[]
}

interface WhatsAppError {
  error: {
    message: string
    type: string
    code: number
    fbtrace_id: string
  }
}

// Send a text message via WhatsApp Cloud API
export async function sendWhatsAppMessage(
  to: string,
  message: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Format phone number (remove + and spaces)
    const formattedPhone = to.replace(/[\s+\-]/g, '')

    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as WhatsAppError
      console.error('WhatsApp API Error:', errorData)
      return { success: false, error: errorData.error?.message || 'Unknown error' }
    }

    const successData = data as WhatsAppResponse
    return { success: true, messageId: successData.messages[0]?.id }
  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: 'Failed to send message' }
  }
}

// Send a template message (for first contact - WhatsApp requires approved templates)
export async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  languageCode: string = 'en',
  components?: Array<{
    type: string
    parameters: Array<{ type: string; text: string }>
  }>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const formattedPhone = to.replace(/[\s+\-]/g, '')

    const body: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: formattedPhone,
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
      },
    }

    if (components) {
      (body.template as Record<string, unknown>).components = components
    }

    const response = await fetch(
      `${WHATSAPP_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    const data = await response.json()

    if (!response.ok) {
      const errorData = data as WhatsAppError
      console.error('WhatsApp Template API Error:', errorData)
      return { success: false, error: errorData.error?.message || 'Unknown error' }
    }

    const successData = data as WhatsAppResponse
    return { success: true, messageId: successData.messages[0]?.id }
  } catch (error) {
    console.error('WhatsApp template send error:', error)
    return { success: false, error: 'Failed to send template message' }
  }
}

/**
 * Send a message using a template definition.
 * When USE_TEMPLATES is true, sends via WhatsApp template API.
 * When false, falls back to regular text message with rendered content.
 *
 * @param to - Phone number to send to
 * @param template - Template definition from whatsapp-templates.ts
 * @param variables - Variable values in order matching template.variables
 * @returns Result with success status, messageId, and any error
 */
export async function sendTemplateMessage(
  to: string,
  template: TemplateDefinition,
  variables: string[]
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Validate variables
  const validation = validateTemplateVariables(template, variables);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (USE_TEMPLATES) {
    // Use WhatsApp template API
    const components = formatTemplateVariables(variables);
    return sendWhatsAppTemplate(to, template.name, "en", components);
  } else {
    // Fall back to plain text message (for testing or when templates not approved)
    let message = template.body;
    variables.forEach((value, index) => {
      message = message.replace(`{{${index + 1}}}`, value);
    });
    return sendWhatsAppMessage(to, message);
  }
}

// Re-export templates for convenience
export {
  PRAYER_REMINDER_TEMPLATE,
  WELCOME_TEMPLATE,
  JUMUAH_REMINDER_TEMPLATE,
  DAILY_HADITH_TEMPLATE,
  ANNOUNCEMENT_TEMPLATE,
  SUHOOR_REMINDER_TEMPLATE,
  IFTAR_REMINDER_TEMPLATE,
  TARAWEEH_REMINDER_TEMPLATE,
};

// Welcome message for new subscribers
export function getWelcomeMessage(mosqueName: string): string {
  return `Assalamu Alaikum! 🕌

You're now subscribed to ${mosqueName} updates.

You'll receive:
• Prayer time reminders
• Jumu'ah notifications
• Important announcements

Reply STOP to unsubscribe
Reply SETTINGS to change preferences
Reply HELP for support

JazakAllah Khair for connecting with us!`
}

// Prayer reminder message
export function getPrayerReminderMessage(
  prayerName: string,
  prayerTime: string,
  mosqueName: string
): string {
  const emoji = prayerName === 'Fajr' ? '🌅' :
                prayerName === 'Maghrib' ? '🌆' : '🕌'

  return `${emoji} ${prayerName} Reminder

${prayerName} begins at ${prayerTime}

${mosqueName}`
}

// Jumu'ah reminder message
export function getJumuahReminderMessage(
  adhaan: string,
  khutbah: string,
  mosqueName: string
): string {
  return `🕌 Jumu'ah Mubarak!

First Adhaan: ${adhaan}
Khutbah begins: ${khutbah}

${mosqueName}`
}

// Announcement message
export function getAnnouncementMessage(
  content: string,
  mosqueName: string
): string {
  return `📢 ${mosqueName}

${content}`
}

// Suhoor reminder (Ramadan)
export function getSuhoorReminderMessage(
  fajrTime: string,
  mosqueName: string
): string {
  return `🌙 Suhoor Reminder

Suhoor ends at ${fajrTime}
Eat something, even if just a date and water.

${mosqueName}`
}

// Iftar reminder (Ramadan)
export function getIftarReminderMessage(
  maghribTime: string,
  minutesUntil: number,
  mosqueName: string
): string {
  return `🌅 Iftar in ${minutesUntil} minutes

Maghrib at ${maghribTime}

${mosqueName}`
}

// Taraweeh reminder (Ramadan)
export function getTaraweehReminderMessage(
  taraweehTime: string,
  mosqueName: string
): string {
  return `🌙 Taraweeh Reminder

Taraweeh begins at ${taraweehTime}

Join us for the night prayers at ${mosqueName}`
}
