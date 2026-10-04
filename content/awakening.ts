// THE AWAKENING — the free, one-sitting entry point into THE IDENTITY RESET.
// Voice: Jac talking to his bro. First-person lines only state things Jac has
// actually told us (6 years exploring, the music shift, Ghiyam + Dispenza moved
// him most, Brecka for health). Everything else is framed as perspective.

import { library, type ResourceKey } from "./library";

export type AwakeningSection = {
  id: string;
  number: string;
  label: string;
  title: string;
  body: string[];
  practice?: { name: string; steps: string[] };
  questions: string[];
  /** Pull-quote shown large. */
  line?: string;
};

export const awakeningIntro = {
  kicker: "THE AWAKENING",
  title: "You were never taught you only get one life.",
  body: [
    "This isn't a course. It's not a five-day challenge. You'll get through it in about twenty minutes. Grab a pen, or just use the boxes on this page. What you write stays on your device. Nobody sees it but you.",
    "I've spent about six years going deep on this stuff: books, podcasts, teachers, experiments on myself. I'm not at the finish line. But I've gone far enough to show you what I found, and to save you a few of those years.",
    "Here's the only rule: don't skim the questions. The reading takes five minutes. The questions are where it happens.",
  ],
};

export const awakeningSections: AwakeningSection[] = [
  {
    id: "ground-zero",
    number: "01",
    label: "GROUND ZERO",
    title: "Existing is not the same as living.",
    body: [
      "Most people don't choose their life. They inherit it, then spend decades maintaining it.",
      "You wake up, run the same routine, think the same thoughts, react the same way, and call that \"who I am.\" It's not a personality. It's a loop.",
      "Ground zero isn't a breakdown. It's the quiet moment you notice the loop. That feeling of \"there has to be more to this\" isn't a problem to fix. It's the first sign you're waking up.",
    ],
    line: "That feeling of “there has to be more” isn't a problem. It's a signal.",
    questions: [
      "If the next five years looked exactly like the last twelve months, how would you honestly feel?",
      "Which parts of your day did you actually choose, and which parts are just on repeat?",
      "When was the last time you felt fully alive? What were you doing?",
    ],
  },
  {
    id: "installed",
    number: "02",
    label: "INSTALLED",
    title: "You don't realize how much of your personality was installed.",
    body: [
      "Your beliefs about money, success, God, your body, what's possible for someone like you: you didn't sit down and choose most of them. They were handed to you by family, school, friends, culture, the feed, and a few moments that hurt.",
      "That doesn't make them wrong. It makes them unexamined. And you can't consciously change something you've never noticed.",
      "The reset doesn't start with becoming someone new. It starts with asking one question about everything you believe: is this mine, or was it given to me?",
    ],
    practice: {
      name: "The Inventory",
      steps: [
        "Finish these four sentences without thinking too hard: “Money is…”, “People like me…”, “Success means…”, “I'm the kind of person who…”",
        "Next to each answer, write who taught it to you: a parent, a teacher, a friend, the internet.",
        "Circle the ones you'd still choose today if you were starting from zero.",
      ],
    },
    questions: [
      "Which belief on your list surprised you the most when you wrote down where it came from?",
      "Whose approval are you still quietly living for?",
      "If nobody you know would ever find out, what would you change about your life tomorrow?",
    ],
  },
  {
    id: "inputs",
    number: "03",
    label: "THE INPUTS",
    title: "What you repeatedly consume becomes the environment your mind lives inside.",
    body: [
      "One of the first things that shifted it for me was small: I changed the music I listened to. No big moment. Just different inputs, every day. Over time, I started thinking differently. Then I started acting differently.",
      "That's when it clicked. Your mind is built out of whatever you keep putting into it: music, the feed, the people you talk to, the food you eat, the room you wake up in.",
      "Most people try to change their life by forcing their behavior. It's easier to change the inputs and let the behavior follow.",
    ],
    line: "Change the inputs. The identity follows.",
    practice: {
      name: "The 24-Hour Audit",
      steps: [
        "List everything you consumed in the last 24 hours: songs, accounts, shows, conversations, food.",
        "Mark each one: ↑ (it lifts you), → (neutral), ↓ (it drains or shrinks you).",
        "Pick one ↓ and replace it for the next seven days. Just one.",
      ],
    },
    questions: [
      "If a stranger only saw what you consumed yesterday, who would they think you are?",
      "Which input do you already know you need to cut, and why haven't you?",
      "What would you put in its place?",
    ],
  },
  {
    id: "observer",
    number: "04",
    label: "THE OBSERVER",
    title: "The person you call “you” might just be conditioning.",
    body: [
      "Here's a lens I keep coming back to. Teachers like Eckhart Tolle describe it in different words, but the idea is simple: you are not your thoughts. You're the one noticing them.",
      "Watch for a minute and you'll see it. A thought shows up, a feeling follows, and you react. Usually you're so fused with the thought that you don't even see it happen. You just become it.",
      "The moment you notice a thought instead of obeying it, you've found the gap. And in that gap, for the first time, you have a choice.",
    ],
    practice: {
      name: "Sixty Seconds",
      steps: [
        "Set a timer for 60 seconds. Close your eyes.",
        "Don't try to stop your thoughts. Just watch them arrive, like cars passing on a street.",
        "Each time you notice one, say silently: “there's a thought.” That's it.",
      ],
    },
    questions: [
      "What thought showed up most during those sixty seconds?",
      "Is that thought true, or is it just familiar?",
      "Who would you be without that thought?",
    ],
  },
  {
    id: "choice",
    number: "05",
    label: "THE CHOICE",
    title: "Maybe you don't need a new life. Maybe you need a new identity.",
    body: [
      "Once you see the installation, you get something most people never get: a choice.",
      "That doesn't mean becoming someone fake. You may just need to become conscious enough to see which parts of you were never really yours. Keep what's true. Let go of what you were handed.",
      "Then you start building on purpose: what you consume, how you treat your body, what you think about, how you show up. Not all at once. One honest step at a time.",
    ],
    line: "Keep what's true. Release what was handed to you.",
    questions: [
      "Describe the version of you that you'd genuinely respect. How do they spend a normal Tuesday?",
      "What would your life look like if fear had no vote?",
      "What does God, purpose, or something bigger than you mean to you right now? (Any answer is fine. “I don't know” is a real answer.)",
      "What's one thing you could do in the next 24 hours that version of you would do?",
    ],
  },
];

