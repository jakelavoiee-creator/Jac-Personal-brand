// THE IDENTITY RESET — the 12-month path. Paid content: import only from server code.
//
// Structure: the nine locked stages (WAKE → EXPAND) in order, then three months that
// take someone from awareness into consciously building and co-creating.
// Grouped into three phases that mirror the brand line: WAKE. RESET. BECOME.

import { library, type Resource, type ResourceKey } from "./library";

export type Phase = "WAKE" | "RESET" | "BECOME";

export type MonthItem = {
  /** Stable id, used for progress tracking. Never rename once shipped. */
  id: string;
  key: ResourceKey;
  /** Why this resource, why now. */
  why: string;
};

export type Month = {
  n: number;
  phase: Phase;
  stage: string;
  headline: string;
  why: string;
  items: MonthItem[];
  practice: { name: string; how: string };
  reflect: string[];
  next: string;
};

export const months: Month[] = [
  {
    n: 1,
    phase: "WAKE",
    stage: "WAKE",
    headline: "Notice the loop.",
    why: "You can't change a pattern you can't see. This month isn't about fixing anything. It's about catching yourself on autopilot, often enough that it starts to feel strange.",
    items: [
      { id: "m1-shi-tedx", key: "shiTedx", why: "The five things that quietly stand between people and self-mastery. You'll recognize at least three of them in yourself. That's the point." },
      { id: "m1-dispenza-impact", key: "dispenzaImpactTheory", why: "If you watched it after THE AWAKENING, watch it again. Personality creates personal reality, so a new reality needs a new personality. This is the thesis of the whole year." },
      { id: "m1-book-breaking", key: "bookBreakingHabit", why: "Start reading now. You have until the end of month 5. Ten pages a day is enough." },
    ],
    practice: { name: "The Autopilot Check", how: "Three times a day (set alarms), stop and ask: am I choosing this, or repeating it? Write one line in your notes each time." },
    reflect: [
      "Where in your day are you most on autopilot?",
      "Which of the five hindrances runs your life the most right now?",
      "What did you catch yourself doing this month that you'd never noticed before?",
    ],
    next: "Next month you go from noticing your behavior to noticing your mind.",
  },
  {
    n: 2,
    phase: "WAKE",
    stage: "SEE",
    headline: "You are not your thoughts.",
    why: "Awareness is the skill everything else is built on. Once you can watch a thought without becoming it, you get a gap between stimulus and reaction. That gap is where every change happens.",
    items: [
      { id: "m2-tolle-google", key: "tolleGoogle", why: "Tolle at his most accessible: presence, purpose, and staying sane in a world built to pull your attention." },
      { id: "m2-tolle-painbody", key: "tollePainBody", why: "Why old emotional pain keeps replaying, and how to see it without feeding it. This one reframes a lot of reactions you thought were \"just you.\"" },
      { id: "m2-ghiyam-kabbalah", key: "ghiyamWisdomOfKabbalah", why: "Your introduction to David Ghiyam, the teacher who has helped me the most. Pay attention to the idea of being reactive versus proactive. It runs through everything that comes after." },
      { id: "m2-book-now", key: "bookPowerOfNow", why: "Read alongside or after the videos. Same lens, more depth." },
    ],
    practice: { name: "Sixty Seconds, Daily", how: "Every morning before your phone: 60 seconds of watching your thoughts. Each time one appears, silently say “there's a thought.” Build up to five minutes by the end of the month." },
    reflect: [
      "What's the thought that shows up most often when you sit still?",
      "When did you catch a reaction this month before it took over?",
      "What does “reactive vs. proactive” look like in your actual life?",
    ],
    next: "Now that you can see your mind, next month you clean up what's been feeding it.",
  },
  {
    n: 3,
    phase: "WAKE",
    stage: "CLEANSE",
    headline: "Change the inputs.",
    why: "What you repeatedly consume becomes the environment your mind lives inside. This is the month you take that seriously: the feed, the music, the conversations, the cheap dopamine.",
    items: [
      { id: "m3-huberman-dopamine", key: "hubermanDopamine", why: "The clearest explanation of why your phone feels so hard to put down, and how to reset your baseline. Practical and science-backed." },
      { id: "m3-shi-doac", key: "shiDoac", why: "A Shaolin master on the modern habit he sees as an epidemic. It hits differently after the Huberman episode." },
      { id: "m3-dispenza-habits", key: "dispenzaBadHabits", why: "Short and direct. Why breaking a habit means breaking the emotional chemistry that's addicted to it." },
    ],
    practice: { name: "The Input Reset", how: "Take your 24-Hour Audit from THE AWAKENING. Cut every ↓ for 30 days: unfollow, mute, replace the playlist. Add one ↑ input every day." },
    reflect: [
      "What did you cut, and what showed up in the space it left?",
      "Which input was hardest to give up? What was it giving you?",
      "How does your mind feel at the end of this month compared to the start?",
    ],
    next: "Your mind's environment is cleaner. Next: the body that carries it.",
  },
  {
    n: 4,
    phase: "RESET",
    stage: "BODY",
    headline: "The body is the foundation.",
    why: "It's hard to become a new person in a body that's running on no sleep, no light, and no breath. Gary Brecka changed how I think about health, and this month is about the simple basics that make everything else easier.",
    items: [
      { id: "m4-brecka-doac", key: "breckaDoac", why: "Brecka's big picture: how simple, often overlooked basics shape how long and how well you live. Watch it as a perspective shift, not a prescription." },
      { id: "m4-brecka-morning", key: "breckaMorning", why: "His morning stack, broken down step by step. Pick two habits to start with, not seven." },
      { id: "m4-brecka-breath", key: "breckaBreathwork", why: "A beginner-friendly breathwork routine you can do tomorrow morning." },
      { id: "m4-huberman-sleep", key: "hubermanSleep", why: "The science of sleep, light, and alertness. This makes the morning routine make sense." },
    ],
    practice: { name: "The Morning Foundation", how: "Every morning for 30 days: water first, sunlight within 30 minutes of waking, and a few minutes of breathwork before your phone. This is general wellness, not medical advice. Check with a doctor before changing anything significant." },
    reflect: [
      "How has your energy changed since you started the morning foundation?",
      "What does your body need from you that you've been ignoring?",
      "How does the way you treat your body reflect the way you see yourself?",
    ],
    next: "With a clearer mind and a stronger body, you're ready for the center of the reset: identity.",
  },
  {
    n: 5,
    phase: "RESET",
    stage: "IDENTITY",
    headline: "Who are you beneath the labels?",
    why: "This is the heart of the reset. You've seen your loops, your thoughts, your inputs, your body. Now you look at the self those were all holding up, and decide what stays.",
    items: [
      { id: "m5-dispenza-fear", key: "dispenzaFear", why: "Dispenza on how fear and stress keep the old identity locked in place, and his process for stepping out of it. One of the most important hours in the guide." },
      { id: "m5-dispenza-sick", key: "dispenzaThoughtsSick", why: "The connection between your thoughts, your emotions, and your body, plus the morning practice he says to do before 10am." },
      { id: "m5-greene-doac", key: "greeneDoac", why: "A sharp counterweight: Robert Greene on human nature. Seeing other people clearly helps you see yourself clearly." },
      { id: "m5-book-breaking-finish", key: "bookBreakingHabit", why: "Finish the book this month. The meditation in the second half is the practice." },
    ],
    practice: { name: "Keep / Release", how: "Revisit your Inventory from THE AWAKENING. Make two columns: KEEP (traits and beliefs that are truly yours) and RELEASE (what was installed). Add to it all month." },
    reflect: [
      "What's on your RELEASE list that you've defended for years?",
      "What's on your KEEP list that you've never given yourself credit for?",
      "Finish this sentence ten different ways: “I am…”",
    ],
    next: "You know what to release. Next month you start imagining what to build.",
  },
  {
    n: 6,
    phase: "RESET",
    stage: "IMAGINE",
    headline: "What actually matters to you?",
    why: "Most people have never seriously asked what they want. They've only asked what they're supposed to want. This month you imagine without permission.",
    items: [
      { id: "m6-sinek-why", key: "sinekWhy", why: "The golden circle. It's about leaders, but it applies to a life. Start with why." },
      { id: "m6-sinek-infinite", key: "sinekInfinite", why: "Finite vs. infinite games. Are you playing to win something, or playing to keep growing?" },
      { id: "m6-howes-greatness", key: "howesGreatness", why: "Lewis Howes on fear, the past, and purpose. Accessible, honest, and energizing." },
      { id: "m6-book-why", key: "bookStartWithWhy", why: "Read this month. Write your own why statement by the end of it." },
    ],
    practice: { name: "The Blank Page", how: "Once a week, write for 15 minutes: “If nothing had been installed in me, my life would look like…” Don't edit. Don't make it realistic." },
    reflect: [
      "What's your why, in one sentence?",
      "What do you want that you've been embarrassed to admit?",
      "Are you playing a finite game or an infinite one?",
    ],
    next: "You can see the person you want to become. Next month you learn to see them clearly every day.",
  },
  {
    n: 7,
    phase: "RESET",
    stage: "VISUALIZE",
    headline: "Rehearse the future self.",
    why: "Visualization isn't wishful thinking. As a framework I find useful, it's practice: you rehearse who you're becoming until it stops feeling foreign. This is where Ghiyam and Dispenza meet.",
    items: [
      { id: "m7-ghiyam-time", key: "ghiyamCollapseTime", why: "Ghiyam on how certainty and consciousness shorten the distance between who you are and who you're becoming." },
      { id: "m7-ghiyam-soul", key: "ghiyamSoulPreparation", why: "A guided meditation. Do it at least once a week this month." },
      { id: "m7-dispenza-med", key: "dispenzaChannel", why: "Pick any of his guided meditations and use it as your daily practice. Consistency matters more than which one you pick." },
      { id: "m7-book-supernatural", key: "bookBecomingSupernatural", why: "Dispenza's deeper work on meditation and the future self. Read slowly, and practice while you read." },
    ],
    practice: { name: "Daily Rehearsal", how: "10 minutes a day: eyes closed, picture a single ordinary day as your future self. How you wake up, move, speak, decide. Feel it as if it already happened." },
    reflect: [
      "What does your future self do differently in the first hour of the day?",
      "What emotion does that version of you live in most of the time?",
      "Where did you feel resistance during the rehearsals?",
    ],
    next: "You've rehearsed it. Next month you stop rehearsing and start acting.",
  },
  {
    n: 8,
    phase: "BECOME",
    stage: "EMBODY",
    headline: "Act as if.",
    why: "Discipline isn't punishment. It's identity reinforcement. Every time you act like the person you're becoming, you cast a vote for them. This month you vote every day.",
    items: [
      { id: "m8-shi-howes", key: "shiHowes", why: "Shi Heng Yi on vitality and self-mastery. Discipline as freedom from a man who lives it." },
      { id: "m8-huberman-goals", key: "hubermanGoals", why: "The science of how goals actually get achieved. Turn the vision from month 7 into something you execute." },
      { id: "m8-book-shaolin", key: "bookShaolinSpirit", why: "Read this month. Pair it with the practice." },
    ],
    practice: { name: "Three Votes a Day", how: "Pick three small actions your future self does every day (for example: train, read 10 pages, no phone in bed). Do all three daily. Track them. Missing one isn't failure. Skipping the tracking is." },
    reflect: [
      "Which vote was easiest? Which was hardest, and why?",
      "Where did you act as your future self this month without having to think about it?",
      "What do people around you notice is different?",
    ],
    next: "Your behavior is changing. Next month you go beyond the self entirely.",
  },
  {
    n: 9,
    phase: "BECOME",
    stage: "EXPAND",
    headline: "Something bigger than you.",
    why: "At some point the work stops being only about you. This month opens up God, consciousness, meaning, and light. This isn't a doctrine. It's an invitation to explore what you actually believe.",
    items: [
      { id: "m9-ghiyam-laws", key: "ghiyamUniversalLaws", why: "Ghiyam's spiritual laws, the framework that has shaped my thinking most. Take what resonates and question the rest." },
      { id: "m9-ghiyam-secret", key: "ghiyamSecretLaws", why: "A longer conversation with Lewis Howes. It's the best overview of how he sees reality, consciousness, and the Creator." },
      { id: "m9-tolle-newearth", key: "tolleNewEarth", why: "Tolle and Oprah on A New Earth: ego, awakening, and purpose on a collective scale." },
      { id: "m9-book-newearth", key: "bookNewEarth", why: "Optional reading this month, if the series pulls you in." },
    ],
    practice: { name: "Morning Gratitude + Stillness", how: "Each morning: name three things you're grateful for, out loud or on paper. Then sit in silence for five minutes. No technique, just presence." },
    reflect: [
      "What is your relationship with God or something greater right now? Has it shifted this year?",
      "Where do you feel most connected to something bigger than yourself?",
      "What spiritual idea did you resist this month, and what was the resistance protecting?",
    ],
    next: "You've expanded. Next month you start co-creating with what you've found.",
  },
  {
    n: 10,
    phase: "BECOME",
    stage: "CO-CREATE",
    headline: "Build with intention.",
    why: "Co-creating is where awareness meets action: certainty, intention, and work, all moving in the same direction. As a framework I find useful, your inner state and your outer actions both shape the reality you live in.",
    items: [
      { id: "m10-ghiyam-four", key: "ghiyamFourSteps", why: "Ghiyam's four-part framework: transforming negativity, certainty, prayer, and physical action. Notice that action is part of it." },
      { id: "m10-ghiyam-abundance", key: "ghiyamAbundance", why: "His most-watched conversation with Lewis Howes, on consciousness and abundance. Watch it as a perspective on worth, not as a get-rich plan." },
      { id: "m10-ghiyam-broken", key: "ghiyamFeelBroken", why: "A meditation for the days it doesn't feel like it's working. There will be some." },
    ],
    practice: { name: "Intention + Action", how: "Write one clear intention for the next 90 days. Each day, take one concrete action toward it, then spend two minutes feeling as though it's already done." },
    reflect: [
      "What are you building, and does it come from your why or from an installed should?",
      "Where are you waiting instead of acting?",
      "Where are you forcing instead of trusting?",
    ],
    next: "Next month you bring all of it into your relationships and everyday life.",
  },
  {
    n: 11,
    phase: "BECOME",
    stage: "INTEGRATE",
    headline: "The reset meets real life.",
    why: "Being conscious alone on a quiet morning is easy. Staying conscious around family, partners, friends, and pressure is the real test. This month is about relationships and the people your reset affects.",
    items: [
      { id: "m11-ghiyam-soulmates", key: "ghiyamSoulmates", why: "Ghiyam on relationships, spiritual wisdom, and attraction. The way you love is part of your identity." },
      { id: "m11-tolle-painbody", key: "tollePainBody", why: "Rewatch it. Now notice the pain-body in your relationships, not just in yourself." },
      { id: "m11-book-human-nature", key: "bookHumanNature", why: "Greene's study of why people do what they do. Read selectively. Start with the chapters on envy, self-absorption, and conformity." },
    ],
    practice: { name: "The Pause", how: "In every charged conversation this month, take one full breath before responding. Afterward, journal the moment: what you felt, what you chose, and who chose it (the old self or the new one)." },
    reflect: [
      "Which relationship tests your new identity the most?",
      "Where did you respond instead of reacting this month?",
      "Who in your life deserves to see this version of you more often?",
    ],
    next: "One month left. You'll look back at the whole year and write who you're becoming.",
  },
  {
    n: 12,
    phase: "BECOME",
    stage: "BECOME",
    headline: "I'm not at the finish line. I'm in the process.",
    why: "There is no graduation. Awakening is a practice, not a destination. This month you look back, see how far you've come, and write the identity you're choosing going forward.",
    items: [
      { id: "m12-shi-tedx", key: "shiTedx", why: "Rewatch the first video from month 1. You'll hear it completely differently, and that difference is your year." },
      { id: "m12-dispenza-impact", key: "dispenzaImpactTheory", why: "Rewatch this too. Notice which ideas used to sound abstract and now sound obvious." },
      { id: "m12-ghiyam-time", key: "ghiyamCollapseTime", why: "End with the teacher who shaped this path the most." },
    ],
    practice: { name: "The Identity Letter", how: "Write a letter from the person you are now to the person who started month 1. Then write a second one, from you a year from now. Read both on the first day of every month." },
    reflect: [
      "Who were you twelve months ago? Describe them honestly.",
      "Which parts of you turned out to be never really yours?",
      "Who are you consciously choosing to become next?",
    ],
    next: "The path doesn't end. Start again at month 1 whenever you're ready. You'll be a different person reading it.",
  },
];

export type ResolvedMonth = Omit<Month, "items"> & {
  items: (MonthItem & Resource)[];
};

export const resolveMonths = (): ResolvedMonth[] =>
  months.map((m) => ({
    ...m,
    items: m.items.map((it) => ({ ...it, ...library[it.key] })),
  }));

/** Public, non-paid outline used on the offer section of THE AWAKENING. */
export const monthOutline = months.map(({ n, phase, stage, headline }) => ({
  n,
  phase,
  stage,
  headline,
}));
