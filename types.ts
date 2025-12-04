export enum ResourceType {
  SHELTER = 'SHELTER',
  WATER = 'WATER',
  MEDICAL = 'MEDICAL',
  DANGER = 'DANGER'
}

export enum ResourceStatus {
  OPERATIONAL = 'OPERATIONAL', // Green
  CROWDED = 'CROWDED', // Amber
  CRITICAL = 'CRITICAL', // Red
  UNKNOWN = 'UNKNOWN' // Gray
}

export interface Coordinates {
  x: number; // 0-100 relative grid position
  y: number; // 0-100 relative grid position
}

export interface ResourcePoint {
  id: string;
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  location: Coordinates;
  lastUpdated: string;
  notes: string;
  distance?: string; // e.g. "0.5km"
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  text: string;
  links?: { title: string; uri: string }[];
}

// For parsing AI response
export interface ParsedReport {
  name: string;
  type: ResourceType;
  status: ResourceStatus;
  notes: string;
}
