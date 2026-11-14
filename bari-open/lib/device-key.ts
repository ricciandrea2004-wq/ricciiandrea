export type DeviceRef = {
  device_db: number;
  device_type: number;
  device_id: number;
};

/** Composite identity: device_id alone repeats across device_db in Bari open data. */
export function deviceKey(ref: DeviceRef): string {
  return `${ref.device_db}:${ref.device_type}:${ref.device_id}`;
}
