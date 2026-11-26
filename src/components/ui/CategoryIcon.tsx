import {
  BookOpen,
  Briefcase,
  Car,
  Coffee,
  CreditCard,
  Dumbbell,
  Fuel,
  Gamepad2,
  Gift,
  HeartHandshake,
  Home,
  Laptop,
  Music,
  Plane,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Tag,
  UserCheck,
  Users,
  Utensils,
  Wifi,
  Wind,
  Zap,
} from 'lucide-react';

export const CATEGORY_ICON_MAP: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Tag,
  Briefcase,
  HeartHandshake,
  Laptop,
  PlusCircle,
  Wind,
  Users,
  UserCheck,
  BookOpen,
  Fuel,
  Utensils,
  Gamepad2,
  Smartphone,
  ShoppingBag,
  Stethoscope,
  Receipt,
  Wifi,
  Car,
  Home,
  Coffee,
  Dumbbell,
  Plane,
  Zap,
  CreditCard,
  Gift,
  Music,
};

export const CATEGORY_ICON_NAMES = Object.keys(CATEGORY_ICON_MAP);

export function CategoryIcon({
  icon,
  className = 'h-4 w-4',
}: {
  icon?: string;
  className?: string;
}) {
  const Icon = (icon && CATEGORY_ICON_MAP[icon]) || Tag;
  return <Icon className={className} aria-hidden="true" />;
}
