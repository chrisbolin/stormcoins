// PHYSICS CONSTANTS
export const FORCE_GRAVITY = 5.5 / 100000; // note: dt is in milliseconds, so this constant needs to be very small
export const FORCE_ENGINE = 2.5 * FORCE_GRAVITY;
export const COEFFICIENT_DRAG = 0.01;
export const COEFFICIENT_FRICTION = 0.1;

// SCENE
// The screen is a 100 x 100 square. The bottom 1 is ground below the platform,
// which leaves 99 of sky above it.
export const SCENE_HEIGHT = 99;
export const SCENE_WIDTH = 100;

// FURNITURE
export const PLATFORM_LEFT = 50;
export const PLATFORM_WIDTH = 30;
export const COIN_WIDTH = 7.2;
export const COIN_HEIGHT = 7.2;

// VEHICLE
export const VEHICLE_WIDTH = 14.4;
// match copter-sprite.png frame aspect ratio (140 x 64)
export const VEHICLE_HEIGHT = (VEHICLE_WIDTH * 64) / 140;
export const VEHICLE_CRASH_VELOCITY = 0.05;
export const VEHICLE_ZERO_VELOCITY = 1e-4;
export const VEHICLE_MAX_ALTITUDE = 1000;

// ART
// the copter's sprite is 35 art pixels wide. All sprites but the coin share this grid
export const ART_PIXEL = VEHICLE_WIDTH / 35;

// PLATFORM SPRITE
// helipad-sprite.png is 73 x 14 art pixels, as close as the grid gets to PLATFORM_WIDTH
export const PLATFORM_SPRITE_WIDTH = 73 * ART_PIXEL;
export const PLATFORM_SPRITE_HEIGHT = 14 * ART_PIXEL;
// positionY 0 is drawn this far above the ground, so skids rest on the deck
export const DECK_LIFT = 4 * ART_PIXEL;
// above this, the top of the copter is past the top of the screen and the engine cuts out
export const VEHICLE_CEILING = SCENE_HEIGHT - DECK_LIFT - VEHICLE_HEIGHT;

// CRASH
// crash-sprite.png is 18 frames of 96 x 56 art pixels
export const CRASH_FRAMES = 18;
export const CRASH_DURATION = CRASH_FRAMES * 70; // milliseconds
export const CRASH_SPRITE_WIDTH = 96 * ART_PIXEL;
export const CRASH_SPRITE_HEIGHT = 56 * ART_PIXEL;

// WIND
export const WIND_VELOCITY_X_INITIAL = 4 / 100;
export const WIND_VELOCITY_X_INCREMENTAL = 5 / 1000;
