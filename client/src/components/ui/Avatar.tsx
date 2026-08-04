import { cn } from '@/lib/cn';

interface AvatarProps {
  name: string;
  src?: string;
  className?: string;
}

const initials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

export const Avatar = ({ name, src, className }: AvatarProps) => {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('size-8 rounded-full object-cover', className)}
      />
    );
  }

  return (
    <div
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-teal-100 text-xs font-semibold text-teal-700',
        className,
      )}
    >
      {initials(name) || '?'}
    </div>
  );
};
