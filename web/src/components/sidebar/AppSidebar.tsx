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
import { CameraGroupSelector } from "@/components/filter/CameraGroupSelector";
import { NavUser } from "./nav-user";
import { NavMainSingle } from "./NavMainSingle";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation();
  const navbarLinks = useNavigation();

  const navMain = React.useMemo(() => {
    return navbarLinks
      .filter((item) => item.enabled !== false)
      .map((item) => ({
        title: t(item.title),
        url: item.url,
        icon: item.icon,
      }));
  }, [navbarLinks, t]);

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
        <CameraGroupSelector className="mt-2" />
      </SidebarHeader>
      <SidebarContent>
        <NavMainSingle items={navMain} />
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
