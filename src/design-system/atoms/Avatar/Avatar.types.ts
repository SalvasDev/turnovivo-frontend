interface AvatarBaseProps {
  name?: string;
  label?: string;
  decorative?: boolean;
  className?: string;
}

export type AvatarProps = AvatarBaseProps & (
  | { variant?: 'default'; src?: never }
  | { variant: 'initials'; src?: never }
  | { variant: 'photo'; src: string }
);