import { Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { ResourcePageHeader } from "../components/common/ResourcePageHeader";
import { ManifestDrawer } from "../components/manifest/ManifestDrawer";

export function ConfigMapsPage() {
  const [drawerOpened, { open: openDrawer, close: closeDrawer }] =
    useDisclosure(false);

  return (
    <Stack>
      <ResourcePageHeader title="ConfigMap" onCreateClick={openDrawer} />

      <ManifestDrawer
        opened={drawerOpened}
        onClose={closeDrawer}
        kind="ConfigMap"
      />

      {/* ConfigMap list table will be built here */}
    </Stack>
  );
}
