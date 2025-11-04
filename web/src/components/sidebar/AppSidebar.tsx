import * as React from "react";
import { useTranslation } from "react-i18next";

import Logo from "@/components/Logo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { Link } from "react-router-dom";
import useNavigation from "@/hooks/use-navigation";
import { NavUser } from "./nav-user";
import { NavMainSingle } from "./NavMainSingle";
import { CameraGroupNavItem } from "./CameraGroupNavItem";
import { sidebarData } from "./sidebar-data";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const navbarLinks = useNavigation();

  const navMain = React.useMemo(() => {
    return navbarLinks.map((item) => ({
      title: t(item.title),
      url: item.url,
      icon: item.icon,
      enabled: item.enabled,
    }));
  }, [navbarLinks, t]);

  const navSystem = React.useMemo(() => {
    return sidebarData.system.map((item) => ({
      title: t(item.title),
      url: item.url,
      icon: item.icon,
    }));
  }, [t]);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <Logo className="h-5 w-5" />
                <span className="text-base font-semibold">Frigate</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <CameraGroupNavItem />
        <NavMainSingle items={navMain} />
        <NavMainSingle
          nav_title={t("menu.system", { ns: "common" })}
          items={navSystem}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{ name: "Anonymous", email: "admin@gmail.com", avatar: "" }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
