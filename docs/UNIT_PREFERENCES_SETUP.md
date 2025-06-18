# Unit Preferences System - localStorage Implementation

## Overview
Simple unit switching system using localStorage for persistence. Users can toggle between km/miles and the preference is saved locally in their browser.

## Architecture

### Core Components
1. **`lib/utils.ts`** - Unit conversion utilities
2. **`hooks/useUnitPreferences.ts`** - localStorage-based preferences hook
3. **`components/settings/UnitPreferences.tsx`** - Settings UI

### Data Flow
```
User changes preference → Update state → Save to localStorage
```

## Implementation Details

### 1. Unit Conversion System (`lib/utils.ts`)

```typescript
// Types
export type DistanceUnit = 'km' | 'miles'
export type PaceUnit = 'min/km' | 'min/mile'

// Conversion constants
const CONVERSION_CONSTANTS = {
  KM_TO_MILES: 0.621371,
  MILES_TO_KM: 1.60934,
}

// Helper functions
export function formatDistance(meters: number, unit: DistanceUnit): string
export function formatPace(secondsPerKm: number, unit: PaceUnit): string
```

### 2. Preferences Hook (`hooks/useUnitPreferences.ts`)

```typescript
interface UnitPreferences {
  distance: DistanceUnit
  pace: PaceUnit
}

export function useUnitPreferences() {
  const [preferences, setPreferences] = useState<UnitPreferences>()
  const [isLoading, setIsLoading] = useState(true)
  
  // Loads from localStorage on mount
  // Saves to localStorage on change
  // Provides toggleUnits() helper
}
```

### 3. Settings UI (`components/settings/UnitPreferences.tsx`)

Simple toggle buttons with live examples showing current unit formatting.

## Usage in Components

Replace hardcoded unit formatting with the hook:

```typescript
// Before
const distance = `${(meters / 1000).toFixed(1)} km`

// After  
const { preferences } = useUnitPreferences()
const distance = formatDistance(meters, preferences.distance)
```

## Benefits of localStorage Approach

✅ **Simple** - No database complexity, migrations, or error handling  
✅ **Fast** - No network requests required  
✅ **Reliable** - No server dependencies  
✅ **Immediate** - Works instantly without setup  
✅ **Appropriate** - Matches the scope of the feature  

## Tradeoffs

❌ **No cross-device sync** - Settings don't sync between devices  
❌ **Lost on clear data** - Resets if user clears browser data  

For a fitness app where users primarily use one device and unit preferences are a simple display setting, localStorage is the right choice.

## Testing

All unit conversion logic is tested:
- 17 tests covering distance/pace conversion
- Edge cases and validation
- Format consistency

```bash
npm test -- --testPathPattern="lib/utils"  # ✅ 17/17 passed
``` 