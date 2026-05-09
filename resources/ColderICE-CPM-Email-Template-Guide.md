# ColderICE Media — CPM Brand Email Template Guide

**File:** `ColderICE-Email-Brand-Template.html`
**Series:** The Claude Power Move Series
**Brand Framework:** People + AI = Power Moves

---

## What This Template Is

This is the master HTML email template for all ColderICE Media / Claude Power Move Series sends. It is built in GHL-compatible HTML and uses GHL merge tag syntax (`{{contact.first_name}}`, etc.).

Every email that goes out under this brand uses this template. The visual system — colors, fonts, layout, dark/light contrast, orange accents — never changes. Only the content inside each section changes per campaign.

---

## Brand Rules (Never Change These)

- **Orange accent:** `#e8732a`
- **Dark background:** `#111111`
- **Body text:** `#444444`
- **Font:** Inter (Google Fonts)
- **Tagline:** "People + AI = Power Moves · ColderICE Media" — locked, appears in header and footer
- **Footer brand block:** ColderICE Media + tagline + unsubscribe links — always present

Do not alter the CSS. Do not change the color values. Do not remove the footer.

---

## The 9 Sections

### Section 1 · Dark Header (Required)
The top bar. Always dark background with orange badge pill.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{HEADER_BADGE}}` | Short label for this send | `Session 2 · April 30` |
| `{{HEADER_SERIES}}` | Series or program name | `The Claude Power Move Series` |

The tagline line ("People + AI = Power Moves · ColderICE Media") is locked.

---

### Section 2 · Dark Hero Band (Required)
The big visual statement. Dark gradient with radial orange glow.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{HERO_PILL}}` | Small pill tag — format/frequency | `Live Thursdays · 7 PM ET` |
| `{{HERO_TITLE_PLAIN}}` | First word(s) of headline (white) | `The` |
| `{{HERO_TITLE_ACCENT}}` | The power word in orange | `Content` |
| `{{HERO_TITLE_REST}}` | Remaining headline words (white) | `Machine.` |
| `{{HERO_SUBTITLE}}` | One punchy supporting line, ~10 words | `Build your voice. A week of posts in 20 min.` |

**Headline formula:** [Plain] [ACCENT] / [Rest] — the accent word carries the visual weight. Choose it carefully. If the headline is only two words, delete the `<br>` and `{{HERO_TITLE_REST}}`.

---

### Section 3 · Alert Strip (Optional)
Full-width orange bar. High attention. Use sparingly — only when there is genuine urgency (platform change, deadline, new link, last call).

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{ALERT_TEXT}}` | One sentence, punchy | `⚠️ New platform — your old link won't work. Re-register below.` |

**Delete this entire `<tr>` block if no urgency message is needed.**

---

### Section 4 · Body Content (Required)
White background. The core of the email. Keep each paragraph to 2–4 sentences. Bold the key point in each paragraph.

| Placeholder | What Goes Here |
|---|---|
| `{{contact.first_name}}` | GHL merge tag — do not change |
| `{{OPENING_PARAGRAPH}}` | Hook, context, or re-engage opener |
| `{{BODY_PARAGRAPH_2}}` | Build the case or tension |
| `{{BODY_PARAGRAPH_3}}` | Bridge to the first CTA |
| `{{CTA_URL_1}}` | Full URL for the primary CTA button |
| `{{CTA_LABEL_1}}` | Button text — all caps, action-first | `Get My Session 2 Link →` |
| `{{CTA_SUB_1}}` | Small supporting text below button | `ClaudePowerMove.com · Free · Thursday 7PM ET` |

**Writing rules for body copy:**
- Lead with the point — no long wind-ups
- Short sentences hit harder
- No corporate filler (no "It's worth noting," no "Certainly")
- No em dashes — use a comma or rewrite
- Bold the one thing they need to remember per paragraph

---

### Section 5 · Dark Feature Block (Required)
Dark background section embedded in the white body. Use for: what's covered, what they'll learn, what they'll get, offer features, or results breakdown.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{DARK_SECTION_LABEL}}` | Orange eyebrow — date, category, or context | `This Thursday · April 30` |
| `{{DARK_SECTION_HEADLINE}}` | Bold section headline | `Claude as Your Content Machine` |
| `{{DARK_SECTION_INTRO}}` | 1–2 sentence framing before the list | `Each session stands on its own — jump in Thursday and you're up to speed.` |
| `{{FEATURE_X_TITLE}}` | Bold label for each list item | `The Voice Profile` |
| `{{FEATURE_X_DESCRIPTION}}` | Description sentence for each item | `Teach Claude to write in your voice so the output sounds like you, not every other AI post.` |

**List rules:** Minimum 2 items, maximum 6. Each item = bold title + description sentence. Add or remove `<li>` rows as needed. Orange arrows are automatic.

---

