import React from 'react';
import {
  Crown, Zap, Rocket, Palette, Code, Brain, Target, Star, Cat, Flame, Ghost, Gem, Heart, Leaf, User,
  LucideIcon
} from 'lucide-react';

// avatar icons are stored by lucide name
export const ICON_MAP: Record<string, LucideIcon> = {
  Crown, Zap, Rocket, Palette, Code, Brain, Target, Star, Cat, Flame, Ghost, Gem, Heart, Leaf, User
};

export const ICON_OPTIONS = Object.keys(ICON_MAP).filter(name => name !== 'User');

interface UserIconProps {
  name?: string;
  size?: number;
}

export const UserIcon: React.FC<UserIconProps> = ({ name, size = 16 }) => {
  const Icon = (name && ICON_MAP[name]) || User;
  return <Icon size={size} strokeWidth={1.8} />;
};

interface IconPickerProps {
  value: string;
  onChange: (name: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange }) => (
  <div className="avatar-picker-row">
    {ICON_OPTIONS.map(name => (
      <button
        key={name}
        type="button"
        title={name}
        className={`avatar-choice-btn ${value === name ? 'selected' : ''}`}
        onClick={() => onChange(name)}
      >
        <UserIcon name={name} size={18} />
      </button>
    ))}
  </div>
);
