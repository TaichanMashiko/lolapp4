// Data Models

export interface Advice {
  timestamp: string; // ISO String
  video_title: string;
  video_url: string;
  content: string;
  role_tags: string; // Comma separated, e.g., "Top, Mid"
  champion_tags: string; // Comma separated, e.g., "Ahri, Yasuo"
  category: 'Laning' | 'Teamfight' | 'Vision' | 'Macro' | 'Mental';
  importance: 'High' | 'Medium' | 'Low';
}

export interface MatchRecord {
  timestamp: string;
  role: string;
  champion: string;
  result: 'Win' | 'Loss';
  achievement_rate: number; // 0-100
  checked_count: number;
  total_count: number;
  note: string;
}

export interface AppConfig {
  spreadsheetId: string;
  apiKey: string; // For Gemini
  clientId: string; // For Google Auth
}

// Global Window extensions for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export enum Role {
  TOP = 'Top',
  JUNGLE = 'Jungle',
  MID = 'Mid',
  ADC = 'ADC',
  SUPPORT = 'Support',
  GENERAL = 'General'
}

export const ROLES_LIST = [Role.TOP, Role.JUNGLE, Role.MID, Role.ADC, Role.SUPPORT];

export enum Category {
  LANING = 'Laning',
  TEAMFIGHT = 'Teamfight',
  VISION = 'Vision',
  MACRO = 'Macro',
  MENTAL = 'Mental'
}

export enum Importance {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}