### Section 6 · Event Box (Optional)
Orange left-border card. Use when there is a specific date, time, and URL to highlight — live sessions, webinars, deadlines, or offer closes.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{EVENT_DATE_LABEL}}` | Day of week label | `Thursday,` |
| `{{EVENT_DATE_ACCENT}}` | The date in orange | `April 30` |
| `{{EVENT_TIME}}` | Time with timezone | `7:00 PM ET` |
| `{{EVENT_DETAIL}}` | Detail line — format and series name | `Free Live Zoom · The Claude Power Move Series` |
| `{{EVENT_URL}}` | Full URL | `https://ClaudePowerMove.com` |
| `{{EVENT_URL_LABEL}}` | Display text for the link | `→ ClaudePowerMove.com` |

**Delete this block for non-event emails (newsletters, nurture, content drops).**

---

### Section 7 · Callout / Prep Block (Optional)
Orange-tinted box. Use for pre-work, action items, resource links, or "before you show up" instructions. One to two sentences max.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{CALLOUT_EMOJI}}` | Emoji prefix | `📌` or `🔥` or `✅` |
| `{{CALLOUT_LABEL}}` | Bold label | `Before Thursday:` |
| `{{CALLOUT_BODY}}` | The instruction — can include linked text | `Build your Voice Profile at john.tips/voice-builder — takes 10 minutes.` |

**Delete this block for emails without a pre-action step.**

---

### Section 8 · PS Block (Optional)
Gray left-bordered callout. Use for referral nudge, forward ask, bonus mention, or a secondary CTA that doesn't warrant its own button. One to two sentences.

| Placeholder | What Goes Here | Example |
|---|---|---|
| `{{PS_TEXT}}` | The P.S. copy — can include linked text | `Know a business owner who needs this? Forward it. Series is free. ClaudePowerMove.com` |

**Delete this block when there is no natural P.S. moment.**

---

### Section 9 · Dark Footer (Required — Locked)
Brand name, tagline, and compliance links. Never alter the brand name or tagline. Update the link hrefs per campaign.

| Placeholder | What Goes Here |
|---|---|
| `{{UNSUBSCRIBE_URL}}` | GHL unsubscribe link |
| `{{PREFERENCES_URL}}` | GHL manage preferences link |
| `{{FOOTER_LINK_3_URL}}` | Optional third link URL (offer page, main site, etc.) |
| `{{FOOTER_LINK_3_LABEL}}` | Display text for the third link |

---

## How to Build a New Email from This Template

1. Duplicate `ColderICE-Email-Brand-Template.html`
2. Rename the file to match the campaign (e.g., `CPM-Session3-Email.html`)
3. Update `{{EMAIL_SUBJECT_LINE}}` in the `<title>` tag
4. Fill every required `{{PLACEHOLDER}}` — work top to bottom
5. Delete any optional sections that do not apply to this send
6. Paste into GHL email builder as custom HTML
7. Preview on mobile and desktop before sending
8. Test GHL merge tags with a test contact before scheduling

---

## Email Types and Which Sections to Use

| Email Type | Alert Strip | Event Box | Callout Block | PS Block |
|---|---|---|---|---|
| Live session invite | ✅ if new link/urgency | ✅ | ✅ if pre-work | ✅ forward ask |
| Replay / catch-up | ❌ | ❌ or modified | ❌ | optional |
| Offer launch | ✅ deadline | ❌ | ✅ action item | ✅ bonus or urgency |
| Nurture / content | ❌ | ❌ | ❌ | optional |
| Newsletter | ❌ | ❌ | ❌ | optional |

---

## Quick Reference — All Placeholders

```
{{EMAIL_SUBJECT_LINE}}
{{HEADER_BADGE}}
{{HEADER_SERIES}}
{{HERO_PILL}}
{{HERO_TITLE_PLAIN}}
{{HERO_TITLE_ACCENT}}
{{HERO_TITLE_REST}}
{{HERO_SUBTITLE}}
{{ALERT_TEXT}}
{{contact.first_name}}
{{OPENING_PARAGRAPH}}
{{BODY_PARAGRAPH_2}}
{{BODY_PARAGRAPH_3}}
{{CTA_URL_1}}
{{CTA_LABEL_1}}
{{CTA_SUB_1}}
{{DARK_SECTION_LABEL}}
{{DARK_SECTION_HEADLINE}}
{{DARK_SECTION_INTRO}}
{{FEATURE_1_TITLE}} / {{FEATURE_1_DESCRIPTION}}
{{FEATURE_2_TITLE}} / {{FEATURE_2_DESCRIPTION}}
{{FEATURE_3_TITLE}} / {{FEATURE_3_DESCRIPTION}}
{{FEATURE_4_TITLE}} / {{FEATURE_4_DESCRIPTION}}
{{EVENT_DATE_LABEL}}
{{EVENT_DATE_ACCENT}}
{{EVENT_TIME}}
{{EVENT_DETAIL}}
{{EVENT_URL}}
{{EVENT_URL_LABEL}}
{{CALLOUT_EMOJI}}
{{CALLOUT_LABEL}}
{{CALLOUT_BODY}}
{{CTA_URL_2}}
{{CTA_LABEL_2}}
{{CTA_SUB_2}}
{{SIGNOFF_LINE}}
{{SIGNOFF_NAME}}
{{PS_TEXT}}
{{UNSUBSCRIBE_URL}}
{{PREFERENCES_URL}}
{{FOOTER_LINK_3_URL}}
{{FOOTER_LINK_3_LABEL}}
```
