/**
 * SceneIcon - Unified scene icon component
 *
 * Provides consistent, accessible SVG icons for scene types
 * using Lucide React icons instead of emoji.
 */

import React from 'react';
import { SceneType } from '../../types';
import { SCENE_ICONS, ICON_SIZES, ICON_COLORS } from './mappings';

interface SceneIconProps {
  sceneType: SceneType | string;
  size?: keyof typeof ICON_SIZES;
  color?: keyof typeof ICON_COLORS;
  className?: string;
  ariaLabel?: string;
}

export const SceneIcon: React.FC<SceneIconProps> = ({
  sceneType,
  size = 'lg',
  color = 'primary',
  className = '',
  ariaLabel
}) => {
  const IconComponent = SCENE_ICONS[sceneType] || SCENE_ICONS.solo;

  return (
    <IconComponent
      className={`${ICON_SIZES[size]} ${ICON_COLORS[color]} ${className}`}
      aria-label={ariaLabel || sceneType}
      aria-hidden={!ariaLabel}
    />
  );
};

export default SceneIcon;
