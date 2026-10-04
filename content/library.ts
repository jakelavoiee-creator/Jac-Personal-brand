// The curated library behind THE AWAKENING and THE IDENTITY RESET.
//
// Video links come in two kinds:
//   yt(id)       — a specific video whose ID and title were confirmed via web search (Oct 2026).
//   ytSearch(q)  — an exact-title YouTube search, used where the episode is real and confirmed
//                  but its video ID could not be verified. Swap to yt(id) once confirmed.
// See docs/CONTENT-SOURCES.md for the verification log.

export type Resource = {
  kind: "video" | "book" | "meditation";
  title: string;
  teacher: string;
  /** Channel or show the video lives on, or the publisher for books. */
  source: string;
  url: string;
};

export const yt = (id: string) => `https://www.youtube.com/watch?v=${id}`;
export const ytSearch = (q: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
const book = (title: string, author: string) =>
  `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(`${title} ${author}`)}`;

export const library = {
  // ── David Ghiyam ─────────────────────────────────────────────
  ghiyamWisdomOfKabbalah: {
    kind: "video",
    title: "The Wisdom of Kabbalah",
    teacher: "David Ghiyam",
    source: "On Purpose with Jay Shetty",
    url: yt("je-SQ7x80cM"),
  },
  ghiyamCollapseTime: {
    kind: "video",
    title: "Collapse Time and Change Your Destiny",
    teacher: "David Ghiyam",
    source: "YouTube",
    url: yt("TkPLdtQvhaE"),
  },
  ghiyamSoulPreparation: {
    kind: "meditation",
    title: "Guided Meditation — Soul Preparation",
    teacher: "David Ghiyam",
    source: "YouTube",
    url: yt("S9VRcR9WP0A"),
  },
  ghiyamFeelBroken: {
    kind: "meditation",
    title: "How To Win Life When You Feel Broken",
    teacher: "David Ghiyam",
    source: "YouTube",
    url: yt("kUVRSyLDKjE"),
  },
  ghiyamUniversalLaws: {
    kind: "video",
    title: "The Universal Laws of Creating Prosperity and Wholeness in Life",
    teacher: "David Ghiyam",
    source: "YouTube",
    url: yt("_LGPkyw51pc"),
  },
  ghiyamSoulmates: {
    kind: "video",
    title: "Manifestation, Spiritual Wisdom, and Soulmates",
    teacher: "David Ghiyam",
    source: "YouTube",
    url: yt("V_etaoWeMCY"),
  },
  ghiyamSecretLaws: {
    kind: "video",
    title: "How To MANIFEST ANYTHING With The Secret Laws of The Universe",
    teacher: "David Ghiyam",
    source: "The School of Greatness · Lewis Howes",
    url: ytSearch("David Ghiyam How To Manifest Anything With The Secret Laws of The Universe Lewis Howes"),
  },
  ghiyamFourSteps: {
    kind: "video",
    title: "4 Steps To Manifest Miracles & Abundance",
    teacher: "David Ghiyam",
    source: "The School of Greatness · Lewis Howes",
    url: ytSearch("David Ghiyam 4 Steps To Manifest Miracles & Abundance Lewis Howes"),
  },
  ghiyamAbundance: {
    kind: "video",
    title: "How To Manifest ABUNDANCE With The Universal Laws For WEALTH",
    teacher: "David Ghiyam",
    source: "The School of Greatness · Lewis Howes",
    url: ytSearch("David Ghiyam How To Manifest Abundance With The Universal Laws For Wealth"),
  },

  // ── Dr. Joe Dispenza ─────────────────────────────────────────
  dispenzaImpactTheory: {
    kind: "video",
    title: "How to Unlock the Full Potential of Your Mind",
    teacher: "Dr. Joe Dispenza",
    source: "Impact Theory · Tom Bilyeu",
    url: yt("La9oLLoI5Rc"),
  },
  dispenzaFear: {
    kind: "video",
    title: "Secret To Living Without Fear & Anxiety Forever! Your Mind Can Heal Itself!",
    teacher: "Dr. Joe Dispenza",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: yt("Nja4FMEBgIg"),
  },
  dispenzaThoughtsSick: {
    kind: "video",
    title: "Your Thoughts Are Making You Sick! You MUST Do This Before 10am To Fix It!",
    teacher: "Dr. Joe Dispenza",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: ytSearch("Joe Dispenza Your Thoughts Are Making You Sick Diary of a CEO"),
  },
  dispenzaBadHabits: {
    kind: "video",
    title: "How To ACTUALLY Break Bad Habits",
    teacher: "Dr. Joe Dispenza",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: ytSearch("Joe Dispenza How To Actually Break Bad Habits Diary of a CEO"),
  },
  dispenzaChannel: {
    kind: "meditation",
    title: "Any guided meditation from his official channel",
    teacher: "Dr. Joe Dispenza",
    source: "Dr Joe Dispenza · YouTube",
    url: "https://www.youtube.com/channel/UCSTTPGPS-lm0YVb4DMJ3lTA",
  },

  // ── Gary Brecka ──────────────────────────────────────────────
  breckaDoac: {
    kind: "video",
    title: "The Man Who Can Predict How Long You Have Left To Live",
    teacher: "Gary Brecka",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: yt("r3atRG5wvtg"),
  },
  breckaMorning: {
    kind: "video",
    title: "Gary Brecka's Ultimate Morning Routine: BioHacks & BioStacking",
    teacher: "Gary Brecka",
    source: "The Ultimate Human",
    url: ytSearch("Gary Brecka Ultimate Morning Routine BioHacks BioStacking Ultimate Human"),
  },
  breckaBreathwork: {
    kind: "video",
    title: "Breathwork — Ultimate Human Short",
    teacher: "Gary Brecka",
    source: "The Ultimate Human",
    url: ytSearch("Gary Brecka breathwork Ultimate Human short"),
  },

  // ── Eckhart Tolle ────────────────────────────────────────────
  tolleGoogle: {
    kind: "video",
    title: "Living with Meaning, Purpose and Wisdom in the Digital Age",
    teacher: "Eckhart Tolle",
    source: "Talks at Google",
    url: yt("qE1dWwoJPU0"),
  },
  tollePainBody: {
    kind: "video",
    title: "Understanding the Pain-Body",
    teacher: "Eckhart Tolle",
    source: "Eckhart Tolle · YouTube",
    url: yt("6iK6vSwfAi8"),
  },
  tolleNewEarth: {
    kind: "video",
    title: "A New Earth — Oprah's Book Club",
    teacher: "Eckhart Tolle",
    source: "Oprah · OWN",
    url: ytSearch("Eckhart Tolle A New Earth Oprah's Book Club"),
  },

  // ── Shi Heng Yi ──────────────────────────────────────────────
  shiTedx: {
    kind: "video",
    title: "5 Hindrances to Self-Mastery",
    teacher: "Shi Heng Yi",
    source: "TEDxVitosha",
    url: yt("4-079YIasck"),
  },
  shiDoac: {
    kind: "video",
    title: "Shaolin Warrior Monk: The Hidden Epidemic Nobody Is Talking About",
    teacher: "Shi Heng Yi",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: ytSearch("Shi Heng Yi Shaolin Warrior Monk Hidden Epidemic Diary of a CEO"),
  },
  shiHowes: {
    kind: "video",
    title: "The Shaolin Master's Guide To Vitality & Self-Mastery",
    teacher: "Shi Heng Yi",
    source: "The School of Greatness · Lewis Howes",
    url: ytSearch("Shi Heng Yi Shaolin Master Self Mastery Lewis Howes"),
  },

  // ── Simon Sinek ──────────────────────────────────────────────
  sinekWhy: {
    kind: "video",
    title: "How Great Leaders Inspire Action",
    teacher: "Simon Sinek",
    source: "TED",
    url: yt("qp0HIF3SfI4"),
  },
  sinekInfinite: {
    kind: "video",
    title: "Most Leaders Don't Even Know the Game They're In",
    teacher: "Simon Sinek",
    source: "Live2Lead",
    url: yt("RyTQ5-SQYTo"),
  },

  // ── Robert Greene ────────────────────────────────────────────
  greeneDoac: {
    kind: "video",
    title: "Robert Greene on Power, Mastery & Human Nature",
    teacher: "Robert Greene",
    source: "The Diary Of A CEO · Steven Bartlett",
    url: yt("2CHu-Mh0BB0"),
  },

  // ── Andrew Huberman ──────────────────────────────────────────
  hubermanDopamine: {
    kind: "video",
    title: "Controlling Your Dopamine For Motivation, Focus & Satisfaction",
    teacher: "Andrew Huberman",
    source: "Huberman Lab",
    url: yt("QmOF0crdyRU"),
  },
  hubermanSleep: {
    kind: "video",
    title: "Essentials: Master Your Sleep & Be More Alert When Awake",
    teacher: "Andrew Huberman",
    source: "Huberman Lab",
    url: yt("lIo9FcrljDk"),
  },
  hubermanGoals: {
    kind: "video",
    title: "The Science of Setting & Achieving Goals",
    teacher: "Andrew Huberman",
    source: "Huberman Lab",
    url: yt("t1F7EEGPQwo"),
  },

  // ── Lewis Howes ──────────────────────────────────────────────
  howesGreatness: {
    kind: "video",
    title: "Destroy All Your Fears With My Greatness Mindset",
    teacher: "Lewis Howes",
    source: "Lewis Howes · YouTube",
    url: yt("OvNscoG4_Ys"),
  },

  // ── Books ────────────────────────────────────────────────────
  bookBreakingHabit: {
    kind: "book",
    title: "Breaking the Habit of Being Yourself",
    teacher: "Dr. Joe Dispenza",
    source: "Book",
    url: book("Breaking the Habit of Being Yourself", "Joe Dispenza"),
  },
  bookBecomingSupernatural: {
    kind: "book",
    title: "Becoming Supernatural",
    teacher: "Dr. Joe Dispenza",
    source: "Book",
    url: book("Becoming Supernatural", "Joe Dispenza"),
  },
  bookPowerOfNow: {
    kind: "book",
    title: "The Power of Now",
    teacher: "Eckhart Tolle",
    source: "Book",
    url: book("The Power of Now", "Eckhart Tolle"),
  },
  bookNewEarth: {
    kind: "book",
    title: "A New Earth",
    teacher: "Eckhart Tolle",
    source: "Book",
    url: book("A New Earth", "Eckhart Tolle"),
  },
  bookStartWithWhy: {
    kind: "book",
    title: "Start With Why",
    teacher: "Simon Sinek",
    source: "Book",
    url: book("Start With Why", "Simon Sinek"),
  },
  bookMastery: {
    kind: "book",
    title: "Mastery",
    teacher: "Robert Greene",
    source: "Book",
    url: book("Mastery", "Robert Greene"),
  },
  bookHumanNature: {
    kind: "book",
    title: "The Laws of Human Nature",
    teacher: "Robert Greene",
    source: "Book",
    url: book("The Laws of Human Nature", "Robert Greene"),
  },
  bookShaolinSpirit: {
    kind: "book",
    title: "Shaolin Spirit: The Way to Self-Mastery",
    teacher: "Shi Heng Yi",
    source: "Book",
    url: book("Shaolin Spirit The Way to Self-Mastery", "Shi Heng Yi"),
  },
  bookGreatnessMindset: {
    kind: "book",
    title: "The Greatness Mindset",
    teacher: "Lewis Howes",
    source: "Book",
    url: book("The Greatness Mindset", "Lewis Howes"),
  },
} satisfies Record<string, Resource>;

export type ResourceKey = keyof typeof library;
