export interface ISession {
  role: "system" | "user" | "assistant";
  content: string;
}
