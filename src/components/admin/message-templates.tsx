"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";

interface MessageTemplate {
  id: string;
  name: string;
  category: string;
  icon: string;
  content: string;
}

const MESSAGE_TEMPLATES: MessageTemplate[] = [
  // Eid Templates
  {
    id: "eid-fitr",
    name: "Eid ul-Fitr Announcement",
    category: "Eid",
    icon: "🌙",
    content: `Eid Mubarak!

May Allah accept your fasting, prayers, and good deeds during Ramadan.

Eid Salah will be held at [TIME]. Please arrive early.

Takbeer will begin at [TIME].

Eid gift: Bring joy to someone today!`,
  },
  {
    id: "eid-adha",
    name: "Eid ul-Adha Announcement",
    category: "Eid",
    icon: "🐑",
    content: `Eid ul-Adha Mubarak!

May Allah accept your sacrifices and prayers.

Eid Salah will be held at [TIME]. Please arrive early.

Takbeer will begin at [TIME].

May this blessed day bring peace and happiness to you and your family.`,
  },
  // Jumu'ah Templates
  {
    id: "jumuah-special",
    name: "Special Jumu'ah",
    category: "Jumu'ah",
    icon: "🕌",
    content: `Special Jumu'ah Announcement

This Friday, we will have a special guest speaker: [SPEAKER NAME].

Topic: [TOPIC]

Khutbah begins at [TIME].

Don't miss this blessed gathering!`,
  },
  {
    id: "jumuah-reminder",
    name: "Jumu'ah Reminder",
    category: "Jumu'ah",
    icon: "📿",
    content: `Jumu'ah Reminder

"The best day on which the sun rises is Friday." - Prophet Muhammad ﷺ

• Read Surah Al-Kahf
• Send salawat upon the Prophet ﷺ
• Make dua in the last hour before Maghrib

See you at the masjid!`,
  },
  // Event Templates
  {
    id: "event-lecture",
    name: "Lecture/Talk",
    category: "Events",
    icon: "🎤",
    content: `Upcoming Lecture

Topic: [TOPIC]
Speaker: [SPEAKER NAME]
Date: [DATE]
Time: [TIME]
Venue: [VENUE]

All are welcome. Bring a friend!`,
  },
  {
    id: "event-fundraiser",
    name: "Fundraiser",
    category: "Events",
    icon: "💝",
    content: `Community Fundraiser

We are raising funds for [CAUSE].

Target: R[AMOUNT]

How to contribute:
• Cash donations at the masjid
• Bank transfer: [BANK DETAILS]
• Online: [LINK]

JazakAllah khair for your generosity!`,
  },
  {
    id: "event-classes",
    name: "Classes/Programs",
    category: "Events",
    icon: "📚",
    content: `New Classes Starting

[CLASS NAME]

Starting: [DATE]
Schedule: [DAYS/TIMES]
Instructor: [NAME]
Registration: [HOW TO REGISTER]

Limited spots available!`,
  },
  // General Templates
  {
    id: "general-maintenance",
    name: "Maintenance Notice",
    category: "General",
    icon: "🔧",
    content: `Maintenance Notice

The masjid will be undergoing [TYPE] maintenance on [DATE].

During this time: [IMPACT]

We apologize for any inconvenience. JazakAllah khair for your patience.`,
  },
  {
    id: "general-urgent",
    name: "Urgent Announcement",
    category: "General",
    icon: "⚠️",
    content: `Urgent Announcement

[ANNOUNCEMENT DETAILS]

Please share this with your family and friends.

For more information, contact: [CONTACT]`,
  },
  {
    id: "general-thanks",
    name: "Thank You Message",
    category: "General",
    icon: "🤲",
    content: `JazakAllah Khair

We would like to thank everyone who [REASON].

Your support and dedication to our community is truly appreciated.

May Allah reward you abundantly.`,
  },
  // Ramadan Templates
  {
    id: "ramadan-start",
    name: "Ramadan Start",
    category: "Ramadan",
    icon: "🌙",
    content: `Ramadan Mubarak!

The blessed month of Ramadan has begun.

Taraweeh prayers will be held nightly at [TIME].

May this month bring you closer to Allah and fill your life with blessings.`,
  },
  {
    id: "ramadan-laylatul-qadr",
    name: "Laylatul Qadr",
    category: "Ramadan",
    icon: "✨",
    content: `Seek Laylatul Qadr

We are now in the last 10 nights of Ramadan.

Increase your worship:
• Extra prayers
• Qur'an recitation
• Dua
• Charity

The Prophet ﷺ said: "Seek Laylatul Qadr in the odd nights of the last ten nights."`,
  },
];

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export function MessageTemplates({ onSelectTemplate }: MessageTemplatesProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [...new Set(MESSAGE_TEMPLATES.map((t) => t.category))];
  const filteredTemplates = selectedCategory
    ? MESSAGE_TEMPLATES.filter((t) => t.category === selectedCategory)
    : MESSAGE_TEMPLATES;

  return (
    <div className="space-y-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
      >
        <FileText className="w-4 h-4" />
        Use a template
        {expanded ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Card className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Button
                  variant={selectedCategory === null ? "primary" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "primary" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </Button>
                ))}
              </div>

              <div className="grid gap-3 max-h-64 overflow-y-auto">
                {filteredTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => {
                      onSelectTemplate(template.content);
                      setExpanded(false);
                    }}
                    className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-colors text-left"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <span className="text-xl flex-shrink-0">{template.icon}</span>
                    <div className="min-w-0">
                      <p className="font-medium text-foreground text-sm">
                        {template.name}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {template.content.length > 80
                          ? template.content.slice(0, 80) + "..."
                          : template.content}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>

              <p className="text-xs text-muted-foreground mt-4">
                Replace [PLACEHOLDERS] with your specific details.
                <br />
                <span className="text-muted-foreground/70">
                  Select a starting template, then customize the message before sending.
                </span>
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
