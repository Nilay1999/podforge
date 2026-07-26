import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Group,
  List,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  ThemeIcon,
  TextInput,
  Title
} from "@mantine/core";
import { useForm } from "@mantine/form";
import {
  IconAlertCircle,
  IconLock,
  IconRocket,
  IconShieldLock,
  IconWorldBolt
} from "@tabler/icons-react";
import { useAuth } from "@src/auth/AuthContext";

export function LoginPage() {
  const { status, providers, loginLocal, loginOidc, finishOidc } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const oidcExchangeStarted = useRef(false);

  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const form = useForm({
    initialValues: { username: "", password: "" },
    validate: {
      username: (v) => (v.trim() ? null : "Username is required"),
      password: (v) => (v ? null : "Password is required")
    }
  });

  useEffect(() => {
    if (!code || !state || !providers?.oidc || oidcExchangeStarted.current) return;
    oidcExchangeStarted.current = true;
    setSubmitting(true);
    finishOidc(code, state)
      .then(() => navigate("/", { replace: true }))
      .catch((err: Error) => {
        setError(err.message);
        setSearchParams({}, { replace: true });
      })
      .finally(() => setSubmitting(false));
  }, [code, state, providers, finishOidc, navigate, setSearchParams]);

  if (status === "authenticated" || status === "disabled") {
    return <Navigate to="/" replace />;
  }

  if (status === "loading" || (code && !error)) {
    return (
      <Center h="100vh">
        <Loader />
      </Center>
    );
  }

  const handleSubmit = form.onSubmit(async ({ username, password }) => {
    setSubmitting(true);
    setError(null);
    try {
      await loginLocal(username.trim(), password);
      navigate("/", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Flex h="100vh" w="100%">
      <BrandPanel />
      <Center flex={1} p="xl" bg="var(--mantine-color-body)">
        <Paper w={400} maw="100%" p={{ base: "lg", sm: "xl" }} radius="lg" withBorder>
          <Stack gap="lg">
            <Box hiddenFrom="md">
              <Group justify="center" gap="xs">
                <IconRocket size={26} stroke={1.5} color="var(--mantine-color-steelBlue-text)" />
                <Text size="xl" fw={700} style={{ letterSpacing: "-0.01em" }}>
                  podforge
                </Text>
              </Group>
            </Box>

            <Stack gap={4}>
              <Title order={3} fw={700}>
                Sign in
              </Title>
              <Text size="sm" c="dimmed">
                Access is restricted to your organization's engineers.
              </Text>
            </Stack>

            {error && (
              <Alert color="danger" icon={<IconAlertCircle size={16} />} variant="light">
                {error}
              </Alert>
            )}

            {providers?.local && (
              <form onSubmit={handleSubmit}>
                <Stack gap="sm">
                  <TextInput
                    label="Username"
                    placeholder="your.username"
                    autoComplete="username"
                    autoFocus
                    {...form.getInputProps("username")}
                  />
                  <PasswordInput
                    label="Password"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    {...form.getInputProps("password")}
                  />
                  <Button type="submit" fullWidth loading={submitting} mt="xs">
                    Sign in
                  </Button>
                </Stack>
              </form>
            )}

            {providers?.local && providers?.oidc && (
              <Divider label="or continue with" labelPosition="center" />
            )}

            {providers?.oidc && (
              <Button
                variant="default"
                fullWidth
                size="md"
                leftSection={<IconShieldLock size={18} />}
                loading={submitting && !providers.local}
                onClick={() => {
                  setError(null);
                  loginOidc().catch((err: Error) => setError(err.message));
                }}
              >
                Single sign-on (SSO)
              </Button>
            )}

            {providers && !providers.local && !providers.oidc && (
              <Alert color="warning" variant="light">
                No login providers are configured on the server.
              </Alert>
            )}

            <Text size="xs" c="dimmed" ta="center">
              Need an account? Ask a Podforge administrator to invite you.
            </Text>
          </Stack>
        </Paper>
      </Center>
    </Flex>
  );
}

// Paints its own fixed dark gradient in both schemes, so the light-on-dark
// text below is intentional and must not be swapped for scheme-aware tokens.
function BrandPanel() {
  return (
    <Box
      visibleFrom="md"
      w={460}
      p="3rem"
      style={{
        background:
          "linear-gradient(160deg, var(--mantine-color-dark-8) 0%, #16213a 55%, var(--mantine-color-steelBlue-9) 100%)",
        borderRight: "1px solid var(--mantine-color-dark-4)"
      }}
    >
      <Flex h="100%" direction="column" justify="space-between">
        <Group gap="xs">
          <IconRocket size={30} stroke={1.5} color="var(--mantine-color-steelBlue-4)" />
          <Text size="1.4rem" fw={700} c="white" style={{ letterSpacing: "-0.02em" }}>
            podforge
          </Text>
        </Group>

        <Stack gap="xl">
          <Stack gap="sm">
            <Title order={1} c="white" fw={800} lh={1.1} style={{ letterSpacing: "-0.02em" }}>
              Where your pods come to life.
            </Title>
            <Text c="gray.4" size="md">
              Deploy and manage Kubernetes workloads through a single, secure console —
              no YAML wrangling required.
            </Text>
          </Stack>

          <List
            spacing="md"
            icon={
              <ThemeIcon color="steelBlue" variant="light" size={28} radius="xl">
                <IconWorldBolt size={16} />
              </ThemeIcon>
            }
          >
            <List.Item c="gray.3">Single sign-on with your corporate identity</List.Item>
            <List.Item
              c="gray.3"
              icon={
                <ThemeIcon color="steelBlue" variant="light" size={28} radius="xl">
                  <IconLock size={16} />
                </ThemeIcon>
              }
            >
              Role-based access — viewer, editor, admin
            </List.Item>
          </List>
        </Stack>

        <Text size="xs" c="gray.5">
          © {new Date().getFullYear()} Podforge
        </Text>
      </Flex>
    </Box>
  );
}
