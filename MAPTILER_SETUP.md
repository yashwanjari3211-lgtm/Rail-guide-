# MapTiler Location Picker Setup Guide

## 1. Get Your MapTiler API Key

1. Go to [MapTiler Cloud](https://www.maptiler.com/cloud/)
2. Sign up for a free account (50,000 free map loads per month)
3. Navigate to your dashboard and copy your API key
4. The free tier includes:
   - 50,000 map loads per month
   - Multiple map styles
   - Basic geocoding
   - Perfect for development and small projects

## 2. Configure Environment Variables

Add your MapTiler API key to your `.env.local` file:

```bash
# MapTiler Configuration
VITE_MAPTILER_API_KEY=your_maptiler_api_key_here
```

If you don't have a `.env.local` file, create one in the root directory.

## 3. Install Dependencies

The MapTiler SDK has already been added to your `package.json`. Run:

```bash
npm install
```

This will install `@maptiler/sdk` along with other dependencies.

## 4. How the Location Picker Works

### Features Implemented:
1. **Interactive Map**: Click anywhere on the map to place a marker
2. **Current Location**: Use browser geolocation to detect your position
3. **Single Marker**: Only one marker at a time (replaces previous)
4. **Coordinates Display**: Shows selected latitude and longitude
5. **Error Handling**: Handles permission denials and geolocation errors
6. **Map Panning**: Automatically centers on selected location

### Component Structure:
- `LocationPicker.tsx`: Main map component with MapTiler integration
- Integrated into App.tsx as a new "Location" tab
- Modal overlay for full-screen map interaction

## 5. Using the Location Picker

### In Your App:
1. Click the "Location" tab in the bottom navigation
2. You'll see:
   - Current detected location (if available)
   - Any previously saved location
   - "Pick My Location on Map" button
   - "Use My Current Location" button

### Map Interface:
- **Click on map**: Places a marker at clicked location
- **Target button**: Uses browser geolocation
- **Confirm button**: Saves the selected location
- **Coordinates**: Displayed in real-time below the map

## 6. Saving Locations to Backend/State

The location is saved to React state by default. To save to a backend:

### Option 1: Save to Local Storage
```typescript
const handleLocationSelect = (selectedLocation: { lat: number; lng: number }) => {
  setSavedLocation(selectedLocation);
  setLocation(selectedLocation);
  
  // Save to localStorage
  localStorage.setItem('userLocation', JSON.stringify(selectedLocation));
  
  // You can also save to your backend here
  // await saveToBackend(selectedLocation);
};
```

### Option 2: Save to Your Backend API
```typescript
const saveToBackend = async (location: { lat: number; lng: number }) => {
  try {
    const response = await fetch('/api/user/location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(location)
    });
    return await response.json();
  } catch (error) {
    console.error('Failed to save location:', error);
  }
};
```

## 7. Using Location for Journey Planning

The saved location is automatically used in the AI journey planning. In `gemini.ts`:

```typescript
// The location is passed to getJourneyPlan function
const result = await getJourneyPlan(userMsg, location);
```

This allows the AI to provide better journey recommendations based on your location.

## 8. Error Handling

The component handles these scenarios:
- **No API Key**: Shows error message
- **Geolocation Denied**: User-friendly permission error
- **Geolocation Unavailable**: Browser compatibility message
- **Map Load Failure**: Network/API error handling

## 9. Customization Options

### Change Map Style:
In `LocationPicker.tsx`, modify the `style` property:
```typescript
style: 'streets-v2' // Options: 'streets-v2', 'basic-v2', 'bright-v2', 'dark-v2'
```

### Change Default Center:
```typescript
const defaultCenter = { lat: 28.6139, lng: 77.2090 }; // New Delhi
```

### Change Marker Color:
```typescript
const marker = new Marker({ color: '#6366f1' }) // Indigo color
```

## 10. Production Considerations

1. **API Key Security**: Never commit API keys to version control
2. **Rate Limiting**: Monitor usage in MapTiler dashboard
3. **Error Monitoring**: Implement proper error logging
4. **User Experience**: Consider adding loading states for slow connections
5. **Accessibility**: Ensure map controls are keyboard accessible

## 11. Troubleshooting

### Map Not Loading:
1. Check API key in `.env.local`
2. Verify internet connection
3. Check browser console for errors
4. Ensure MapTiler account is active

### Geolocation Not Working:
1. Check browser permissions
2. Try on HTTPS (geolocation requires secure context)
3. Test on mobile device for better accuracy

### Marker Not Appearing:
1. Check click events are registered
2. Verify MapTiler SDK loaded correctly
3. Check for JavaScript errors

## 12. Next Steps

1. **Geocoding**: Add address search functionality
2. **Reverse Geocoding**: Convert coordinates to addresses
3. **Directions**: Add route planning between points
4. **Multiple Markers**: Support for origin/destination selection
5. **Map Layers**: Add train routes, stations, etc.

## Support

- [MapTiler Documentation](https://docs.maptiler.com/)
- [MapTiler SDK GitHub](https://github.com/maptiler/maptiler-sdk-js)
- [React Integration Examples](https://docs.maptiler.com/sdk-js/examples/)

---

**Note**: The free MapTiler tier is sufficient for development and small projects. For production with high traffic, consider upgrading to a paid plan.