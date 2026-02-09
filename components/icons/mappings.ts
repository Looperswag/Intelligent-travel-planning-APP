/**
 * Icon Mappings - Scene type and category to Lucide React icon mappings
 *
 * Provides consistent SVG icon mappings throughout the application,
 * replacing emoji icons with professional Lucide React icons.
 */

import {
  Heart,
  Users,
  Mountain,
  Briefcase,
  Utensils,
  Landmark,
  Sun,
  Backpack,
  Sparkles,
  ClipboardList,
  Search,
  Clipboard,
  MapPin,
  Calendar,
  CheckCircle
} from 'lucide-react';

/**
 * Scene type to Lucide icon component mapping
 * Replaces emoji icons with professional SVG icons
 */
export const SCENE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  romantic: Heart,
  family: Users,
  adventure: Mountain,
  business: Briefcase,
  foodie: Utensils,
  culture: Landmark,
  relaxation: Sun,
  solo: Backpack
};

/**
 * Render phase icon mapping for progress indicator
 */
export const PHASE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  skeleton: Search,
  header: Clipboard,
  overview: MapPin,
  day_1: Sparkles,
  remaining: Calendar
};

/**
 * Icon size classes for consistent sizing
 */
export const ICON_SIZES = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
  '2xl': 'w-10 h-10',
  '3xl': 'w-12 h-12'
} as const;

/**
 * Common icon color classes
 */
export const ICON_COLORS = {
  primary: 'text-blue-600',
  secondary: 'text-slate-600',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
  info: 'text-indigo-600',
  white: 'text-white'
} as const;
