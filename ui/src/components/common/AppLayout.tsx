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
  Stack,
  Text,
  ActionIcon,
  useMantineColorScheme
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  LayoutDashboard,
  Rocket,
  Box as BoxIcon,
  Sun,
  Moon,
  FileText,
  Search,
  Server,
  Tag,
  ChevronDown,
  Network,
  KeyRound,
  FolderClosed,
  Activity,
  CloudUpload,
  LogOut,
  CircleUser,
  ShieldUser
} from "lucide-react";
import { useAuth } from "@src/auth/AuthContext";
import { ApplyYamlDrawer } from "@src/components/manifest/ApplyYamlDrawer";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Deployments", icon: Rocket, path: "/deployments" },
  { label: "Pods", icon: BoxIcon, path: "/pods" },
  { label: "ConfigMaps", icon: FileText, path: "/configmaps" },
  { label: "Services", icon: Network, path: "/services" },
  { label: "Secrets", icon: KeyRound, path: "/secrets" },
  { label: "Namespaces", icon: FolderClosed, path: "/namespaces" },
  { label: "Nodes", icon: Server, path: "/nodes" },
  { label: "Events", icon: Activity, path: "/events" }
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

  const items =
    identity?.role === "admin"
      ? [...navItems, { label: "Users", icon: ShieldUser, path: "/users" }]
      : navItems;

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
            <Rocket size={24} strokeWidth={1.75} color="var(--mantine-color-steelBlue-text)" />
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
            leftSection={<Server size={14} />}
            rightSection={<ChevronDown size={13} />}
            visibleFrom="sm"
          >
            production
          </Button>

          <Button
            variant="default"
            size="xs"
            leftSection={<Tag size={14} />}
            rightSection={<ChevronDown size={13} />}
            visibleFrom="sm"
          >
            ns: default
          </Button>
          <Button
            variant="default"
            size="xs"
            leftSection={<CloudUpload size={14} />}
            visibleFrom="sm"
            onClick={() => setApplyOpened(true)}
          >
            Apply YAML
          </Button>
          <Box style={{ flex: 1 }} />
          <Button
            variant="default"
            size="xs"
            leftSection={<Search size={14} />}
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
            {colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
          </ActionIcon>

          {identity && (
            <Menu position="bottom-end" width={200}>
              <Menu.Target>
                <Button
                  variant="default"
                  size="xs"
                  leftSection={<CircleUser size={16} />}
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
                  color="danger"
                  leftSection={<LogOut size={16} />}
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
        <Text
          size="xs"
          fw={700}
          c="dimmed"
          tt="uppercase"
          px="xs"
          mb={6}
          style={{ letterSpacing: "0.08em" }}
        >
          Resources
        </Text>
        <Stack gap={4}>
          {items.map((item) => (
            <NavLink
              key={item.path}
              className="pf-navlink"
              label={item.label}
              fw={600}
              leftSection={<item.icon size={18} strokeWidth={1.75} />}
              active={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                toggle();
              }}
              variant="subtle"
              color="steelBlue"
            />
          ))}
        </Stack>

        <Box
          mt="auto"
          pt="sm"
          style={{ borderTop: "1px solid var(--mantine-color-default-border)" }}
        >
          <Group gap="xs" px="xs" py={6} wrap="nowrap">
            <Box
              style={{
                position: "relative",
                width: 8,
                height: 8,
                flexShrink: 0
              }}
            >
              <Box
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "var(--mantine-color-success-filled)"
                }}
              />
              <Box
                className="pf-pulse"
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  background: "var(--mantine-color-success-filled)"
                }}
              />
            </Box>
            <Text size="xs" c="dimmed" fw={500}>
              Connected
            </Text>
            <Badge size="xs" variant="default" ml="auto" ff="monospace">
              v1.28.4
            </Badge>
          </Group>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>

      <ApplyYamlDrawer opened={applyOpened} onClose={() => setApplyOpened(false)} />
    </AppShell>
  );
}
