import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import type { NavItem } from "./sidebar-data";
import { NavLink } from "react-router-dom";

type NavMainSingleProps = {
  nav_title?: string;
  items: (NavItem & { enabled?: boolean })[];
};

export function NavMainSingle({ nav_title, items }: NavMainSingleProps) {
  const { open, setOpen } = useSidebar();
  return (
    <SidebarGroup>
      {nav_title && <SidebarGroupLabel>{nav_title}</SidebarGroupLabel>}
      <SidebarMenu>
        {items.map((item) => {
          const isDisabled = item.enabled === false;
          return (
            <SidebarMenuItem key={item.title}>
              {isDisabled ? (
                <SidebarMenuButton
                  disabled
                  className="cursor-not-allowed opacity-50"
                  tooltip={item.title}
                >
                  <item.icon className="" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              ) : (
                <NavLink to={item.url} className="w-full" end>
                  {({ isActive }) => (
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => {
                        if (!open) {
                          setOpen(true);
                        }
                      }}
                    >
                      <item.icon className="" />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  )}
                </NavLink>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
