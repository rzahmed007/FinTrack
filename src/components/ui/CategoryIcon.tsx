import {
  BookOpen,
  Briefcase,
  Fuel,
  Gamepad2,
  HeartHandshake,
  Laptop,
  PlusCircle,
  Receipt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  Tag,
  UserCheck,
  Users,
  Utensils,
  Wind,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

export function CategoryIcon({
  icon,
  className = 'h-4 w-4',
}: {
  icon?: string;
  className?: string;
}) {
  const Icon = (icon && ICON_MAP[icon]) || Tag;
  return <Icon className={className} aria-hidden="true" />;
}
