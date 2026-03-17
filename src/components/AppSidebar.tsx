import { BarChart3, ChevronDown, ClipboardList, PlusCircle, Settings2, SlidersHorizontal, TableProperties, Archive } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import logo from "@/assets/logo.png";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Parâmetros", url: "/parametros", icon: SlidersHorizontal },
  { title: "Tabela de Preços", url: "/tabela-precos", icon: TableProperties },
];

const legacyItems = [
  { title: "Precificação", url: "/", icon: BarChart3 },
  { title: "Combinações", url: "/combinacoes", icon: Settings2 },
  { title: "Ordens", url: "/ordens", icon: ClipboardList },
  { title: "Nova Ordem", url: "/nova-ordem", icon: PlusCircle },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  const isActive = (path: string) =>
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  const legacyActive = legacyItems.some((i) => isActive(i.url));

  const renderItem = (item: typeof mainItems[0]) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild>
        <NavLink
          to={item.url}
          end={item.url === "/"}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          activeClassName="bg-sidebar-accent text-sidebar-primary font-semibold"
        >
          <item.icon className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5">
          <img src={logo} alt="Safra Segura" className="h-9 w-9 rounded-lg" />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                Safra Segura
              </span>
              <span className="text-[10px] font-medium uppercase tracking-widest text-sidebar-primary">
                Grãos
              </span>
            </div>
          )}
        </div>

        {/* Main */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>{mainItems.map(renderItem)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Legacy */}
        <Collapsible defaultOpen={legacyActive}>
          <SidebarGroup>
            <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40 hover:text-sidebar-foreground/60">
              <Archive className="h-3.5 w-3.5 shrink-0" />
              {!collapsed && (
                <>
                  <span>Legado</span>
                  <ChevronDown className="ml-auto h-3.5 w-3.5 transition-transform [[data-state=open]>&]:rotate-180" />
                </>
              )}
            </CollapsibleTrigger>
            <CollapsibleContent>
              <SidebarGroupContent>
                <SidebarMenu>{legacyItems.map(renderItem)}</SidebarMenu>
              </SidebarGroupContent>
            </CollapsibleContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  );
}