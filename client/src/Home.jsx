import PageLayout from "./children/modules/layout/PageLayout";
import SwipeProfiles from "./children/modules/functional/Swipe/SwipeProfiles";
import ActionButtons from "./children/modules/functional/Swipe/ActionButtons";

export default function Home() {
  return (
    <PageLayout>
      <SwipeProfiles ActionButtons={ActionButtons} />
    </PageLayout>
  )
} 