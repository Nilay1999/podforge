import { useMemo, useState } from "react";
import {
  ActionIcon,
  Alert,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  Menu,
  Modal,
  Paper,
  PasswordInput,
  Select,
  Stack,
  Table,
  Text,
  TextInput,
  Title
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconDots,
  IconKey,
  IconPlus,
  IconRefresh,
  IconSearch,
  IconTrash,
  IconUserShield
} from "@tabler/icons-react";
import { useAuth } from "@src/auth/AuthContext";
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@src/hooks/useUsers";
import type { CreateUserRequest, Role, UserAccount } from "@src/types";
import { formatAge } from "@src/components/common/ResourceListPage";

const ROLE_OPTIONS = [
  { value: "viewer", label: "viewer — read-only" },
  { value: "editor", label: "editor — create & modify" },
  { value: "admin", label: "admin — full control" }
];

const roleColor: Record<Role, string> = {
  viewer: "gray",
  editor: "steelBlue",
  admin: "grape"
};

export function UsersPage() {
  const { identity } = useAuth();
  const [search, setSearch] = useState("");
  const [createOpened, { open: openCreate, close: closeCreate }] = useDisclosure(false);
  const [editing, setEditing] = useState<UserAccount | null>(null);

  const { data, isLoading, error, refetch, isFetching } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const createForm = useForm<CreateUserRequest>({
    initialValues: { username: "", password: "", role: "viewer" },
    validate: {
      username: (v) => (v.trim() ? null : "Username is required"),
      password: (v) => (v.length >= 8 ? null : "At least 8 characters")
    }
  });

  const editForm = useForm<{ role: Role; password: string }>({
    initialValues: { role: "viewer", password: "" },
    validate: {
      password: (v) => (v === "" || v.length >= 8 ? null : "At least 8 characters")
    }
  });

  const users = data ?? [];
  const filtered = useMemo(() => {
    const list = data ?? [];
    if (!search) return list;
    const q = search.toLowerCase();
    return list.filter((u) => u.username.toLowerCase().includes(q));
  }, [data, search]);

  const handleCreate = (values: CreateUserRequest) => {
    createUser.mutate(values, {
      onSuccess: () => {
        notifications.show({ title: "User created", message: values.username, color: "teal" });
        createForm.reset();
        closeCreate();
      },
      onError: (err) =>
        notifications.show({ title: "Create failed", message: err.message, color: "red" })
    });
  };

  const openEdit = (u: UserAccount) => {
    editForm.setValues({ role: u.role, password: "" });
    setEditing(u);
  };

  const handleEdit = (values: { role: Role; password: string }) => {
    if (!editing) return;
    const payload: { role?: Role; password?: string } = {};
    if (values.role !== editing.role) payload.role = values.role;
    if (values.password) payload.password = values.password;
    if (!payload.role && !payload.password) {
      notifications.show({ title: "Nothing to update", message: "No changes made", color: "yellow" });
      return;
    }
    updateUser.mutate(
      { username: editing.username, payload },
      {
        onSuccess: () => {
          notifications.show({ title: "User updated", message: editing.username, color: "teal" });
          setEditing(null);
        },
        onError: (err) =>
          notifications.show({ title: "Update failed", message: err.message, color: "red" })
      }
    );
  };

  const handleDelete = (username: string) => {
    deleteUser.mutate(username, {
      onSuccess: () => notifications.show({ title: "User deleted", message: username, color: "teal" }),
      onError: (err) =>
        notifications.show({ title: "Delete failed", message: err.message, color: "red" })
    });
  };

  return (
    <>
      <Modal opened={createOpened} onClose={closeCreate} title="Create User" size="sm">
        <Box component="form" onSubmit={createForm.onSubmit(handleCreate)}>
          <Stack>
            <TextInput
              label="Username"
              placeholder="jane.doe"
              withAsterisk
              {...createForm.getInputProps("username")}
            />
            <PasswordInput
              label="Password"
              placeholder="At least 8 characters"
              withAsterisk
              {...createForm.getInputProps("password")}
            />
            <Select
              label="Role"
              data={ROLE_OPTIONS}
              allowDeselect={false}
              {...createForm.getInputProps("role")}
            />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={closeCreate} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={createUser.isPending}>
                Create
              </Button>
            </Group>
          </Stack>
        </Box>
      </Modal>

      <Modal
        opened={editing !== null}
        onClose={() => setEditing(null)}
        title={`Edit ${editing?.username ?? ""}`}
        size="sm"
      >
        <Box component="form" onSubmit={editForm.onSubmit(handleEdit)}>
          <Stack>
            <Select
              label="Role"
              data={ROLE_OPTIONS}
              allowDeselect={false}
              disabled={editing?.username === identity?.username}
              description={
                editing?.username === identity?.username
                  ? "You cannot change your own role"
                  : undefined
              }
              {...editForm.getInputProps("role")}
            />
            <PasswordInput
              label="Reset password"
              placeholder="Leave blank to keep current"
              {...editForm.getInputProps("password")}
            />
            <Group justify="flex-end">
              <Button variant="subtle" color="gray" onClick={() => setEditing(null)} type="button">
                Cancel
              </Button>
              <Button type="submit" loading={updateUser.isPending}>
                Save
              </Button>
            </Group>
          </Stack>
        </Box>
      </Modal>

      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Group gap="xs" align="center">
            <Title order={2}>Users</Title>
            <Badge color="steelBlue" variant="light">
              {filtered.length}
              {filtered.length !== users.length && ` / ${users.length}`}
            </Badge>
          </Group>
          <Button leftSection={<IconPlus size={14} />} size="sm" onClick={openCreate}>
            Create User
          </Button>
        </Group>

        <Text size="sm" c="dimmed">
          Local accounts for username/password login. SSO users are managed in your identity
          provider and do not appear here.
        </Text>

        <Group gap="xs" align="flex-end">
          <TextInput
            label="Search"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            placeholder="Filter by username…"
            leftSection={<IconSearch size={14} />}
            size="xs"
            style={{ flex: 1, minWidth: 180, maxWidth: 300 }}
          />
          <ActionIcon
            variant="default"
            size="md"
            onClick={() => refetch()}
            loading={isFetching}
            title="Refresh"
            style={{ marginBottom: 1 }}
          >
            <IconRefresh size={16} />
          </ActionIcon>
        </Group>

        {isLoading && <Loader />}

        {error && (
          <Alert color="red" title="Failed to load users">
            {error.message}
          </Alert>
        )}

        {data && (
          <Paper withBorder radius="md" style={{ overflow: "hidden" }} p={0}>
            <Table highlightOnHover style={{ fontSize: 13 }}>
              <Table.Thead style={{ background: "var(--mantine-color-default-hover)" }}>
                <Table.Tr>
                  <Table.Th>Username</Table.Th>
                  <Table.Th>Role</Table.Th>
                  <Table.Th>Created</Table.Th>
                  <Table.Th>Updated</Table.Th>
                  <Table.Th style={{ width: 44 }} />
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filtered.map((u) => {
                  const isSelf = u.username === identity?.username;
                  return (
                    <Table.Tr key={u.username}>
                      <Table.Td>
                        <Group gap={6}>
                          <Text size="sm" ff="monospace" fw={500}>
                            {u.username}
                          </Text>
                          {isSelf && (
                            <Badge size="xs" variant="light" color="gray">
                              you
                            </Badge>
                          )}
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={roleColor[u.role]} variant="light" size="sm">
                          {u.role}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {formatAge(u.createdAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" ff="monospace" c="dimmed">
                          {formatAge(u.updatedAt)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={180} position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray" size="sm">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconKey size={14} />}
                              onClick={() => openEdit(u)}
                            >
                              Edit role / password
                            </Menu.Item>
                            <Menu.Item
                              color="red"
                              disabled={isSelf}
                              leftSection={<IconTrash size={14} />}
                              onClick={() => handleDelete(u.username)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
                {filtered.length === 0 && (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: "center", padding: 40 }}>
                      <Text c="dimmed" size="sm">
                        {search ? `No users match "${search}"` : "No users found"}
                      </Text>
                    </Table.Td>
                  </Table.Tr>
                )}
              </Table.Tbody>
            </Table>
          </Paper>
        )}
      </Stack>
    </>
  );
}

export const UsersPageIcon = IconUserShield;
