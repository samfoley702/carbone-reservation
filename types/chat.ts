export type ChatStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface ChatMessage {
  role: "bot" | "user";
  text: string;
  id: string; // NOT named 'key' — React reserves 'key' and silently drops it when spreading
}
