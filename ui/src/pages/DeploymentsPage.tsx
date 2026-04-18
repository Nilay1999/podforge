import { Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ResourcePageHeader } from "@src/components/common/ResourcePageHeader";
import { ManifestDrawer } from "@src/components/manifest/ManifestDrawer";

export function DeploymentsPage() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  return (
    <Stack>
      <ResourcePageHeader title="Deployment" onCreateClick={openDrawer} />

      <ManifestDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        kind="Deployment"
      />

      {/* Deployment list table will be built here */}
    </Stack>
  );
}
