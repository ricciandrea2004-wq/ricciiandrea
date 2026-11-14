export type Detector = {
  detector_id: number;
  detector_code: string;
  detector_description: string;
};

export type Centralina = {
  device_id: number;
  device_type: number;
  device_db: number;
  code: string;
  name: string;
  latitude: number;
  longitude: number;
  detectors: Detector[];
};

export type FlowPoint = {
  date: string;
  value: number;
};

export type DeviceFlow = {
  device_id: number;
  detector_id: number;
  device_db: number;
  device_type: number;
  series: FlowPoint[];
  total: number;
  avg: number;
};

export type Accident = {
  date: string;
  latitude: number;
  longitude: number;
  urban: boolean;
  roadType: string;
  roadFeature: string;
  pavementState: string;
  pavementType: string;
  weather: string;
  traffic: string;
  propertyDamage: boolean;
  injuries: boolean;
};

export type DatasetMeta = {
  id: string;
  title: string;
  url: string;
  license: string;
  resourceName?: string;
};

export type VistaDataBundle = {
  syncedAt: string;
  centraline: Centralina[];
  flows: DeviceFlow[];
  accidents: Accident[];
  sources: DatasetMeta[];
  summary: {
    centralineCount: number;
    flowDays: number;
    accidentCount: number;
    injuryAccidents: number;
    cityDailyAvg: number;
  };
};
