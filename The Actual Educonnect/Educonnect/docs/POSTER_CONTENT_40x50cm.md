# EduConnect — Poster Content (40cm × 50cm Manila Paper)

Use this content to fill your poster. Lay out in order: Title → Overview → Flow → Features → How It Works → Tech. Use large title, clear headings, and bullets so it reads from a distance.

---

## 1. TITLE (top, large)

**EduConnect**  
*AI-Enabled Peer-to-Peer Learning Platform*

---

## 2. ONE-LINE OVERVIEW (under title)

A study-partner and learning platform that matches students by interests and availability, suggests resources and quizzes, and lets them chat in interest-based study groups.

---

## 3. APP FLOW (main section — left or center)

**How a user moves through the app**

1. **Sign up / Log in**  
   Register with email, university, interests, skills, study preferences.

2. **Dashboard**  
   See study stats, weekly hours, top 3 study-partner matches, quick links to Resources and Study Groups.

3. **Find Partners**  
   View all matches with a **match score %** (e.g. 42%). Filter by score or programme. Click a card → View profile.

4. **Learning Resources**  
   Browse courses/tutorials by topic (AI, Law, Health, etc.). Open links to external sites. Each topic can have quizzes.

5. **Quizzes**  
   Take topic quizzes (AI-generated from resource content). Pass to earn study credit. Final test per topic for proficiency.

6. **Study Groups**  
   Groups auto-created by interest (e.g. “Data Science Study Group”). Open a group → **Group Chat** to talk with members. From the group, start a **1-to-1 chat** with any member.

7. **Profile & Feedback**  
   Edit profile; submit feedback to the team.

---

## 4. KEY FEATURES (bullet list)

- **Smart matching** — Match score from profile (interests, skills, learning style, study hours, availability). Hybrid scoring: content + availability + engagement.
- **Study groups** — Built from your interests; join and chat in a shared thread (localStorage + polling).
- **Learning resources** — Curated courses/tutorials by category; links to Coursera, edX, etc.
- **AI quizzes** — Quizzes generated from resource descriptions; no manual question entry; appear after generation.
- **EduBot (chatbot)** — In-app assistant: find partners, resources, quizzes; general questions answered by AI when configured.
- **Study tracking** — Session timer, weekly hours, quiz progress, proficiency badges.

---

## 5. HOW IT FUNCTIONS (short technical flow)

**Matching**  
User profile (interests, skills, hours, etc.) + other users (dataset + registered) → **recommendation engine** (Jaccard similarity + weights) → sorted list with **match %** and optional **reasons**.

**Study group chat**  
Messages stored in browser (**localStorage**) per chat room. Page **polls every 2 seconds** to show new messages. Send = append to that room’s list.

**Quizzes**  
Admin or first visit can trigger **AI generation** from learning resource text (OpenAI). Questions + correct answer index saved; frontend shows quiz and checks answers.

**Data**  
- **Frontend:** React (Vite). **API:** Node/Express (auth, chat, quiz, dataset). **Optional:** Python/Flask for NLP (e.g. intent).  
- **Storage:** SQLite (users, dataset for matching); PostgreSQL optional for analytics. Group/DM chat in localStorage.

---

## 6. SIMPLE FLOW DIAGRAM (text — draw boxes on poster)

```
[ Sign Up / Login ]
        ↓
[ Dashboard ] ←→ [ Find Partners ]   (matches + %)
        ↓
[ Resources ] → [ Quizzes ]         (by topic)
        ↓
[ Study Groups ] → [ Group Chat ]   (one thread per group)
        ↓                    ↓
[ Profile ]           [ 1-to-1 Chat ] (with a member)
```

---

## 7. BOTTOM LINE (one sentence)

**EduConnect helps students find study partners, access learning resources, take AI-generated quizzes, and communicate in interest-based group chats — all in one app.**

---

## LAYOUT TIPS FOR 40cm × 50cm

- **Top (≈8 cm):** Title + one-line overview.
- **Middle-left (≈15 cm):** “App flow” (numbered steps).
- **Middle-right (≈15 cm):** “Key features” (bullets) + small “How it functions” block.
- **Center or below:** Flow diagram (draw boxes and arrows).
- **Bottom (≈5 cm):** Bottom line sentence.
- Use 2–3 font sizes: large title, medium headings, smaller body. Leave small margins so nothing is cut when printed or pasted.
