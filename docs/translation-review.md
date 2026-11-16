# Translation review

Nothing here was silently rewritten. "Current" is what the app shows on this branch. Status **needs Meseret** means a native speaker must approve or replace the wording; Tigrigna also needs a Tigrigna speaker.

| Key | English | Current Amharic | Proposed Amharic | Current Tigrigna | Proposed Tigrigna | Reason | Status |
|---|---|---|---|---|---|---|---|
| `money.owedToYou` | Owed to you | ከደንበኞች የሚጠበቅ | (same) | ካብ ዓማዊል ዝጽበ | (same) | New. Replaces "Customer Debts" (Home, shown with a minus) and "ጠቅላላ የሚፈለግ" (Debts). Must read as money the shop will receive, not money the shop owes. | needs Meseret |
| `entries.tabFunding` | Funding | ተጨማሪ ገንዘብ (was የገንዘብ ድጋፍ) | (same) | ተወሳኺ ገንዘብ (was ናይ ገንዘብ ደገፍ) | (same) | "ድጋፍ/ደገፍ" means aid or support. Reports already said "ተጨማሪ ገንዘብ"; now one word everywhere. | needs Meseret |
| `reports.fundingIn` / `reports.fundingOut` | Funding In / Out | የገባ / የተመለሰ ተጨማሪ ገንዘብ | (same) | ዝኣተወ / ዝተመልሰ ተወሳኺ ገንዘብ (was … ወፍሪ) | (same) | "ወፍሪ" means investment. | needs Meseret |
| `reports.custom` | Custom range | የተወሰነ ጊዜ (was ብጁ) | (same) | ዝተወሰነ ግዜ (was ፍሉይ) | (same) | "ብጁ" sounds odd; Entries already used "የተወሰነ ጊዜ". | needs Meseret |
| `debts.totalOwed` | Total Owed | ጠቅላላ የሚፈለግ | — | ጠቕላላ ዝድለ | — | No longer shown (replaced by `money.owedToYou`). "የሚፈለግ" reads as "what is wanted/needed". | info |
| `categories.costOfGoods` | Cost of Goods | የዕቃ ግዢ | (same) | ዕድጊት ኣቑሑ | (same) | Seeded categories were shown in English. Shown translated in the app and exports; a renamed or user-made category keeps its own name. | needs Meseret |
| `categories.equb` | Equb | ዕቁብ | (same) | ዕቑብ | (same) | Normal word. | needs Meseret |
| `categories.homeNecessities` | Home Necessities | የቤት ፍጆታ | (same) | ናይ ገዛ ኣድላዪ ነገራት | (same) | | needs Meseret |
| `categories.debtPayment` | Debt payment | የዕዳ ክፍያ | (same) | ክፍሊት ዕዳ | (same) | | needs Meseret |
| `brand.name` | Hisab Mezgeb | ሒሳብ መዝገብ | (same) | ሒሳብ መዝገብ | (same) | Header, auth screens, landing page and browser title. The installed-app label (manifest `name`) stays "Hisab Mezgeb": the manifest has one name for all languages. An Amharic name there would show as "ሒሳብ መዝገብ" under the icon for every user, including English ones. | needs owner decision |
| `common.offlineBanner` | Offline | ኢንተርኔት የለም (was "offline") | (same) | ኢንተርኔት የለን (was "Offline") | (same) | English word on the Amharic/Tigrigna banner. | needs Meseret |
| `debts.paymentMaxError` | …(ETB {{balance}})… | …(ብር {{balance}})… | (same) | …(ብር {{balance}})… | (same) | Currency shown as ብር like everywhere else. | fixed |
| `settings.theme` | Theme | ገጽታ (ቴም) | — | ገጽታ (was "ተማ (Theme)") | (same) | English word in Tigrigna. | needs Tigrigna speaker |
| `save.*` | Income saved / No internet. This cannot be saved yet. | {{kind}} ተመዝግቧል / ኢንተርኔት የለም። ይህ ገና ሊመዘገብ አይችልም። | (same) | {{kind}} ተመዝጊቡ / ኢንተርኔት የለን። እዚ ገና ክምዝገብ ኣይክእልን። | (same) | New (WP3). | needs Meseret |
| `pwa.iosInstallInstructions` | … "Add to Home Screen" … | contains English "Add to Home Screen" | keep | same | keep | It quotes the iOS menu item, which is English on most phones. | info |

**Tigrigna:** every Tigrigna string in the app still needs a native Tigrigna check.

## Calendar (WP10)

| Item | Amharic | Tigrigna | English | Status |
|---|---|---|---|---|
| Ethiopian months | መስከረም, ጥቅምት, ኅዳር, ታኅሣሥ, ጥር, የካቲት, መጋቢት, ሚያዝያ, ግንቦት, ሰኔ, ሐምሌ, ነሐሴ, ጳጉሜን | መስከረም, ጥቅምቲ, ሕዳር, ታሕሳስ, ጥሪ, ለካቲት, መጋቢት, ሚያዝያ, ግንቦት, ሰነ, ሓምለ, ነሓሰ, ጳጉሜን | Meskerem … Pagume | needs Meseret |
| Era | ዓ.ም | ዓ.ም | E.C. | needs Meseret |
| Gregorian months | ጃንዋሪ … ዲሴምበር | ጥሪ … ታሕሳስ (Eritrean usage) | January … December | needs Meseret / Tigrigna speaker |
| `settings.calendar*`, `date.day/month/year` | የቀን መቁጠሪያ, የኢትዮጵያ, ግሪጎሪያን, ቀን, ወር, ዓመት | ዓውደ ኣዋርሕ, ናይ ኢትዮጵያ, ግሪጎርያን, መዓልቲ, ወርሒ, ዓመት | | needs Meseret |

Month tables live in `frontend/src/lib/calendar/index.ts` and `backend/src/utils/ethiopicCalendar.ts`; change both together.
