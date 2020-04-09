// PHYSICS CONSTANTS
export const FORCE_GRAVITY = 5.5 / 100000; // note: dt is in milliseconds, so this constant needs to be very small
export const FORCE_ENGINE = 2.5 * FORCE_GRAVITY;
export const COEFFICIENT_DRAG = 0.01;
export const COEFFICIENT_FRICTION = 0.1;

// SCENE
export const SCENE_HEIGHT = 45;
export const SCENE_WIDTH = 100;

// FURNITURE
export const PLATFORM_LEFT = 50;
export const PLATFORM_WIDTH = 30;
export const COIN_WIDTH = 4;
export const COIN_HEIGHT = 8;

// VEHICLE
export const VEHICLE_WIDTH = 10;
export const VEHICLE_HEIGHT = 6;
export const VEHICLE_CRASH_VELOCITY = 0.05;
export const VEHICLE_ZERO_VELOCITY = 1e-4;
export const VEHICLE_MAX_ALTITUDE = 1000;

// WIND
export const WIND_VELOCITY_X_INITIAL = 4 / 100;
export const WIND_VELOCITY_X_INCREMENTAL = 5 / 1000;
