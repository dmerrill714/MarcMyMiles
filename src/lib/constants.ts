/** A trip arms once GPS speed reaches this value. */
export const AUTO_START_MPH = 20;

/** Speed must stay at or above the start threshold for this long. */
export const AUTO_START_SUSTAIN_MS = 5_000;

/** Once moving this slowly, the end-of-trip countdown begins. */
export const AUTO_STOP_MPH = 3;

/** A trip ends after this long below the stop speed with no motion. */
export const AUTO_STOP_AFTER_MS = 120_000;

/** Locations worse than this are not trusted for distance or speed. */
export const MAX_FIX_ACCURACY_M = 100;

/** A single GPS segment faster than this is treated as a jump, not driving. */
export const MAX_SEGMENT_MPH = 130;

// Keep the original storage namespace so renaming the app never orphans existing data.
export const TRIPS_STORAGE_KEY = 'milelog.trips.v1';
export const DETECTION_STORAGE_KEY = 'milelog.detection.v1';
export const VEHICLES_STORAGE_KEY = 'milelog.vehicles.v1';
export const ACTIVE_VEHICLE_STORAGE_KEY = 'milelog.active-vehicle.v1';
export const INSTALL_PROMPT_STORAGE_KEY = 'milelog.install-prompt.v1';
export const REPORT_LOG_NUMBER_STORAGE_KEY = 'milelog.report-log-number.v1';
