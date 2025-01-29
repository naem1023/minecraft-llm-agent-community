export interface Goal {
  id: string;
  description: string;
  requirements: string[];
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
}

export interface BotState {
  inventory: Record<string, number>;
  position: {
    x: number;
    y: number;
    z: number;
  };
  health: number;
  food: number;
} 