import {
  Activity,
  Construction,
  Download,
  HardDrive,
  MonitorPlay,
  Search,
  Settings,
  Video,
} from "lucide-react";

export interface NavItem {
  title: string;
  url: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
  isActive?: boolean;
}

export interface SidebarData {
  main: NavItem[];
  system: NavItem[];
}

export const sidebarData: SidebarData = {
  main: [
    {
      title: "Live",
      url: "/",
      icon: MonitorPlay,
    },
    {
      title: "Review",
      url: "/review",
      icon: Video,
    },
    {
      title: "Explore",
      url: "/explore",
      icon: Search,
    },
    {
      title: "Exports",
      url: "/export",
      icon: Download,
    },
  ],
  system: [
    {
      title: "System",
      url: "/system",
      icon: Activity,
    },
    {
      title: "Config",
      url: "/config",
      icon: HardDrive,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
    {
      title: "Logs",
      url: "/logs",
      icon: Construction,
    },
  ],
};