export const awakeningShelf: { key: ResourceKey; why: string }[] = [
  {
    key: "bookBreakingHabit",
    why: "Start here. The whole idea of this book is that your personality is a set of habits you can break. Joe Dispenza is one of the two teachers who changed me the most.",
  },
  {
    key: "bookPowerOfNow",
    why: "The clearest map of the observer lens from section 04. Read it slowly. Some lines need a second pass.",
  },
  {
    key: "bookStartWithWhy",
    why: "Once you start questioning your identity, you'll start questioning your direction. This one helps you find your why before you chase your what.",
  },
  {
    key: "bookMastery",
    why: "A grounded counterweight to the spiritual side. It's about your life's task and the long, patient work of becoming great at something.",
  },
  {
    key: "bookShaolinSpirit",
    why: "Self-mastery from someone who lives it daily. Discipline framed as freedom, not punishment.",
  },
];

/** One free video to watch tonight, a taste of how THE IDENTITY RESET is curated. */
export const awakeningTonight = {
  key: "dispenzaImpactTheory" as ResourceKey,
  why: "If you only watch one thing this week, watch this. Dispenza breaks down how your personality creates your personal reality, and why changing one means changing the other.",
};

export const awakeningTruth = {
  label: "THE TRUTH",
  title: "Awakening isn't a destination. It's a process.",
  body: [
    "If something in here hit you, that's the first shift. Most people stop there. They have the realization, feel it for a day, then go back to the loop.",
    "Information alone doesn't transform anyone. Transformation happens when information changes how you see yourself, and that takes structure, sequence, and time.",
    "It took me around six years of trial and error to figure out what to read, who to listen to, and in what order. I built THE IDENTITY RESET so you don't have to.",
  ],
};

export const resolveShelf = () =>
  awakeningShelf.map((b) => ({ ...library[b.key], why: b.why }));
