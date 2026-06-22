export const API = {
  public: 'https://functions.poehali.dev/a2069ea5-e9b6-4074-9d15-89e253d93ca8',
  admin: 'https://functions.poehali.dev/b48a1f59-da3e-496e-be58-482ddcce96bf',
};

export interface Team {
  id: number;
  name: string;
  color: string;
  captain: string | null;
  players_count: number;
}

export interface Player {
  id: number;
  nick: string;
  real_name: string | null;
  contact?: string;
  role: string;
  skin_url: string | null;
  team_name: string | null;
  status?: string;
  created_at?: string;
}

export interface Post {
  id: number;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string | null;
}

export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
