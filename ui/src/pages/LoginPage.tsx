import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import {
  Alert,
  Button,
  Center,
  Divider,
  Group,
  Loader,
  Paper,
  PasswordInput,
  Stack,
  Text,
  TextInput
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { IconAlertCircle, IconLogin2, IconRocket } from "@tabler/icons-react";
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
    <Center h="100vh">
      <Paper w={380} p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="center" gap="xs">
            <IconRocket size={28} stroke={1.5} color="var(--mantine-color-steelBlue-5)" />
            <Text size="xl" fw={700} style={{ letterSpacing: "-0.01em" }}>
              podforge
            </Text>
          </Group>
          <Text size="sm" c="dimmed" ta="center">
            Sign in to manage your cluster
          </Text>

          {error && (
            <Alert color="red" icon={<IconAlertCircle size={16} />} variant="light">
              {error}
            </Alert>
          )}

          {providers?.local && (
            <form onSubmit={handleSubmit}>
              <Stack gap="sm">
                <TextInput
                  label="Username"
                  placeholder="username"
                  autoComplete="username"
                  autoFocus
                  {...form.getInputProps("username")}
                />
                <PasswordInput
                  label="Password"
                  placeholder="password"
                  autoComplete="current-password"
                  {...form.getInputProps("password")}
                />
                <Button type="submit" fullWidth loading={submitting} mt="xs">
                  Sign in
                </Button>
              </Stack>
            </form>
          )}

          {providers?.local && providers?.oidc && <Divider label="or" labelPosition="center" />}

          {providers?.oidc && (
            <Button
              variant="default"
              fullWidth
              leftSection={<IconLogin2 size={16} />}
              loading={submitting && !providers.local}
              onClick={() => {
                setError(null);
                loginOidc().catch((err: Error) => setError(err.message));
              }}
            >
              Sign in with SSO
            </Button>
          )}

          {providers && !providers.local && !providers.oidc && (
            <Alert color="yellow" variant="light">
              No login providers are configured on the server.
            </Alert>
          )}
        </Stack>
      </Paper>
    </Center>
  );
}
