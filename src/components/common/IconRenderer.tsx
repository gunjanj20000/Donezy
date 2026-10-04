import React from 'react';
import { 
  User, 
  Briefcase, 
  Users, 
  ShoppingCart, 
  HeartPulse, 
  CreditCard, 
  Home, 
  Car, 
  BookOpen, 
  Tag, 
  CircleDot, 
  Droplets, 
  Footprints, 
  Sun, 
  Check, 
  Smile, 
  Zap, 
  Flame, 
  Award, 
  Calendar, 
  BarChart3, 
  Clock, 
  Sparkles,
  LucideIcon
} from 'lucide-react';

const ICON_MAP: Record<string, LucideIcon> = {
  User,
  Briefcase,
  Users,
  ShoppingCart,
  HeartPulse,
  CreditCard,
  Home,
  Car,
  BookOpen,
  Tag,
  CircleDot,
  Droplets,
  Footprints,
  Sun,
  Check,
  Smile,
  Zap,
  Flame,
  Award,
  Calendar,
  BarChart3,
  Clock,
  Sparkles,
};

interface IconRendererProps {
  name: string;
  className?: string;
  size?: number;
  style?: React.CSSProperties;
}

export const IconRenderer: React.FC<IconRendererProps> = ({ name, className = 'w-5 h-5', size, style }) => {
  const IconComponent = ICON_MAP[name] || CircleDot;
  return <IconComponent className={className} size={size} style={style} />;
};
