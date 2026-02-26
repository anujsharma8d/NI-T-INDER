import PageLayout from "./children/modules/layout/PageLayout";
import ViewAllProfiles from "./children/modules/functional/Explore/ViewAllProfiles";
import ProfileCard from "./children/modules/functional/Explore/ProfileCard";

export default function Explore() {
  return (
    <PageLayout>
      <ViewAllProfiles ProfileCard={ProfileCard} />
    </PageLayout>
  )
} 