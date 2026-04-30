import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
};

export const BrandLogo = ({ size = 44, className }: Props) => (
  <img
    src={logo}
    alt="SmartTimetable logo"
    width={size}
    height={size}
    className={cn("rounded-2xl object-contain", className)}
    style={{ width: size, height: size }}
  />
);
