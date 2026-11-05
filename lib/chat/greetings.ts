/** Short opening lines for David; one is picked each time a conversation starts. */
export const GREETINGS = [
  "Hi, I'm David from MONIP! How can I help?",
  "Hello! I'm David. What can I do for you?",
  "Hey there, David here. What brings you by?",
  "Hi! I'm David from MONIP. Ask me anything.",
  "Welcome! I'm David. How can I help today?",
];

/** Returns a greeting; `random` is injectable for tests. */
export function pickGreeting(random: () => number = Math.random): string {
  return GREETINGS[Math.floor(random() * GREETINGS.length)];
}
