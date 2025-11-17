'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  MapPin,
  Navigation,
  Trash2,
  Plus,
  Edit,
  Check,
  X,
  Search,
  Loader2,
} from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  isDefault?: boolean;
}

const SAVED_LOCATIONS_KEY = 'enduro-saved-locations';

export function LocationSettingsClient() {
  const {
    location,
    requestLocation,
    setManualLocation,
    clearLocation,
    permissionStatus,
    hasLocationPermission,
  } = useLocation();

  const [savedLocations, setSavedLocations] = useState<SavedLocation[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_LOCATIONS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLocation, setEditingLocation] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    lat: '',
    lon: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    Array<{
      display_name: string;
      lat: string;
      lon: string;
    }>
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [setAsCurrent, setSetAsCurrent] = useState(true); // Default to true
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const saveLocations = (locations: SavedLocation[]) => {
    try {
      localStorage.setItem(SAVED_LOCATIONS_KEY, JSON.stringify(locations));
      setSavedLocations(locations);
    } catch (error) {
      console.error('Error saving locations:', error);
    }
  };

  const handleAddLocation = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);

    if (!isNaN(lat) && !isNaN(lon) && formData.name.trim()) {
      const newLocation: SavedLocation = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        lat,
        lon,
      };

      const updated = [...savedLocations, newLocation];
      saveLocations(updated);

      // Set as current location if checkbox is checked
      if (setAsCurrent) {
        setManualLocation(lat, lon, formData.name.trim());
      }

      setFormData({ name: '', lat: '', lon: '' });
      setSearchQuery('');
      setSearchResults([]);
      setShowSearchResults(false);
      setSetAsCurrent(true); // Reset to default
      setShowAddForm(false);
    }
  };

  const handleEditLocation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLocation) return;

    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);

    if (!isNaN(lat) && !isNaN(lon) && formData.name.trim()) {
      const updated = savedLocations.map(loc =>
        loc.id === editingLocation
          ? { ...loc, name: formData.name.trim(), lat, lon }
          : loc
      );
      saveLocations(updated);

      setFormData({ name: '', lat: '', lon: '' });
      setEditingLocation(null);
    }
  };

  const handleDeleteLocation = (id: string) => {
    const updated = savedLocations.filter(loc => loc.id !== id);
    saveLocations(updated);
  };

  const handleSetAsCurrent = (savedLocation: SavedLocation) => {
    setManualLocation(savedLocation.lat, savedLocation.lon, savedLocation.name);
  };

  // Search for locations using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      // Use Nominatim API (free, no API key required)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EnduroRevamp/1.0', // Required by Nominatim
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching locations:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      searchLocations(value);
    }, 300);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelectSearchResult = (result: {
    display_name: string;
    lat: string;
    lon: string;
  }) => {
    // Extract a shorter name from the display name (usually "City, Country" or "Address, City")
    const nameParts = result.display_name.split(',');
    const shortName = nameParts[0].trim();

    setFormData({
      name: shortName,
      lat: result.lat,
      lon: result.lon,
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
  };

  const handleRequestGPSLocation = async () => {
    try {
      await requestLocation();
    } catch (error) {
      console.error('Failed to get GPS location:', error);
    }
  };

  const getLocationSourceIcon = () => {
    switch (location.source) {
      case 'geolocation':
        return <Navigation className="h-4 w-4" />;
      case 'manual':
        return <MapPin className="h-4 w-4" />;
      case 'saved':
        return <MapPin className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getLocationSourceText = () => {
    switch (location.source) {
      case 'geolocation':
        return 'GPS Location';
      case 'manual':
        return 'Manual';
      case 'saved':
        return 'Saved';
      default:
        return 'Default';
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Current Location
          </CardTitle>
          <CardDescription>
            Your current location used for weather data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {getLocationSourceIcon()}
              <div>
                <div className="font-medium">{location.name}</div>
                <div className="text-sm text-gray-500">
                  {location.lat.toFixed(4)}, {location.lon.toFixed(4)}
                </div>
              </div>
            </div>
            <Badge variant="outline">{getLocationSourceText()}</Badge>
          </div>

          <div className="flex gap-2">
            {hasLocationPermission && (
              <Button
                onClick={handleRequestGPSLocation}
                variant="outline"
                size="sm"
              >
                <Navigation className="h-4 w-4 mr-2" />
                Use GPS Location
              </Button>
            )}
            <Button onClick={() => setShowAddForm(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add New Location
            </Button>
          </div>

          {permissionStatus === 'denied' && (
            <Alert>
              <AlertDescription>
                Location access was denied. You can still add locations manually
                or change your browser settings.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Location Form */}
      {(showAddForm || editingLocation) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              {editingLocation ? 'Edit Location' : 'Add New Location'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={
                editingLocation ? handleEditLocation : handleAddLocation
              }
              className="space-y-4"
            >
              {/* Location Search */}
              <div className="space-y-2">
                <Label htmlFor="locationSearch">Search for a Location</Label>
                <div className="relative" ref={searchContainerRef}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="locationSearch"
                    value={searchQuery}
                    onChange={e => {
                      const value = e.target.value;
                      handleSearchChange(value);
                    }}
                    onFocus={() => {
                      if (searchResults.length > 0) {
                        setShowSearchResults(true);
                      }
                    }}
                    placeholder="Search for a city, address, or place..."
                    className="pl-10"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                  )}

                  {/* Search Results Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleSelectSearchResult(result)}
                          className="w-full text-left px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                        >
                          <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {result.display_name.split(',')[0]}
                              </div>
                              <div className="text-xs text-gray-500 truncate">
                                {result.display_name
                                  .split(',')
                                  .slice(1)
                                  .join(',')
                                  .trim()}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Search for a place by name, or enter coordinates manually
                  below
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="locationName">Location Name</Label>
                <Input
                  id="locationName"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Home, Work, Gym, or city name"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    value={formData.lat}
                    onChange={e =>
                      setFormData({ ...formData, lat: e.target.value })
                    }
                    placeholder="Auto-filled from search"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    value={formData.lon}
                    onChange={e =>
                      setFormData({ ...formData, lon: e.target.value })
                    }
                    placeholder="Auto-filled from search"
                    required
                  />
                </div>
              </div>

              {/* Set as current location checkbox - only show when adding new location */}
              {!editingLocation && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="setAsCurrent"
                    checked={setAsCurrent}
                    onChange={e => setSetAsCurrent(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="setAsCurrent"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Set as current location
                  </Label>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  <Check className="h-4 w-4 mr-2" />
                  {editingLocation ? 'Update' : 'Add'} Location
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowAddForm(false);
                    setEditingLocation(null);
                    setFormData({ name: '', lat: '', lon: '' });
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowSearchResults(false);
                    setSetAsCurrent(true); // Reset to default
                  }}
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Saved Locations */}
      {savedLocations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Saved Locations
            </CardTitle>
            <CardDescription>
              Your saved locations for quick access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {savedLocations.map(savedLocation => (
                <div
                  key={savedLocation.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-gray-500" />
                    <div>
                      <div className="font-medium">{savedLocation.name}</div>
                      <div className="text-sm text-gray-500">
                        {savedLocation.lat.toFixed(4)},{' '}
                        {savedLocation.lon.toFixed(4)}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleSetAsCurrent(savedLocation)}
                      size="sm"
                      variant="outline"
                    >
                      Use
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingLocation(savedLocation.id);
                        setFormData({
                          name: savedLocation.name,
                          lat: savedLocation.lat.toString(),
                          lon: savedLocation.lon.toString(),
                        });
                        setSearchQuery('');
                        setSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      size="sm"
                      variant="outline"
                      aria-label={`Edit ${savedLocation.name}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleDeleteLocation(savedLocation.id)}
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      aria-label={`Delete ${savedLocation.name}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Clear All Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5" />
            Clear Location Data
          </CardTitle>
          <CardDescription>
            Remove all saved locations and reset to default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              clearLocation();
              saveLocations([]);
            }}
            variant="outline"
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All Location Data
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
