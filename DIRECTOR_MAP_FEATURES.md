# Director Map Features

## Overview
The Director Map Configuration page has been enhanced to provide a comprehensive view of all company assets (domains, serres, and bilans) on an interactive map with improved performance and user experience.

## New Features

### 1. Optimized Data Fetching
- **Single API Call**: New optimized endpoint `/company/{company_id}/map-data` fetches all company data in one request
- **Fallback Support**: Automatically falls back to individual API calls if the optimized endpoint is not available
- **Better Performance**: Reduces the number of API calls from potentially dozens to just one

### 2. Enhanced Map Display
- **Domains**: Displayed in green (#B4CC5F) with 40% opacity
- **Serres**: Displayed in red (#FF6B6B) with 50% opacity  
- **Bilans**: Displayed in blue (#3498DB) with 60% opacity and thicker borders
- **Layered Display**: Bilans appear on top of serres, which appear on top of domains

### 3. Interactive Controls
- **Visibility Toggles**: Buttons to show/hide serres and bilans on the map
- **Tab Navigation**: Separate tabs for viewing domains, serres, and bilans
- **Real-time Updates**: Map updates automatically when creating new domains or serres

### 4. Creation Capabilities
- **Domain Creation**: Draw new domains directly on the map
- **Serre Creation**: Draw new serres within selected domains
- **Same Services**: Uses the same creation services as the Director Setup process

### 5. Enhanced Information Display
- **Rich Info Windows**: Click on any shape to see detailed information
- **Hierarchical Display**: Shows domain → serre → bilan relationships
- **Surface Calculations**: Displays areas in hectares for all shapes

## Technical Implementation

### Backend
- New endpoint in `EntrepriseController`: `get_company_map_data()`
- Fetches domains, serres, and bilans with their GPS coordinates
- Uses existing model relationships (`group_coords`)

### Frontend
- New service: `companyMapService.ts`
- Optimized data fetching with fallback support
- Enhanced `MapComponent` with support for bilan shapes
- Improved state management for better performance

### Data Structure
```typescript
interface CompanyMapData {
  domains: DomainWithSerresAndBilans[];
}

interface DomainWithSerresAndBilans extends Domain {
  serres: SerreWithBilans[];
}

interface SerreWithBilans extends ExtendedSerre {
  bilans: Bilan[];
}
```

## Usage Instructions

### For Directors
1. **View Map**: All company assets are automatically displayed on the map
2. **Toggle Visibility**: Use the visibility buttons to show/hide serres and bilans
3. **Create Domains**: Click "Nouveau Domaine" and draw on the map
4. **Create Serres**: Select a domain, then click "Nouvelle Serre" and draw
5. **View Details**: Click on any shape to see detailed information
6. **Navigate**: Use tabs to view different asset types in the sidebar

### Performance Benefits
- **Reduced API Calls**: From ~20+ calls to 1 optimized call
- **Faster Loading**: Data loads in parallel instead of sequentially
- **Better UX**: No more waiting for multiple data fetches
- **Responsive Interface**: Map updates immediately after changes

## Future Enhancements
- **Real-time Updates**: WebSocket integration for live data updates
- **Advanced Filtering**: Filter by date, status, or other criteria
- **Export Functionality**: Export map data to various formats
- **Mobile Optimization**: Touch-friendly controls for mobile devices
