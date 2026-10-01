// ============================================================================
// VERDICT DATABASE & LOGIC
// "Should I Text My Ex?" - Decision Oracle
// ============================================================================

export const VERDICTS = {
  NO: {
    category: 'NO',
    title: 'ABSOLUTELY NOT 🚫',
    color: '#ff2e88',
    glowColor: '#ff0055',
    regretRange: [85, 99],
    quotes: [
      "You blocked them for a reason. Remember the reason.",
      "They haven't changed. They're still emotionally unavailable and bad at replying.",
      "Put the phone in the freezer, step back, and drink a glass of ice-cold water.",
      "Do you miss them, or are you just listening to sad songs at 2 AM with 4% battery?",
      "Your future therapist is screaming, crying, and begging you not to press send.",
      "Go look in the mirror. You are an 11/10 celestial masterpiece. Stop clowning in their DMs.",
      "Texting right now has a 99.8% chance of ending in an unread receipt and spiraling.",
      "Write whatever you wanted to say in your Notes app, delete it at sunrise, and thank the universe.",
      "Even their pet knows you deserved better. Keep your dignity completely intact.",
      "If you send that text, you owe everyone in your group chat a handwritten apology."
    ],
    personalizedTemplates: [
      "Do NOT text {name}. You deserve someone who actually replies on time.",
      "Think about every headache {name} gave you. Put down the phone.",
      "Listen closely: {name} is NOT the main character of your story anymore.",
      "{name} is living rent-free in your mind. Evict them immediately.",
      "Texting {name} right now will undo 6 months of character development."
    ]
  },
  MAYBE: {
    category: 'MAYBE',
    title: 'ASK YOURSELF AGAIN 🤔',
    color: '#ffb703',
    glowColor: '#ff9e00',
    regretRange: [45, 75],
    quotes: [
      "Wait 24 hours. If you still want to, text them. Then regret it.",
      "Only allowed if you have a trusted friend proofreading it and holding your bank card.",
      "Flip a coin. While it's mid-air, your subconscious will finally tell you the truth.",
      "Is it genuine closure, or are you just seeking quick validation because it's quiet?",
      "Ask your brutally honest friend first. If their eyebrow twitches, abort mission.",
      "Sleep on it. If it still makes sense tomorrow at 11 AM in broad daylight, proceed with caution.",
      "Send a low-stakes meme first. If they hit you with 'k', you have your answer.",
      "Only if you're returning their expensive property. Otherwise, preserve the mystery.",
      "Check your battery. Low battery leads to high-risk emotional decisions.",
      "Draft it on paper first. Read it aloud. If you cringe even 1%, throw it away."
    ],
    personalizedTemplates: [
      "Wait 24 hours before you reach out to {name}. The urge might vanish.",
      "Are you missing {name}, or just the routine? Ask yourself twice.",
      "If you text {name}, keep it strictly business. Zero emotional essays.",
      "Have a friend review what you want to send to {name} before hitting send."
    ]
  },
  YES: {
    category: 'YES',
    title: 'FINE, TEXT THEM 😬',
    color: '#00f5d4',
    glowColor: '#05d5b5',
    regretRange: [12, 35],
    quotes: [
      "Keep it short. No 3 a.m. poetry.",
      "Life is short and pride is heavy. But do NOT double-text under any circumstance.",
      "Send it, throw your phone across the room, and do not look back for 3 hours.",
      "Casual vibe only. One sentence maximum. Exactly zero exclamation points.",
      "Fine, shoot your shot. But if it goes sideways, remember the oracle warned you.",
      "Closure is a myth, but curiosity is real. Send a calm check-in and let fate handle it.",
      "You've survived 100% of your bad decisions so far. What's one more calculated risk?",
      "Green light granted. Spine straight, cool head, and no waiting by the notification light.",
      "If it's honest and not passive-aggressive, send it and release all expectations."
    ],
    personalizedTemplates: [
      "Fine, text {name}. But keep it short: no 3 a.m. poetry.",
      "Send a quick check-in to {name}. If they leave you on read, move on forever.",
      "Message {name} once, then lock your phone and go touch grass."
    ]
  }
};

// Track consecutive 'Ask again' taps for the Easter Egg
let retryCount = 0;
const RETRY_LIMIT_FOR_EASTER_EGG = 5;

/**
 * Returns a weighted random category based on configured probabilities:
 * 55% NO, 30% MAYBE, 15% YES
 */
export function getWeightedCategory(weights = { NO: 0.55, MAYBE: 0.30, YES: 0.15 }) {
  const rand = Math.random();
  if (rand < weights.NO) {
    return 'NO';
  } else if (rand < weights.NO + weights.MAYBE) {
    return 'MAYBE';
  } else {
    return 'YES';
  }
}

/**
 * Generates a complete verdict payload with quotes, personalized text, and regret score
 */
export function generateVerdict(name = '', weights) {
  retryCount++;

  // Easter Egg: user keeps re-rolling 5+ times in a row!
  if (retryCount >= RETRY_LIMIT_FOR_EASTER_EGG) {
    return {
      isEasterEgg: true,
      category: 'EASTER_EGG',
      title: 'PUT THE PHONE DOWN 💧',
      quote: "You already know the answer. Go drink water.",
      subtext: "You tapped this 5 times hoping the universe would change its mind. It won't. Hydrate and sleep.",
      color: '#38bdf8',
      glowColor: '#0284c7',
      regretScore: 100,
      retryCount
    };
  }

  const categoryKey = getWeightedCategory(weights);
  const data = VERDICTS[categoryKey];

  // Pick random quote
  const cleanName = name.trim();
  let quote = '';

  if (cleanName && data.personalizedTemplates && Math.random() > 0.3) {
    const template = data.personalizedTemplates[Math.floor(Math.random() * data.personalizedTemplates.length)];
    quote = template.replace(/\{name\}/g, cleanName);
  } else {
    quote = data.quotes[Math.floor(Math.random() * data.quotes.length)];
    if (cleanName && categoryKey === 'NO') {
      quote = `Do NOT text ${cleanName}. ${quote}`;
    }
  }

  // Calculate regret percentage in range
  const [minRegret, maxRegret] = data.regretRange;
  const regretScore = Math.floor(minRegret + Math.random() * (maxRegret - minRegret + 1));

  return {
    isEasterEgg: false,
    category: data.category,
    title: data.title,
    quote,
    color: data.color,
    glowColor: data.glowColor,
    regretScore,
    name: cleanName,
    retryCount
  };
}

/**
 * Resets the easter egg retry counter
 */
export function resetRetryCounter() {
  retryCount = 0;
}

/**
 * Web Share API with clipboard fallback
 */
export async function shareVerdict(verdict, onToast) {
  const shareText = `The Oracle says: "${verdict.title} - ${verdict.quote}" 😭\nEstimated Regret: ${verdict.regretScore}%\nTry yours:`;
  const shareUrl = window.location.href;

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'Should I Text My Ex? 👀',
        text: shareText,
        url: shareUrl
      });
      return true;
    } catch (err) {
      if (err.name === 'AbortError') return false; // user cancelled
    }
  }

  // Fallback to Clipboard API
  try {
    const fullMessage = `${shareText} ${shareUrl}`;
    await navigator.clipboard.writeText(fullMessage);
    if (onToast) onToast('Copied to clipboard! 📋');
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textarea = document.createElement('textarea');
    textarea.value = `${shareText} ${shareUrl}`;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    if (onToast) onToast('Copied to clipboard! 📋');
    return true;
  }
}
