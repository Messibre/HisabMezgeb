# Glossary — one word per idea

Every screen, export and message uses the term in this table. If a new string needs one of these ideas, reuse the term exactly. Wording marked **needs Meseret** is a proposal in the app today and waits for a native review (see `translation-review.md`).

| English | Amharic | Tigrigna | Where used | Status |
|---|---|---|---|---|
| Owed to you (what customers owe the shop) | ከደንበኞች የሚጠበቅ | ካብ ዓማዊል ዝጽበ | Home card, Debts total, Reports card (`money.owedToYou`) | needs Meseret |
| Funding (money in/out of the shop that is not a sale) | ተጨማሪ ገንዘብ | ተወሳኺ ገንዘብ | Entries tab, funding type label, Reports funding cards | needs Meseret |
| Funding in | የገባ ተጨማሪ ገንዘብ | ዝኣተወ ተወሳኺ ገንዘብ | Reports | needs Meseret |
| Funding out (returned) | የተመለሰ ተጨማሪ ገንዘብ | ዝተመልሰ ተወሳኺ ገንዘብ | Reports | needs Meseret |
| Custom range | የተወሰነ ጊዜ | ዝተወሰነ ግዜ | Reports period chip, Entries period menu | needs Meseret |
| Total | ጠቅላላ | ጠቕላላ | Reports cards | OK |
| Income | ገቢ | ኣታዊ | everywhere | OK |
| Expense | ወጪ | ወጻኢ | everywhere | OK |

Money signs (enforced in `MoneyText`, `src/lib/money.ts`):

| Kind | Sign | Tone |
|---|---|---|
| Income, funding in | + | green |
| Shop expense, funding out | − | red |
| Personal / family draw | none | neutral |
| Owed to you | none | neutral |
| Zero | none ("0", never "-0" or "+0") | — |
| Unknown (loading failed) | "—" | — |
