# Floating Navigation Implementation

## Overview
This implementation adds a floating navigation menu that can be triggered by clicking the 3-dot menu button across all dashboard pages (alerts, interventions, dashboard, etc.).

## Files Created/Modified

### New Files
1. **`FloatingNavigation.tsx`** - The main floating navigation component
2. **`useFloatingNavigation.ts`** - Custom hook for managing floating navigation state

### Modified Files
1. **`index.ts`** - Added exports for new components
2. **`AlertsHeader.tsx`** - Added 3-dot menu functionality
3. **`InterventionsHeader.tsx`** - Added 3-dot menu functionality  
4. **`DashboardHeader.tsx`** - Added 3-dot menu functionality
5. **`styles.css`** - Added animation styles for floating navigation

## Features

### 3-Dot Menu Button
- Consistent design across all pages
- Hover and focus states
- Click to toggle floating navigation

### Floating Navigation
- Slides in from the left with smooth animation
- Backdrop overlay with click-to-close functionality
- Complete navigation menu with:
  - Map
  - Surveillance
  - Alertes
  - Interventions
  - Rapports
- User profile section
- Logout functionality

### State Management
- Uses custom hook `useFloatingNavigation` for state management
- Provides methods: `toggleFloatingNav`, `openFloatingNav`, `closeFloatingNav`
- Manages visibility state: `isFloatingNavVisible`

## Usage

### In any header component:
```tsx
import { FloatingNavigation } from '../navigation';
import { useFloatingNavigation } from '../navigation/useFloatingNavigation';

const YourHeader: React.FC = () => {
  const { isFloatingNavVisible, toggleFloatingNav, closeFloatingNav } = useFloatingNavigation();

  return (
    <>
      <header>
        <button onClick={toggleFloatingNav}>
          {/* 3-dot menu icon */}
        </button>
      </header>

      <FloatingNavigation 
        isVisible={isFloatingNavVisible} 
        onClose={closeFloatingNav} 
      />
    </>
  );
};
```

## Styling
- Uses Tailwind CSS for styling
- Custom animations defined in global CSS
- Responsive design with mobile considerations
- Consistent with existing design system

## Navigation Routes
The floating navigation includes links to:
- `/dashboard` - Dashboard/Map view
- `/surveillance` - Surveillance page
- `/alerts` - Alerts management
- `/interventions` - Interventions management
- `/rapports` - Reports page

## Accessibility
- Proper ARIA labels
- Keyboard navigation support
- Focus management
- Screen reader compatibility

## Responsive Design
- Works on desktop and mobile devices
- Proper z-index management
- Touch-friendly button sizes
