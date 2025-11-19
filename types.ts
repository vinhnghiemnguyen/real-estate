
export interface PriceHistory {
  labels: string[];
  avg: number[];
  min: number[];
  max: number[];
}

export interface Project {
  name: string;
  projectUrl: string;
  province: string;
  district: string;
  category: string;
  latitude: number | null;
  longitude: number | null;
  area: string;
  units: string;
  towers: string;
  investor: string;
  attributes: Record<string, string>;
  priceHistory?: PriceHistory | null;
}
