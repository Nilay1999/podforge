import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Badge,
  Box,
  Burger,
  Button,
  Group,
  Menu,
  NavLink,
  Text,
  ActionIcon,
  useMantineColorScheme
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconDashboard,
  IconRocket,
  IconBox,
  IconSun,
  IconMoon,
  IconFileText,
  IconSearch,
  IconServer,
  IconTag,
  IconChevronDown,
  IconNetwork,
  IconKey,
  IconFolder,
  IconActivity,
  IconCloudUpload,
  IconLogout,
  IconUserCircle
} from "@tabler/icons-react";
import { useAuth } from "@src/auth/AuthContext";
import { ApplyYamlDrawer } from "@src/components/manifest/ApplyYamlDrawer";

const navItems = [
  { label: "Dashboard", icon: IconDashboard, path: "/" },
  { label: "Deployments", icon: IconRocket, path: "/deployments" },
  { label: "Pods", icon: IconBox, path: "/pods" },
  { label: "ConfigMaps", icon: IconFileText, path: "/configmaps" },
  { label: "Services", icon: IconNetwork, path: "/services" },
  { label: "Secrets", icon: IconKey, path: "/secrets" },
  { label: "Namespaces", icon: IconFolder, path: "/namespaces" },
  { label: "Events", icon: IconActivity, path: "/events" }
];

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [opened, { toggle }] = useDisclosure();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { identity, logout } = useAuth();
  const [applyOpened, setApplyOpened] = useState(false);

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{
        width: 250,
        breakpoint: "sm",
        collapsed: { mobile: !opened }
      }}
      padding="md"
      styles={{
        header: {
          background: "light-dark(var(--mantine-color-white), var(--mantine-color-dark-5))"
        },
        navbar: {
          background: "light-dark(var(--mantine-color-white), var(--mantine-color-dark-5))"
        }
      }}
    >
      <AppShell.Header>
        <Group h="100%" px="md" gap="xs">
          <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />

          <Group gap="xs" mr="xs">
            <IconRocket size={26} stroke={1.5} color="var(--mantine-color-steelBlue-5)" />
            <Text size="lg" fw={700} style={{ letterSpacing: "-0.01em" }}>
              podforge
            </Text>
          </Group>

          <Box
            style={{
              width: 1,
              height: 24,
              background: "var(--mantine-color-default-border)",
              marginInline: 4
            }}
            visibleFrom="sm"
          />

          <Button
            variant="default"
            size="xs"
            leftSection={<IconServer size={14} />}
            rightSection={<IconChevronDown size={12} />}
            visibleFrom="sm"
          >
            production
          </Button>

          <Button
            variant="default"
            size="xs"
            leftSection={<IconTag size={14} />}
            rightSection={<IconChevronDown size={12} />}
            visibleFrom="sm"
          >
            ns: default
          </Button>
          <Button
            variant="default"
            size="xs"
            leftSection={<IconCloudUpload size={14} />}
            visibleFrom="sm"
            onClick={() => setApplyOpened(true)}
          >
            Apply YAML
          </Button>
          <Box style={{ flex: 1 }} />
          <Button
            variant="default"
            size="xs"
            leftSection={<IconSearch size={14} />}
            rightSection={
              <Text
                span
                size="xs"
                c="dimmed"
                ff="monospace"
                style={{
                  padding: "0 5px",
                  borderRadius: 3,
                  background: "var(--mantine-color-default-hover)",
                  border: "1px solid var(--mantine-color-default-border)"
                }}
              >
                ⌘K
              </Text>
            }
            visibleFrom="sm"
            styles={{ root: { minWidth: 180 }, label: { flex: 1 } }}
            c="dimmed"
          >
            Search resources…
          </Button>

          <ActionIcon
            variant="default"
            size="lg"
            onClick={() => toggleColorScheme()}
            aria-label="Toggle color scheme"
          >
            {colorScheme === "dark" ? <IconSun size={18} /> : <IconMoon size={18} />}
          </ActionIcon>

          {identity && (
            <Menu position="bottom-end" width={200}>
              <Menu.Target>
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<IconUserCircle size={16} />}
                  rightSection={
                    <Badge size="xs" variant="light">
                      {identity.role}
                    </Badge>
                  }
                >
                  {identity.username}
                </Button>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Label>
                  Signed in via {identity.provider === "local" ? "Podforge" : identity.provider}
                </Menu.Label>
                <Menu.Item
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  Sign out
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="sm" style={{ display: "flex", flexDirection: "column" }}>
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

        <Box
          mt="auto"
          pt="xs"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group gap="xs" px={4} py={4}>
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: "var(--mantine-color-success-5)",
                flexShrink: 0
              }}
            />
            <Text size="xs" c="dimmed">
              Connected · v1.28.4
            </Text>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <ApplyYamlDrawer opened={applyOpened} onClose={() => setApplyOpened(false)} />
    </AppShell>
  );
}
