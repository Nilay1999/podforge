import { Title, Text, SimpleGrid, Paper, Group, ThemeIcon } from "@mantine/core";
import { IconRocket, IconBox } from "@tabler/icons-react";

export function DashboardPage() {
  return (
    <>
      <Title order={2} mb="lg">
        Dashboard
      </Title>

      <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }}>
        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="blue">
              <IconRocket size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Deployments
              </Text>
              <Text size="xl" fw={700}>
                --
              </Text>
            </div>
          </Group>
        </Paper>

        <Paper withBorder p="md" radius="md">
          <Group>
            <ThemeIcon size="lg" variant="light" color="teal">
              <IconBox size={20} />
            </ThemeIcon>
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
                Pods
              </Text>
              <Text size="xl" fw={700}>
                --
              </Text>
            </div>
          </Group>
        </Paper>
      </SimpleGrid>
    </>
  );
}
