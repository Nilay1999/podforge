import { Button, Group, Title } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

interface ResourcePageHeaderProps {
  title: string;
  onCreateClick: () => void;
}

export function ResourcePageHeader({
  title,
  onCreateClick,
}: ResourcePageHeaderProps) {
  return (
    <Group justify="space-between" mb="lg">
      <Title order={2}>{title}</Title>
      <Button leftSection={<IconPlus size={16} />} onClick={onCreateClick}>
        Create {title}
      </Button>
    </Group>
  );
}
