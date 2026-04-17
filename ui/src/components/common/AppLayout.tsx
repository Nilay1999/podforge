import { useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Burger,
  Group,
  NavLink,
  Text,
  ActionIcon,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconRocket,
  IconBox,
  IconSun,
  IconMoon,
  IconFileText,
} from "@tabler/icons-react";

const navItems = [
  { label: "Dashboard", icon: IconDashboard, path: "/" },
  { label: "Deployments", icon: IconRocket, path: "/deployments" },
  { label: "Pods", icon: IconBox, path: "/pods" },
  { label: "ConfigMaps", icon: IconFileText, path: "/configmaps" },
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <IconRocket
              size={28}
              stroke={1.5}
              color="var(--mantine-color-steelBlue-5)"
            />
            <Text size="xl" fw={700}>
              k8s-orchestrator
            </Text>
          </Group>
          <ActionIcon
            variant="default"
            size="lg"
            onClick={() => toggleColorScheme()}
            aria-label="Toggle color scheme"
          >
            {colorScheme === "dark" ? (
              <IconSun size={18} />
            ) : (
              <IconMoon size={18} />
            )}
          </ActionIcon>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            label={item.label}
            fw={600}
            leftSection={<item.icon size={20} stroke={1.5} />}
            active={location.pathname === item.path}
            onClick={() => {
              navigate(item.path);
              toggle();
            }}
            variant="filled"
          />
        ))}
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
}
