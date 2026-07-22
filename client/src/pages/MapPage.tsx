import { AppLayout } from '../components/layout/AppLayout';
import { BaseMap } from '../components/map/BaseMap';

export function MapPage() {
  return (
    <AppLayout fullBleed>
      <BaseMap />
    </AppLayout>
  );
}
